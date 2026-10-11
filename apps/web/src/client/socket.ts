import { ClientMessage, Player, ServerMessage, ServerMessageSchema } from '@stopthebus/shared'

export const RETRY_DELAY_MS = 2000
export const MAX_RETRIES = 15

function socketUrl(gameId: string) {
  const scheme = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${scheme}://${location.host}/ws/${encodeURIComponent(gameId)}`
}

function parse(data: unknown): ServerMessage | null {
  try {
    const result = ServerMessageSchema.safeParse(JSON.parse(String(data)))
    if (result.success) return result.data
    console.error('Ignoring a message that does not match the protocol', result.error)
  } catch (error) {
    console.error('Ignoring a message that is not JSON', error)
  }
  return null
}

// A game's WebSocket. After a drop it reconnects every 2 seconds, giving up
// after 15 failed attempts. `onOpen` fires on every (re)connect so the owner
// can join again and get a fresh full state.
export class GameSocket {
  private ws?: WebSocket
  private attempts = 0
  private timer?: ReturnType<typeof setTimeout>
  private closed = false

  constructor(
    private gameId: string,
    private handlers: {
      onMessage(message: ServerMessage): void
      onOpen(): void
      onConnection(isConnected: boolean): void
    },
  ) {
    this.connect()
  }

  private connect() {
    const ws = (this.ws = new WebSocket(socketUrl(this.gameId)))
    ws.onopen = () => {
      this.attempts = 0
      this.handlers.onConnection(true)
      this.handlers.onOpen()
    }
    ws.onmessage = (event) => {
      const message = parse(event.data)
      if (message) this.handlers.onMessage(message)
    }
    ws.onclose = () => {
      if (this.closed) return
      this.handlers.onConnection(false)
      if (++this.attempts > MAX_RETRIES) return
      this.timer = setTimeout(() => this.connect(), RETRY_DELAY_MS)
    }
  }

  send(message: ClientMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(message))
  }

  close() {
    this.closed = true
    clearTimeout(this.timer)
    this.ws?.close()
  }
}

// Creates the game, then hangs up; the game page connects on its own
export function createGame(id: string, player: Player): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(socketUrl(id))
    ws.onopen = () => ws.send(JSON.stringify({ type: 'create', player } satisfies ClientMessage))
    ws.onmessage = (event) => {
      const message = parse(event.data)
      if (!message) return
      if (message.type === 'error') reject(new Error(message.message))
      else resolve()
      ws.close()
    }
    ws.onerror = () => reject(new Error('Could not reach the server'))
  })
}
