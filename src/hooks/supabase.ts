import getSupabaseClient from '@/client/supabase'
import { Game } from '@/typings/game'
import { bind } from '@react-rxjs/core'
import { PostgrestError, SupabaseClient, SupabaseRealtimePayload } from '@supabase/supabase-js'
import { map, merge, Observable, of, share, tap } from 'rxjs'
import { filter } from 'rxjs/operators'

enum DatabaseFunctions {
  UpdateLetters = 'game_update_letters',
  UpdateAlliteration = 'game_update_alliteration',
}

function fetchGame(id: string) {
  return new Observable<Game>((subscriber) => {
    const supabase = getSupabaseClient()

    try {
      supabase
        .from<Game>(`game`)
        .select()
        .eq('id', id)
        .limit(1)
        .single()
        .then((response) => {
          subscriber.next(response.data ?? undefined)
        })
    } catch (err) {
      console.log({ err })
    }
  })
}

const subscribeToGame = (id: string) => {
  return new Observable<Game>((subscriber) => {
    const supabase = getSupabaseClient()
    const realtimeSubscription = supabase
      .from<Game>(`game:id=eq.${id}`)
      .on('*', (payload) => {
        subscriber.next(payload.new)
      })
      .subscribe()

    return () => {
      realtimeSubscription.unsubscribe()
    }
  })
}

class Manager {
  constructor() {
    this.client = getSupabaseClient()
  }

  gameId!: string

  client!: SupabaseClient

  sharedGameRequest$!: Observable<Game>

  sharedGameSubscription$!: Observable<Game>

  setId(gameId: string) {
    if (typeof gameId !== 'string') return
    this.gameId = gameId
  }

  logError(error: PostgrestError) {
    console.error(error)
  }

  // Multicasted game rest request
  get fetchGame$() {
    if (!this.gameId) return of(null)
    if (!this.sharedGameRequest$) {
      this.sharedGameRequest$ = fetchGame(this.gameId).pipe(share())
    }
    return this.sharedGameRequest$
  }

  // Multicasted game update subscription
  get gameSubscription$() {
    if (!this.gameId) return of(null)
    if (!this.sharedGameSubscription$) {
      this.sharedGameSubscription$ = subscribeToGame(this.gameId).pipe(share())
    }
    return this.sharedGameSubscription$
  }

  // Emit the game object (rest) and any updates to follow (websocket)
  get game$() {
    return merge(this.gameSubscription$, this.fetchGame$).pipe(filter(Boolean))
  }

  // GAME PLAYERS
  get gamePlayers$() {
    return this.game$.pipe(map((game) => game.players))
  }

  // GAME CONFIG
  get gameConfig$() {
    return this.game$.pipe(map((game) => game.config))
  }

  get gameConfigLetters$() {
    return this.gameConfig$.pipe(map((config) => config.letters.split('')))
  }

  async setGameConfigLetters(letters: string[]) {
    const { error } = await this.client.rpc(DatabaseFunctions.UpdateLetters, {
      game_id: this.gameId,
      new_letters: letters.join(''),
    })
    if (error) {
      this.logError(error)
    }
  }

  get gameConfigAlliteration$() {
    return this.gameConfig$.pipe(map((config) => config.alliteration))
  }

  async setGameConfigAlliteration(alliteration: boolean) {
    const { error } = await this.client.rpc(DatabaseFunctions.UpdateAlliteration, {
      game_id: this.gameId,
      new_alliteration: alliteration,
    })
    if (error) {
      this.logError(error)
    }
  }

  // GAME STATE
}

export const manager = new Manager()

// GAME PLAYERS
export const [useGamePlayers] = bind(() => manager.gamePlayers$, [])

// GAME CONFIG
export const [useGameConfigLetters] = bind(() => manager.gameConfigLetters$, [])
export const [useGameConfigAlliteration] = bind(() => manager.gameConfigAlliteration$, false)

// GAME STATE
