import { FfbGame, FinalScores, Game, GameStage, Player, RoundResults } from '@/typings/game'
import { bind, shareLatest } from '@react-rxjs/core'
import { from, map, merge, Observable, of, ReplaySubject, Subject, throwError, timer } from 'rxjs'
import {
  catchError,
  delayWhen,
  distinctUntilChanged,
  filter,
  mapTo,
  pairwise,
  retryWhen,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs/operators'
import { browserClient, q } from '@/client/fauna'
import { getUserSession, updatePersistedUserName } from '@/helpers/getPersistedPlayer'
import { ExprArg } from 'faunadb'
import { DatabaseFunctions } from '@/constants/database-functions'

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

function queryAsObservable<T = any>(expression: ExprArg): Observable<T> {
  return from(browserClient.query<T>(expression)).pipe(take(1))
}

function fetchGame(id: string) {
  return queryAsObservable<FfbGame>(q.Get(q.Match(q.Index('game_by_id'), id)))
}

const subscribeToGame = (ref: typeof q.Ref) => {
  return new Observable<[boolean | null, Game | null]>((subscriber) => {
    const realtimeSubscription = browserClient.stream
      .document(q.Ref(ref))
      .on('version', (payload) => subscriber.next([null, (payload.document as FfbGame).data]))
      .on('error', () => subscriber.error())
      .on('start', () => subscriber.next([true, null]))
      .start()

    return () => {
      realtimeSubscription.close()
    }
  })
}

class Manager {
  gameId!: string

  isConnected$ = new ReplaySubject<boolean>(1)

  joinState$ = new Subject<JoinState>()

  player$ = new ReplaySubject<Player>(1)

  gameRef$ = new ReplaySubject<typeof q.Ref>(1)

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

  logError(error: Error) {
    console.error(error)
  }

  get isConnectedState$() {
    return this.isConnected$.pipe(shareLatest())
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
      // The game subscription also notifies the manager when
      // the connection has broken by sending an array where
      // the first element is whether the connection is active.
      // It's a bit crappy and I don't love it.
      this.sharedGameSubscription$ = this.gameRef$.pipe(
        switchMap((ref) => subscribeToGame(ref)),
        switchMap(([connection, data]) => {
          if (connection) {
            this.isConnected$.next(true)
            return of()
          } else {
            return of(data as Game)
          }
        }),
        // Retry every 2 seconds if connection breaks
        retryWhen((errors) =>
          errors.pipe(
            tap(() => this.isConnected$.next(false)),
            delayWhen(() => timer(2000)),
            take(15)
          )
        )
      )
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
    return queryAsObservable(
      q.Call(DatabaseFunctions.UpdatePlayerName, this.gameId, playerId, newName)
    )
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
    return queryAsObservable(q.Call(DatabaseFunctions.UpdateLetters, this.gameId, letters.join('')))
      .pipe(
        tap((response: any) => {
          if (response.errors) return throwError(response.errors)
        })
      )
      .subscribe()
  }

  get gameConfigCategories$() {
    return this.gameConfig$.pipe(
      map((config) => config.categories),
      distinctUntilChanged((prev, current) => prev.join('') === current.join(''))
    )
  }

  async toggleCategory(category: string) {
    return queryAsObservable(q.Call(DatabaseFunctions.UpdateCategories, this.gameId, category))
      .subscribe()
      .unsubscribe()
  }

  get gameConfigRounds$() {
    return this.gameConfig$.pipe(map((config) => config.numRounds))
  }

  setGameConfigRounds(rounds: number) {
    return queryAsObservable(q.Call(DatabaseFunctions.UpdateRounds, this.gameId, rounds))
      .subscribe()
      .unsubscribe()
  }

  get gameConfigAlliteration$() {
    return this.gameConfig$.pipe(map((config) => config.alliteration))
  }

  setGameConfigAlliteration(alliteration: boolean) {
    return queryAsObservable(
      q.Call(DatabaseFunctions.UpdateAlliteration, this.gameId, alliteration)
    )
      .subscribe()
      .unsubscribe()
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
          return timer(4500).pipe(
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

  get gameStateFinalScores$(): Observable<FinalScores | undefined> {
    return this.gameState$.pipe(map((state) => state.finalScores))
  }

  get gameStateNextGameId$(): Observable<string | undefined> {
    return this.gameState$.pipe(map((state) => state.nextGameId))
  }

  endRound() {
    return this.gameRef$.pipe(
      switchMap((ref) => from(browserClient.query(q.Call(DatabaseFunctions.EndRound, ref))))
    )
  }

  // GAME CURRENT ROUND
  get gameRound$() {
    return this.game$.pipe(map((game) => game.currentRound))
  }

  get gameRoundIndex$() {
    return this.gameRound$.pipe(
      map((round) => round?.index),
      distinctUntilChanged()
    )
  }

  get gameRoundTimeStarted$() {
    return this.gameRound$.pipe(map((round) => round?.timeStarted ?? 0))
  }

  get gameRoundTimeEnded$() {
    return this.gameRound$.pipe(map((round) => round?.timeEnded ?? 0))
  }

  get gameRoundDuration$() {
    return this.gameRound$.pipe(map((round) => (round?.timeEnded ?? 0) - (round?.timeStarted ?? 0)))
  }

  get gameRoundLetter$() {
    return this.gameRound$.pipe(map((round) => round?.letter))
  }

  get gameRoundEndingPlayer$() {
    return this.gameRound$.pipe(map((round) => round?.endedByPlayer))
  }

  // ROUND ANSWERS

  getRoundAnswers(): Observable<RoundResults> {
    return this.gameRoundIndex$.pipe(
      withLatestFrom(this.player$),
      switchMap(([index, player]) =>
        queryAsObservable(q.Call(DatabaseFunctions.GetRound, this.gameId, player.id, index!))
      ),
      map((response) => (response as any).data.answers as RoundResults),
      take(1),
      catchError((error) => {
        console.log(error)
        return of({} as RoundResults)
      })
    )
  }

  setRoundAnswer(question: string, answer: string) {
    return this.gameRoundIndex$
      .pipe(
        withLatestFrom(this.player$),
        switchMap(([index, player]) =>
          queryAsObservable(
            q.Call(DatabaseFunctions.SaveAnswers, this.gameId, player.id, index!, question, answer)
          )
        )
      )
      .subscribe()
      .unsubscribe()
  }

  setPlayerProgress(category: string) {
    return this.player$
      .pipe(
        switchMap((player) =>
          queryAsObservable(
            q.Call(DatabaseFunctions.UpdateProgress, this.gameId, player.id, category)
          )
        )
      )
      .subscribe()
      .unsubscribe()
  }

  get gameRoundOpponentProgress$() {
    return this.gameRound$.pipe(map((round) => round?.opponentProgress))
  }

  get gameRoundAllAnswers$() {
    return this.gameRound$.pipe(map((round) => round?.answers))
  }

  get gameRoundAnswersByCategory$() {
    return this.gameRound$.pipe(
      map((round) => {
        if (!round) return null
        const answerEntries = Object.entries(round.answers)
        const categories = Object.keys(answerEntries[0][1])
        return Object.fromEntries(
          categories.map((category) => [
            category,
            Object.fromEntries(
              answerEntries.map(([player, playerAnswers]) => [player, playerAnswers[category]])
            ),
          ])
        )
      })
    )
  }

  get gameRoundAllScores$() {
    return this.gameRound$.pipe(map((round) => round?.scores))
  }

  get gameRoundScoresByCategory$() {
    return this.gameRound$.pipe(
      map((round) => {
        if (!round) return null
        const scoreEntries = Object.entries(round.scores)
        const categories = Object.keys(scoreEntries[0][1])
        return Object.fromEntries(
          categories.map((category) => [
            category,
            Object.fromEntries(
              scoreEntries.map(([player, playerAnswers]) => [player, playerAnswers[category]])
            ),
          ])
        )
      })
    )
  }

  // ROUND SCORES
  updateScore(playerId: string, category: string, newScore: number) {
    return queryAsObservable(
      q.Call(DatabaseFunctions.UpdateScore, this.gameId, playerId, category, newScore)
    )
      .subscribe()
      .unsubscribe()
  }
}

export const manager = new Manager()

// INTERNALISH
export const [useJoinState] = bind(() => manager.joinState$, JoinState.NotRequested)
export const [useIsConnected] = bind(() => manager.isConnectedState$, true)

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
export const [useGameStateFinalScores] = bind(() => manager.gameStateFinalScores$, null)
export const [useGameStateNextGameId] = bind(() => manager.gameStateNextGameId$, null)

// GAME ROUNDS
export const [useGameRoundTimeStarted] = bind(() => manager.gameRoundTimeStarted$, 0)
export const [useGameRoundTimeEnded] = bind(() => manager.gameRoundTimeEnded$, 0)
export const [useGameRoundDuration] = bind(() => manager.gameRoundDuration$, 0)
export const [useGameRoundLetter] = bind(() => manager.gameRoundLetter$, null)
export const [useGameRoundIndex] = bind(() => manager.gameRoundIndex$, 0)
export const [useGameRoundEndingPlayer] = bind(() => manager.gameRoundEndingPlayer$, null)
export const [useGameRoundAllAnswers] = bind(() => manager.gameRoundAllAnswers$, null)
export const [useGameRoundAnswersByCategory] = bind(() => manager.gameRoundAnswersByCategory$, null)
export const [useGameRoundAllScores] = bind(() => manager.gameRoundAllScores$, null)
export const [useGameRoundScoresByPlayer] = bind(() => manager.gameRoundScoresByCategory$, null)
export const [usegameRoundOpponentProgress] = bind(() => manager.gameRoundOpponentProgress$, null)
