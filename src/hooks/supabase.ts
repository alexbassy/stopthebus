import getSupabaseClient from '@/client/supabase'
import { DatabaseFunctions } from '@/constants/database-functions'
import { Game, GameConfig, GameStage } from '@/typings/game'
import { bind, shareLatest } from '@react-rxjs/core'
import { PostgrestError } from '@supabase/supabase-js'
import { from, map, merge, Observable, of, ReplaySubject, Subject, timer } from 'rxjs'
import {
  distinctUntilChanged,
  filter,
  mapTo,
  pairwise,
  startWith,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators'
import { browserClient, q } from '@/client/fauna'

export enum JoinState {
  NotRequested,
  Requested,
  CanJoin,
  CannotJoin,
}

type GameResponse = {
  ref: typeof q.Ref
  ts: number
  data: Game
}

function fetchGame(id: string) {
  return new Observable<GameResponse>((subscriber) => {
    try {
      browserClient.query(q.Get(q.Match(q.Index('game_by_id'), id))).then((response) => {
        subscriber.next((response as GameResponse) ?? undefined)
      })
    } catch (err) {
      console.log({ err })
    }
  })
}

const subscribeToGame = (ref: typeof q.Ref) => {
  return new Observable<Game>((subscriber) => {
    const realtimeSubscription = browserClient.stream
      .document(q.Ref(ref))
      .on('version', (payload) => {
        console.log({ payload })
        subscriber.next(payload.document.data)
      })
      .start()

    return () => {
      realtimeSubscription.close()
    }
  })
}

class Manager {
  gameId!: string

  joinState$ = new Subject<JoinState>()

  gameRef$ = new ReplaySubject<typeof q.Ref>(1)

  client = getSupabaseClient()

  sharedGameRequest$!: Observable<Game>

  sharedGameSubscription$!: Observable<Game>

  setId(gameId: string) {
    if (typeof gameId !== 'string') return
    this.gameId = gameId
  }

  setJoinState(state: JoinState) {
    this.joinState$.next(state)
  }

  get canJoin$() {
    return this.joinState$.pipe(
      filter((state) => state === JoinState.CanJoin),
      mapTo(true)
    )
  }

  logError(error: PostgrestError) {
    console.error(error)
  }

  // Multicasted game rest request
  get fetchGame$() {
    if (!this.gameId) return of(null)
    if (!this.sharedGameRequest$) {
      this.sharedGameRequest$ = this.canJoin$.pipe(
        switchMap(() => fetchGame(this.gameId)),
        tap((data) => this.gameRef$.next(data.ref)),
        map((res) => res.data),
        shareLatest()
      )
    }
    return this.sharedGameRequest$
  }

  // Multicasted game update subscription
  get gameSubscription$() {
    if (!this.gameId) return of(null)
    if (!this.sharedGameSubscription$) {
      this.sharedGameSubscription$ = this.gameRef$.pipe(
        switchMap((ref) => subscribeToGame(ref)),
        shareLatest()
      )
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
    const { error } = await this.client.rpc(DatabaseFunctions.UpdateLetters, {
      game_id: this.gameId,
      new_letters: letters.join(''),
    })
    if (error) {
      this.logError(error)
    }
  }

  get gameConfigCategories$() {
    return this.gameConfig$.pipe(map((config) => config.categories))
  }

  async setGameConfigCategories(categories: string[]) {
    const payload: Partial<GameConfig> = { categories }

    const res = this.gameRef$
      .pipe(
        tap(() => console.log('gameRef')),
        switchMap((ref) => from(browserClient.query(q.Update(ref, { data: { config: payload } }))))
      )
      .subscribe()
  }

  get gameConfigRounds$() {
    3
    return this.gameConfig$.pipe(map((config) => config.numRounds))
  }

  async setGameConfigRounds(rounds: number) {
    const payload: Partial<GameConfig> = {
      numRounds: rounds,
    }

    const res = this.gameRef$
      .pipe(
        switchMap((ref) => from(browserClient.query(q.Update(ref, { data: { config: payload } }))))
      )
      .subscribe()
    console.log(res)
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

  // When stage is set to active, the consumer will receive the update after a delay
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
          return timer(3000).pipe(
            takeUntil(this.cancelTimer$),
            map(() => newStage)
          )
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

// INTERNALISH
export const [useJoinState] = bind(() => manager.joinState$, JoinState.NotRequested)

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
