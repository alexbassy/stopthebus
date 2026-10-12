import {
  ClientMessageSchema,
  type ErrorCode,
  Game,
  GameConfig,
  GameStage,
  Player,
  Round,
  RoundAnswers,
  ServerMessage,
  getFinalScores,
  getInitialScores,
} from '@stopthebus/shared'

import { createGameConfig, createGameConfigFromPrevious, createGameState } from './lib/game'

export interface Store {
  get(): Promise<Game | undefined>
  put(game: Game): Promise<void>
  // The current round's answers, kept apart from the game so that the state
  // we broadcast can never include them
  getAnswers(): Promise<RoundAnswers | undefined>
  putAnswers(answers: RoundAnswers): Promise<void>
  // Players who have sent their final answers since the round was stopped
  getSubmitted(): Promise<string[] | undefined>
  putSubmitted(playerIds: string[]): Promise<void>
  // When the game last received a message
  getActivity(): Promise<number | undefined>
  putActivity(at: number): Promise<void>
  // Deletes everything the game has stored
  clear(): Promise<void>
}

// What the rules need from the outside world
export interface Env {
  now(): number
  // Wakes the game at `at` (ms since epoch) by calling `onAlarm`
  setAlarm(at: number): Promise<void>
  newGameId(): string
  // Creates the rematch game, with no players
  createGame(id: string, config: GameConfig): Promise<void>
}

// One connected WebSocket. `playerId` is set when the socket joins a game and
// from then on it is the only player the socket may edit.
export interface Connection {
  playerId?: string
  send(message: ServerMessage): void
}

// Clients show the countdown from the start time, so it is set a little ahead
export const START_DELAY_MS = 3500
// The longest the other players have to get their final answers in after a
// Stop. The round is reviewed sooner if everyone has submitted.
export const STOP_GRACE_MS = 5000
// A game with no activity for this long is deleted
export const EXPIRY_MS = 24 * 60 * 60 * 1000

// The game's rules, free of Cloudflare APIs so tests can drive it directly.
// The Durable Object wires it to real storage and sockets.
export class GameRules {
  constructor(
    private id: string,
    private store: Store,
    private broadcast: (message: ServerMessage) => void,
    private env: Env,
  ) {}

  async onMessage(conn: Connection, raw: string) {
    await this.handle(conn, raw)
    await this.touch()
  }

