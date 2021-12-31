import { setLetters } from '@/client/rest'
import getSupabaseClient from '@/client/supabase'
import { DatabaseFunctions } from '@/constants/database-functions'
import { Game, GameStage } from '@/typings/game'
import { bind, shareLatest } from '@react-rxjs/core'
import { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { map, merge, Observable, of, share, Subject, timer } from 'rxjs'
import { distinct, filter, pairwise, startWith, switchMap, takeUntil, tap } from 'rxjs/operators'

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
      this.sharedGameRequest$ = fetchGame(this.gameId).pipe(shareLatest())
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

  async setGamePlayerName(playerId: string, newName: string) {
    const { error } = await this.client.rpc(DatabaseFunctions.UpdatePlayerName, {
      game_id: this.gameId,
      player_id: playerId,
      new_name: newName,
    })
    if (error) {
      this.logError(error)
    }
  }

  // GAME CONFIG
  get gameConfig$() {
    return this.game$.pipe(map((game) => game.config))
  }

  get gameConfigLetters$() {
    return this.gameConfig$.pipe(map((config) => config.letters.split('')))
  }

  async setGameConfigLetters(letters: string[]) {
    setLetters(this.gameId, letters.join(''))
  }

  get gameConfigCategories$() {
    return this.gameConfig$.pipe(map((config) => config.categories))
  }

  async setGameConfigCategories(categories: string[]) {
    const { error } = await this.client.rpc(DatabaseFunctions.UpdateCategories, {
      game_id: this.gameId,
      new_categories: categories,
    })
    if (error) {
      this.logError(error)
    }
  }

  get gameConfigRounds$() {
    return this.gameConfig$.pipe(map((config) => config.numRounds))
  }

  async setGameConfigRounds(rounds: number) {
    const { error } = await this.client.rpc(DatabaseFunctions.UpdateRounds, {
      game_id: this.gameId,
      new_rounds: rounds,
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
  get gameState$() {
    return this.game$.pipe(map((game) => game.state))
  }

  cancelTimer$ = new Subject<boolean>()

  // When stage is set to active, the consumer
  get gameStateStage$() {
    return this.gameState$.pipe(
      map((state) => state.stage),
      // Pairwise emits in twos, so we need to kick it off
      startWith(null),
      // Allow previous and next values to be compared
      pairwise(),
      switchMap(([oldStage, newStage]) => {
        // If the round is being started, delay the `stage` update to the view
        // layer so that the countdown can be shown
        const isStartingRound =
          (oldStage === GameStage.PRE || oldStage === GameStage.REVIEW) &&
          newStage === GameStage.ACTIVE
        if (isStartingRound) {
          const delay$ = timer(3000).pipe(
            takeUntil(this.cancelTimer$),
            map(() => newStage)
          )
          return delay$
        }

        // If cancelling the start of the round, kill the timer
        if (oldStage === GameStage.ACTIVE) {
          this.cancelTimer$.next(true)
        }
        return of(newStage)
      })
    )
  }

  // GAME CURRENT ROUND
  get gameRound$() {
    return this.game$.pipe(map((game) => game.currentRound))
  }

  get gameRoundTimeStarted$() {
    return this.gameRound$.pipe(map((round) => round?.timeStarted ?? 0))
  }

  get gameRoundLetter$() {
    return this.gameRound$.pipe(map((round) => round?.letter))
  }
}

export const manager = new Manager()

// GAME PLAYERS
export const [useGamePlayers] = bind(() => manager.gamePlayers$, [])

// GAME CONFIG
export const [useGameConfigLetters] = bind(() => manager.gameConfigLetters$, [])
export const [useGameConfigCategories] = bind(() => manager.gameConfigCategories$, [])
export const [useGameConfigRounds] = bind(() => manager.gameConfigRounds$, 0)
export const [useGameConfigAlliteration] = bind(() => manager.gameConfigAlliteration$, false)

// GAME STATE
export const [useGameStateStage] = bind(() => manager.gameStateStage$, null)

// GAME ROUNDS
export const [useGameRoundTimeStarted] = bind(() => manager.gameRoundTimeStarted$, null)
export const [useGameRoundLetter] = bind(() => manager.gameRoundLetter$, null)
