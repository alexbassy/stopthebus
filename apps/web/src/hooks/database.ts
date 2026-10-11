import { Answers, FinalScores, Game, GameStage, Player, ServerMessage } from '@stopthebus/shared'
import { bind, shareLatest } from '@react-rxjs/core'
import { BehaviorSubject, map, Observable, of, ReplaySubject, Subject, timer } from 'rxjs'
import {
  distinctUntilChanged,
  filter,
  pairwise,
  startWith,
  switchMap,
  take,
  takeUntil,
} from 'rxjs/operators'
import { GameSocket } from '@/client/socket'
import { getUserSession, updatePersistedUserName } from '@/helpers/getPersistedPlayer'

export type GameError = Extract<ServerMessage, { type: 'error' }>

class Manager {
  gameId!: string

  private socket?: GameSocket

  isConnected$ = new BehaviorSubject<boolean>(true)

  // The latest error the server sent, e.g. the game doesn't exist
  error$ = new BehaviorSubject<GameError | null>(null)

  player$ = new ReplaySubject<Player>(1)

  private gameSubject$ = new BehaviorSubject<Game | null>(null)

  private ownAnswers$ = new ReplaySubject<Answers>(1)

  sharedGame$!: Observable<Game>

  // Connects to the game's socket and joins it as the current player. Joins
  // again on every reconnect, which also resyncs the full game state.
  connect(gameId: string) {
    this.disconnect()
    this.gameId = gameId
    this.gameSubject$.next(null)
    this.error$.next(null)
    this.player$.next(getUserSession())
    this.socket = new GameSocket(gameId, {
      onOpen: () => this.join(),
      onConnection: (isConnected) => this.isConnected$.next(isConnected),
      onMessage: (message) => {
        if (message.type === 'state') {
          this.error$.next(null)
          this.gameSubject$.next(message.game)
        } else if (message.type === 'answers') this.ownAnswers$.next(message.answers)
        else this.error$.next(message)
      },
    })
  }

  disconnect() {
    this.socket?.close()
    this.socket = undefined
  }

  join() {
    this.socket?.send({ type: 'join', player: getUserSession() })
  }

  leave() {
    this.socket?.send({ type: 'leave' })
  }

  get isConnectedState$() {
    return this.isConnected$.pipe(shareLatest())
  }

  // Every state the server sends, as the full game
  get game$() {
    if (!this.sharedGame$) {
      this.sharedGame$ = this.gameSubject$.pipe(filter(Boolean), shareLatest())
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

  setGamePlayerName(newName: string) {
    const name = newName.trim()
    if (!name) return
    updatePersistedUserName(name)
    this.player$.next(getUserSession())
    this.socket?.send({ type: 'rename', name })
  }

  // GAME CONFIG
  get gameConfig$() {
    return this.game$.pipe(map((game) => game.config))
  }

  get gameConfigLetters$() {
    return this.gameConfig$.pipe(map((config) => config.letters.split('')))
  }

  setGameConfigLetters(letters: string[]) {
    this.socket?.send({ type: 'updateConfig', config: { letters: letters.join('') } })
  }

  get gameConfigCategories$() {
    return this.gameConfig$.pipe(
      map((config) => config.categories),
      distinctUntilChanged((prev, current) => prev.join('') === current.join('')),
    )
  }

  toggleCategory(category: string) {
    this.socket?.send({ type: 'toggleCategory', category })
  }

  get gameConfigRounds$() {
    return this.gameConfig$.pipe(map((config) => config.numRounds))
  }

  setGameConfigRounds(numRounds: number) {
    this.socket?.send({ type: 'updateConfig', config: { numRounds } })
  }

  get gameConfigAlliteration$() {
    return this.gameConfig$.pipe(map((config) => config.alliteration))
  }

  setGameConfigAlliteration(alliteration: boolean) {
    this.socket?.send({ type: 'updateConfig', config: { alliteration } })
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
          (oldStage === GameStage.pre || oldStage === GameStage.review) &&
          newStage === GameStage.active
        if (isStartingRound) {
          return timer(4500).pipe(
            takeUntil(this.cancelTimer$),
            map(() => newStage),
          )
        }

        // If cancelling the start of the round, kill the timer
        if (oldStage === GameStage.active) {
          this.cancelTimer$.next(true)
        }
        return of(newStage)
      }),
    )
  }

  get gameStateFinalScores$(): Observable<FinalScores | undefined> {
    return this.gameState$.pipe(map((state) => state.finalScores))
  }

  get gameStateNextGameId$(): Observable<string | undefined> {
    return this.gameState$.pipe(map((state) => state.nextGameId))
  }

  start() {
    this.socket?.send({ type: 'start' })
  }

  cancelStart() {
    this.socket?.send({ type: 'cancelStart' })
  }

  // The sender becomes the stopper
  stop() {
    this.socket?.send({ type: 'stop' })
  }

  // GAME CURRENT ROUND
  get gameRound$() {
    return this.game$.pipe(map((game) => game.currentRound))
  }

  get gameRoundIndex$() {
    return this.gameRound$.pipe(
      map((round) => round?.index),
      distinctUntilChanged(),
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
    return this.gameRound$.pipe(map((round) => round?.stopperId))
  }

  // ROUND ANSWERS

  // The player's own saved answers, sent by the server when they join mid-round
  getRoundAnswers(): Observable<Answers> {
    return this.ownAnswers$.pipe(take(1))
  }

  setRoundAnswer(category: string, answer: string) {
    this.socket?.send({ type: 'saveAnswer', category, answer })
  }

  setPlayerProgress(category: string) {
    this.socket?.send({ type: 'setProgress', category })
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
              answerEntries.map(([player, playerAnswers]) => [player, playerAnswers[category]]),
            ),
          ]),
        )
      }),
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
              scoreEntries.map(([player, playerAnswers]) => [player, playerAnswers[category]]),
            ),
          ]),
        )
      }),
    )
  }

  // ROUND SCORES
  updateScore(playerId: string, category: string, score: number) {
    this.socket?.send({ type: 'setScore', playerId, category, score })
  }
}

export const manager = new Manager()

// INTERNALISH
export const [useGameError] = bind(() => manager.error$, null)
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