  private async handle(conn: Connection, raw: string) {
    const fail = (code: ErrorCode, message: string) => conn.send({ type: 'error', code, message })

    let json: unknown
    try {
      json = JSON.parse(raw)
    } catch {
      return fail('invalid', 'Message is not valid JSON')
    }
    const parsed = ClientMessageSchema.safeParse(json)
    if (!parsed.success) return fail('invalid', 'Message does not match the protocol')
    const msg = parsed.data

    const game = await this.store.get()
    const save = (next: Game) => this.save(next)

    if (msg.type === 'create') {
      if (game) return fail('refused', 'A game with that name already exists')
      conn.playerId = msg.player.id
      return save(newGame(this.id, createGameConfig(), [msg.player]))
    }

    if (!game) return fail('notFound', 'There’s no game by that name here')

    const { stage } = game.state
    const round = game.currentRound
    const isMember = (id: string | undefined) => game.players.some((p) => p.id === id)

    switch (msg.type) {
      case 'join': {
        if (conn.playerId && conn.playerId !== msg.player.id) {
          return fail('forbidden', 'This connection belongs to another player')
        }
        const isInGame = isMember(msg.player.id)
        if (!isInGame && stage !== GameStage.pre) {
          return fail('refused', 'The game has already started')
        }
        conn.playerId = msg.player.id
        if (!isInGame) return save({ ...game, players: [...game.players, msg.player] })
        // Joining twice changes nothing, but the sender still gets the state
        // and, mid-round, their own saved answers back
        conn.send({ type: 'state', game })
        if (stage === GameStage.active) {
          const answers = (await this.store.getAnswers()) ?? {}
          conn.send({ type: 'answers', answers: answers[msg.player.id] ?? {} })
        }
        return
      }
      case 'leave': {
        // Once play has begun players stay in the game so they can come back
        if (stage !== GameStage.pre) return
        const players = game.players.filter((p) => p.id !== conn.playerId)
        if (players.length === game.players.length) return
        return save({ ...game, players })
      }
      case 'rename': {
        if (!conn.playerId) return fail('forbidden', 'Join the game first')
        if (!isMember(conn.playerId)) return
        const players = game.players.map((p) =>
          p.id === conn.playerId ? { ...p, name: msg.name } : p,
        )
        return save({ ...game, players })
      }
    }

    // Everything below is for players in the game
    const me = conn.playerId
    if (!me || !isMember(me)) return fail('forbidden', 'Join the game first')

    switch (msg.type) {
      case 'updateConfig': {
        if (stage !== GameStage.pre) return fail('refused', 'The game has already started')
        return save({ ...game, config: { ...game.config, ...msg.config } })
      }
      case 'toggleCategory': {
        if (stage !== GameStage.pre) return fail('refused', 'The game has already started')
        const { categories } = game.config
        const next = categories.includes(msg.category)
          ? categories.filter((c) => c !== msg.category)
          : [...categories, msg.category]
        return save({ ...game, config: { ...game.config, categories: next } })
      }
      case 'start': {
        if (stage !== GameStage.pre && stage !== GameStage.review) {
          return fail('refused', 'The game is either finished or already in play')
        }
        const previousRounds = [...(game.previousRounds ?? [])]
        if (round?.timeEnded) previousRounds.push(round)

        if (round && round.index === game.config.numRounds - 1) {
          return this.finish(game, previousRounds)
        }

        const letters = game.config.letters
          .split('')
          .filter((letter) => !previousRounds.some((r) => r.letter === letter))
        if (!letters.length) return fail('refused', 'There are no letters left to play')

        const next: Round = {
          index: previousRounds.length,
          letter: letters[Math.floor(Math.random() * letters.length)],
          timeStarted: this.env.now() + START_DELAY_MS,
          timeEnded: null,
          stopperId: null,
          opponentProgress: null,
          answers: {},
          scores: {},
        }
        await this.store.putAnswers({})
        await this.store.putSubmitted([])
        return save({
          ...game,
          state: { stage: GameStage.active },
          previousRounds,
          currentRound: next,
        })
      }
      case 'cancelStart': {
        // Too late once someone has stopped the round
        if (stage !== GameStage.active || round?.timeEnded) {
          return fail('refused', 'The game has not been started')
        }
        // Go back to the round being reviewed, if there was one
        const previousRounds = [...(game.previousRounds ?? [])]
        const reviewed = previousRounds.pop() ?? null
        await this.store.putAnswers({})
        await this.store.putSubmitted([])
        return save({
          ...game,
          state: { stage: reviewed ? GameStage.review : GameStage.pre },
          previousRounds: previousRounds.length ? previousRounds : null,
          currentRound: reviewed,
        })
      }
      case 'saveAnswers': {
        if (stage !== GameStage.active || !round) return fail('refused', 'No round is in play')
        if (!Object.keys(msg.answers).every((c) => game.config.categories.includes(c))) {
          return fail('invalid', 'Unknown category')
        }
        const answers = (await this.store.getAnswers()) ?? {}
        await this.store.putAnswers({ ...answers, [me]: { ...answers[me], ...msg.answers } })
        conn.send({ type: 'answersSaved', final: msg.final ?? false })
        // Once everyone has sent their final answers there is no need to wait
        // out the rest of the grace window
        if (msg.final && round.timeEnded) {
          const submitted = new Set([...((await this.store.getSubmitted()) ?? []), me])
          await this.store.putSubmitted([...submitted])
          if (game.players.every((p) => submitted.has(p.id))) await this.review(game, round)
        }
        return
      }
      case 'setProgress': {
        if (stage !== GameStage.active || !round) return fail('refused', 'No round is in play')
        return save({
          ...game,
          currentRound: {
            ...round,
            opponentProgress: { ...round.opponentProgress, [me]: msg.category },
          },
        })
      }
      case 'stop': {
        if (stage !== GameStage.active || !round || round.timeEnded) {
          return fail('refused', 'No round is in play')
        }
        const timeEnded = this.env.now()
        // The other players get a moment to send their final answers; `arm`
        // sets an alarm for the end of it, so a restart can't strand the game
        return save({ ...game, currentRound: { ...round, stopperId: me, timeEnded } })
      }
      case 'setScore': {
        if (stage !== GameStage.review || !round) return fail('refused', 'Not in review')
        if (!round.scores[msg.playerId] || !game.config.categories.includes(msg.category)) {
          return fail('invalid', 'Unknown player or category')
        }
        const scores = {
          ...round.scores,
          [msg.playerId]: { ...round.scores[msg.playerId], [msg.category]: msg.score },
        }
        return save({ ...game, currentRound: { ...round, scores } })
      }
    }
  }

