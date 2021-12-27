import getSupabaseClient from '@/client/supabase'
import { IGame } from '@/typings/supabase'
import { bind } from '@react-rxjs/core'
import { SupabaseRealtimePayload } from '@supabase/supabase-js'
import { map, merge, Observable, of, share, tap } from 'rxjs'
import { filter } from 'rxjs/operators'

type Payload = SupabaseRealtimePayload<any>

function fetchGame(id: string) {
  return new Observable<IGame>((subscriber) => {
    const supabase = getSupabaseClient()

    try {
      supabase
        .from<IGame>(`game`)
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
  return new Observable<IGame>((subscriber) => {
    const supabase = getSupabaseClient()
    const realtimeSubscription = supabase
      .from<IGame>(`game:id=eq.${id}`)
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
    console.log('instantiated')
  }

  gameId!: string

  sharedGameRequest$!: Observable<IGame>

  sharedGameSubscription$!: Observable<IGame>

  setId(gameId: string) {
    if (typeof gameId !== 'string') return
    this.gameId = gameId
  }

  get fetchGame$() {
    if (!this.gameId) return of(null)
    if (!this.sharedGameRequest$) {
      this.sharedGameRequest$ = fetchGame(this.gameId).pipe(share())
    }
    return this.sharedGameRequest$
  }

  get gameSubscription$() {
    if (!this.gameId) return of(null)
    if (!this.sharedGameSubscription$) {
      this.sharedGameSubscription$ = subscribeToGame(this.gameId).pipe(share())
    }
    return this.sharedGameSubscription$
  }

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

  get gameConfigAlliteration$() {
    return this.gameConfig$.pipe(map((config) => config.alliteration))
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
