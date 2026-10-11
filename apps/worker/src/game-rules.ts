import {
  ClientMessageSchema,
  Game,
  GameStage,
  Player,
  ServerMessage,
  type ErrorCode,
} from '@stopthebus/shared'
import { createGameConfig, createGameState } from './lib/game'

export interface Store {
  get(): Promise<Game | undefined>
  put(game: Game): Promise<void>
}

// One connected WebSocket. `playerId` is set when the socket joins a game and
// from then on it is the only player the socket may edit.
export interface Connection {
  playerId?: string
  send(message: ServerMessage): void
}

// The game's rules, free of Cloudflare APIs so tests can drive it directly.
// The Durable Object wires it to real storage and sockets.
export class GameRules {
  constructor(
    private id: string,
    private store: Store,
    private broadcast: (message: ServerMessage) => void,
  ) {}

  async onMessage(conn: Connection, raw: string) {
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
    const save = async (next: Game) => {
      await this.store.put(next)
      this.broadcast({ type: 'state', game: next })
    }

    if (msg.type === 'create') {
      if (game) return fail('refused', 'A game with that name already exists')
      conn.playerId = msg.player.id
      return save(newGame(this.id, msg.player))
    }

    if (!game) return fail('notFound', 'There’s no game by that name here')

    switch (msg.type) {
      case 'join': {
        if (conn.playerId && conn.playerId !== msg.player.id) {
          return fail('forbidden', 'This connection belongs to another player')
        }
        const isInGame = game.players.some((p) => p.id === msg.player.id)
        if (!isInGame && game.state.stage !== GameStage.pre) {
          return fail('refused', 'The game has already started')
        }
        conn.playerId = msg.player.id
        // Joining twice changes nothing, but still gets the sender the state
        if (isInGame) return conn.send({ type: 'state', game })
        return save({ ...game, players: [...game.players, msg.player] })
      }
      case 'leave': {
        // Once play has begun players stay in the game so they can come back
        if (game.state.stage !== GameStage.pre) return
        const players = game.players.filter((p) => p.id !== conn.playerId)
        if (players.length === game.players.length) return
        return save({ ...game, players })
      }
      case 'rename': {
        if (!conn.playerId) return fail('forbidden', 'Join the game first')
        if (!game.players.some((p) => p.id === conn.playerId)) return
        const players = game.players.map((p) =>
          p.id === conn.playerId ? { ...p, name: msg.name } : p,
        )
        return save({ ...game, players })
      }
      default:
        return fail('refused', `"${msg.type}" is not supported yet`)
    }
  }
}

function newGame(id: string, creator: Player): Game {
  return {
    id,
    state: createGameState(),
    config: createGameConfig(),
    currentRound: null,
    previousRounds: null,
    players: [creator],
  }
}