  private async save(game: Game) {
    await this.store.put(game)
    this.broadcast({ type: 'state', game })
  }

  // Records activity and pushes the expiry back. Games that don't exist have
  // nothing to expire, so merely connecting to a random name sets no alarm.
  private async touch() {
    const game = await this.store.get()
    if (!game) return
    const now = this.env.now()
    await this.store.putActivity(now)
    await this.arm(game, now)
  }

  // There is one alarm per Durable Object, so it is set to whichever comes
  // first: the end of the grace window after a Stop, or the game expiring.
  private async arm(game: Game, lastActivity: number) {
    const round = game.currentRound
    const stopDeadline =
      game.state.stage === GameStage.active && round?.timeEnded
        ? round.timeEnded + STOP_GRACE_MS
        : Infinity
    await this.env.setAlarm(Math.min(lastActivity + EXPIRY_MS, stopDeadline))
  }

  // Called when the alarm fires: deletes an idle game, or once the grace window
  // after a Stop is over, scores the round and moves the game to review. Reads
  // the game afresh, because answers keep arriving during the window.
  async onAlarm() {
    const game = await this.store.get()
    if (!game) return

    const now = this.env.now()
    const lastActivity = (await this.store.getActivity()) ?? now
    if (now >= lastActivity + EXPIRY_MS) return this.store.clear()

    const round = game.currentRound
    if (
      game.state.stage === GameStage.active &&
      round?.timeEnded &&
      now >= round.timeEnded + STOP_GRACE_MS
    ) {
      await this.review(game, round)
    }
    // Not due yet, or nothing left to do but wait for expiry
    await this.arm((await this.store.get()) ?? game, lastActivity)
  }

  private async review(game: Game, round: Round) {
    const saved = (await this.store.getAnswers()) ?? {}
    const { categories } = game.config
    // Missing answers become empty strings
    const answers: RoundAnswers = Object.fromEntries(
      game.players.map(({ id }) => [
        id,
        Object.fromEntries(categories.map((c) => [c, saved[id]?.[c] ?? ''])),
      ]),
    )
    const scores = getInitialScores(answers, round.letter, game.config, game.players)

    await this.store.putAnswers({})
    await this.store.putSubmitted([])
    await this.save({
      ...game,
      state: { stage: GameStage.review },
      currentRound: { ...round, answers, scores, opponentProgress: null },
    })
  }

  private async finish(game: Game, rounds: Round[]) {
    // Create the rematch first, so the link we hand out always leads somewhere
    const nextGameId = this.env.newGameId()
    await this.env.createGame(
      nextGameId,
      createGameConfigFromPrevious(
        game.config,
        rounds.map((r) => r.letter),
      ),
    )
    // Another Start may have finished the game while we were creating it
    if ((await this.store.get())?.state.stage === GameStage.finished) return
    await this.save({
      ...game,
      state: { stage: GameStage.finished, finalScores: getFinalScores(rounds), nextGameId },
      previousRounds: rounds,
      currentRound: null,
    })
  }

  // Sets up a game that has no players yet: the rematch of a finished game
  async createWithConfig(config: GameConfig) {
    if (await this.store.get()) return
    await this.store.put(newGame(this.id, config, []))
    await this.touch()
  }
}

function newGame(id: string, config: GameConfig, players: Player[]): Game {
  return {
    id,
    state: createGameState(),
    config,
    currentRound: null,
    previousRounds: null,
    players,
  }
}
