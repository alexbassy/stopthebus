import getSupabaseClient from '@/client/supabase'
import { DatabaseFunctions } from '@/constants/database-functions'
import { Game, GameStage, Player, RoundResults } from '@/typings/game'
import { bind, shareLatest } from '@react-rxjs/core'
import { PostgrestError } from '@supabase/supabase-js'
import {
  combineLatest,
  from,
  map,
  merge,
  Observable,
  of,
  ReplaySubject,
  Subject,
  throwError,
  timer,
} from 'rxjs'
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
import { getUserSession, updatePersistedUserName } from '@/helpers/getPersistedPlayer'

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

  player$ = new ReplaySubject<Player>(1)

  gameRef$ = new ReplaySubject<typeof q.Ref>(1)

  client = getSupabaseClient()

  sharedGameRequest$!: Observable<Game>

  sharedGameSubscription$!: Observable<Game>

  sharedGame$!: Observable<Game>

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
      mapTo(true),
      distinctUntilChanged()
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
        tap((data) => {
          this.gameRef$.next(data.ref)
          this.player$.next(getUserSession())
        }),
        map((res) => res.data)
      )
    }
    return this.sharedGameRequest$
  }

  // Multicasted game update subscription
  get gameSubscription$() {
    if (!this.gameId) return of(null)
    if (!this.sharedGameSubscription$) {
      this.sharedGameSubscription$ = this.gameRef$.pipe(switchMap((ref) => subscribeToGame(ref)))
    }
    return this.sharedGameSubscription$
  }

  // Emit the game object (rest) and any updates to follow (websocket)
  get game$() {
    if (!this.sharedGame$) {
      this.sharedGame$ = merge(this.gameSubscription$, this.fetchGame$).pipe(
        filter(Boolean),
        shareLatest()
      )
    }
    return this.sharedGame$
  }

  // GAME PLAYERS
  get gamePlayers$() {
    return this.game$.pipe(map((game) => game.players))
  }

  get gamePlayer$() {
    return this.player$.pipe(shareLatest())
  }

  async setGamePlayerName(playerId: string, newName: string) {
    return from(browserClient.query(q.Call('update-nickname', this.gameId, playerId, newName)))
      .pipe(
        tap(() => {
          updatePersistedUserName(newName)
          this.player$.next(getUserSession())
        })
      )
      .subscribe()
  }

  // GAME CONFIG
  get gameConfig$() {
    return this.game$.pipe(map((game) => game.config))
  }

  get gameConfigLetters$() {
    return this.gameConfig$.pipe(map((config) => config.letters.split('')))
  }

  async setGameConfigLetters(letters: string[]) {
    return from(browserClient.query(q.Call('update-letters', this.gameId, letters.join(''))))
      .pipe(
        tap((response: any) => {
          if (response.errors) return throwError(response.errors)
        })
      )
      .subscribe()
  }

  get gameConfigCategories$() {
    return this.gameConfig$.pipe(map((config) => config.categories))
  }

  async toggleCategory(category: string) {
    return from(browserClient.query(q.Call('update-categories', this.gameId, category))).subscribe()
  }

  get gameConfigRounds$() {
    return this.gameConfig$.pipe(map((config) => config.numRounds))
  }

  async setGameConfigRounds(rounds: number) {
    return from(browserClient.query(q.Call('update-rounds', this.gameId, rounds))).subscribe()
  }

  get gameConfigAlliteration$() {
    return this.gameConfig$.pipe(map((config) => config.alliteration))
  }

  async setGameConfigAlliteration(alliteration: boolean) {
    return from(
      browserClient.query(q.Call('update-alliteration', this.gameId, alliteration))
    ).subscribe()
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

  endRound() {
    const endGame = async (ref: typeof q.Ref) => browserClient.query(q.Call('end-round', ref))
    return this.gameRef$.pipe(switchMap((ref) => from(endGame(ref))))
  }

  // GAME CURRENT ROUND
  get gameRound$() {
    return this.game$.pipe(map((game) => game.currentRound))
  }

  get gameRoundIndex$() {
    return this.gameRound$.pipe(map((round) => round?.index))
  }

  get gameRoundTimeStarted$() {
    return this.gameRound$.pipe(map((round) => round?.timeStarted ?? 0))
  }

  get gameRoundLetter$() {
    return this.gameRound$.pipe(map((round) => round?.letter))
  }

  getRoundAnswers(): Observable<RoundResults> {
    const getRound = (player: string, round: number) =>
      browserClient.query(q.Call('get-round', this.gameId, player, round))
    return combineLatest([this.player$, this.gameRoundIndex$]).pipe(
      switchMap(([player, index]) => from(getRound(player.id, index!))),
      map((response) => (response as any).data.answers as RoundResults)
    )
  }

  // ROUND ANSWERS
  async setRoundAnswer(question: string, answer: string) {
    const saveAnswers = (player: string, round: number) =>
      browserClient.query(q.Call('save-answers', this.gameId, player, round, question, answer))
    return combineLatest([this.player$, this.gameRoundIndex$])
      .pipe(switchMap(([player, index]) => from(saveAnswers(player.id, index!))))
      .subscribe()
  }
}

export const manager = new Manager()

// INTERNALISH
export const [useJoinState] = bind(() => manager.joinState$, JoinState.NotRequested)

// GAME PLAYERS
export const [useGamePlayer] = bind(() => manager.gamePlayer$, null)
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
