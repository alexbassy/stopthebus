import { DurableObject } from 'cloudflare:workers'
import { hri } from 'human-readable-ids'
import type { Game as GameState, GameConfig, RoundAnswers, ServerMessage } from '@stopthebus/shared'
import { GameRules, type Connection } from './game-rules'

type Bindings = { GAME: DurableObjectNamespace<Game> }

// One per game. Sockets use the hibernation API, so the player a socket is
// bound to lives in its attachment and survives the object being evicted.
export class Game extends DurableObject<Bindings> {
  private rules = new GameRules(
    this.ctx.id.name ?? '',
    {
      get: () => this.ctx.storage.get<GameState>('game'),
      put: (game) => this.ctx.storage.put('game', game),
      getAnswers: () => this.ctx.storage.get<RoundAnswers>('answers'),
      putAnswers: (answers) => this.ctx.storage.put('answers', answers),
    },
    (message) => this.ctx.getWebSockets().forEach((ws) => ws.send(JSON.stringify(message))),
    {
      now: () => Date.now(),
      setAlarm: (at) => this.ctx.storage.setAlarm(at),
      newGameId: () => hri.random(),
      createGame: (id, config) =>
        this.env.GAME.get(this.env.GAME.idFromName(id)).createWithConfig(config),
    },
  )

  // Called by another game's Durable Object when it finishes, to set up the rematch
  createWithConfig(config: GameConfig): Promise<void> {
    return this.rules.createWithConfig(config)
  }

  async alarm() {
    await this.rules.onAlarm()
  }

  async fetch(request: Request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected a WebSocket', { status: 426 })
    }
    const { 0: client, 1: server } = new WebSocketPair()
    this.ctx.acceptWebSocket(server)
    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer) {
    if (typeof data !== 'string') return
    const conn: Connection = {
      playerId: ws.deserializeAttachment()?.playerId,
      send: (message: ServerMessage) => ws.send(JSON.stringify(message)),
    }
    await this.rules.onMessage(conn, data)
    ws.serializeAttachment({ playerId: conn.playerId })
  }
}
