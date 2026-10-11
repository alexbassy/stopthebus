import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GameSocket, MAX_RETRIES, RETRY_DELAY_MS } from './socket'

class FakeWebSocket {
  static OPEN = 1
  static instances: FakeWebSocket[] = []
  readyState = 0
  onopen?: () => void
  onclose?: () => void
  onmessage?: (e: { data: string }) => void
  sent: string[] = []
  constructor(public url: string) {
    FakeWebSocket.instances.push(this)
  }
  send(data: string) {
    this.sent.push(data)
  }
  close() {}
  open() {
    this.readyState = 1
    this.onopen?.()
  }
  drop() {
    this.readyState = 3
    this.onclose?.()
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  FakeWebSocket.instances = []
  vi.stubGlobal('WebSocket', FakeWebSocket)
  vi.stubGlobal('location', { protocol: 'https:', host: 'example.com' })
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function setup() {
  const handlers = { onMessage: vi.fn(), onOpen: vi.fn(), onConnection: vi.fn() }
  const socket = new GameSocket('happy-cat-1', handlers)
  return { socket, handlers, current: () => FakeWebSocket.instances.at(-1)! }
}

describe('GameSocket', () => {
  it('connects to the game and passes on valid server messages only', () => {
    const { handlers, current } = setup()
    expect(current().url).toBe('wss://example.com/ws/happy-cat-1')
    current().open()
    current().onmessage?.({
      data: JSON.stringify({ type: 'error', code: 'notFound', message: 'x' }),
    })
    current().onmessage?.({ data: JSON.stringify({ type: 'nonsense' }) })
    current().onmessage?.({ data: 'not json' })
    expect(handlers.onMessage).toHaveBeenCalledTimes(1)
  })

  it('reconnects after a drop and reports the connection each time', () => {
    const { handlers, current } = setup()
    current().open()
    current().drop()
    expect(handlers.onConnection).toHaveBeenLastCalledWith(false)
    vi.advanceTimersByTime(RETRY_DELAY_MS)
    expect(FakeWebSocket.instances).toHaveLength(2)
    current().open()
    expect(handlers.onConnection).toHaveBeenLastCalledWith(true)
    expect(handlers.onOpen).toHaveBeenCalledTimes(2)
  })

  it('gives up after 15 failed retries', () => {
    const { current } = setup()
    current().drop()
    for (let i = 0; i < MAX_RETRIES; i++) {
      vi.advanceTimersByTime(RETRY_DELAY_MS)
      current().drop()
    }
    vi.advanceTimersByTime(RETRY_DELAY_MS * 5)
    expect(FakeWebSocket.instances).toHaveLength(MAX_RETRIES + 1)
  })

  it('does not reconnect after close()', () => {
    const { socket, current } = setup()
    socket.close()
    current().drop()
    vi.advanceTimersByTime(RETRY_DELAY_MS * 2)
    expect(FakeWebSocket.instances).toHaveLength(1)
  })
})
