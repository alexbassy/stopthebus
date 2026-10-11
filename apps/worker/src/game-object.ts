import { DurableObject } from 'cloudflare:workers'
import type { Game as GameState, ServerMessage } from '@stopthebus/shared'
import { GameRoom, type Connection } from './game-room'

// One per game. Sockets use the hibernation API, so the player a socket is
// bound to lives in its attachment and survives the object being evicted.
export class Game extends DurableObject {
  private room = new GameRoom(
    this.ctx.id.name ?? '',
    {
      get: () => this.ctx.storage.get<GameState>('game'),
      put: (game) => this.ctx.storage.put('game', game),
    },
    (message) => this.ctx.getWebSockets().forEach((ws) => ws.send(JSON.stringify(message))),
  )

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
    await this.room.onMessage(conn, data)
    ws.serializeAttachment({ playerId: conn.playerId })
  }
}
