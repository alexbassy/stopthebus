import { describe, expect, it } from 'vitest'
import type { Game, ServerMessage } from '@stopthebus/shared'
import { GameRules, type Connection } from './game-rules'

const alex = { id: 'p1', name: 'Alex', colour: '#f00' }
const sam = { id: 'p2', name: 'Sam', colour: '#0f0' }

function setup() {
  let stored: Game | undefined
  const broadcasts: ServerMessage[] = []
  const room = new GameRules(
    'happy-cat-12',
    { get: async () => stored, put: async (g) => void (stored = g) },
    (m) => broadcasts.push(m),
  )
  const connect = () => {
    const sent: ServerMessage[] = []
    const conn: Connection = { send: (m) => sent.push(m) }
    const send = (message: unknown) => room.onMessage(conn, JSON.stringify(message))
    return { conn, sent, send }
  }
  const seed = (g: Game) => void (stored = g)
  return { room, connect, broadcasts, game: () => stored, seed }
}

describe('GameRules', () => {
  it('creates a game in the pre stage with the creator as its only player', async () => {
    const { connect, broadcasts, game } = setup()
    await connect().send({ type: 'create', player: alex })
    expect(game()).toMatchObject({
      id: 'happy-cat-12',
      state: { stage: 'pre' },
      config: { numRounds: 3, categories: [], alliteration: false },
      players: [alex],
    })
    expect(broadcasts).toHaveLength(1)
  })

  it('refuses to create a game that exists', async () => {
    const { connect, game } = setup()
    await connect().send({ type: 'create', player: alex })
    const other = connect()
    await other.send({ type: 'create', player: sam })
    expect(other.sent[0]).toMatchObject({ type: 'error', code: 'refused' })
    expect(game()?.players).toEqual([alex])
  })

  it('does not create a game implicitly on join', async () => {
    const { connect, game } = setup()
    const c = connect()
    await c.send({ type: 'join', player: alex })
    expect(c.sent[0]).toMatchObject({ type: 'error', code: 'notFound' })
    expect(game()).toBeUndefined()
  })

  it('joins players, ignoring a repeat join, and broadcasts the list', async () => {
    const { connect, broadcasts, game } = setup()
    await connect().send({ type: 'create', player: alex })
    const s = connect()
    await s.send({ type: 'join', player: sam })
    await s.send({ type: 'join', player: sam })
    expect(game()?.players).toEqual([alex, sam])
    expect(broadcasts).toHaveLength(2)
    expect(s.sent.at(-1)).toMatchObject({ type: 'state' })
  })

  it('refuses a new player after the pre stage but lets a returning one in', async () => {
    const { connect, game, seed } = setup()
    await connect().send({ type: 'create', player: alex })
    seed({ ...game()!, state: { stage: 'active' } })

    const late = connect()
    await late.send({ type: 'join', player: sam })
    expect(late.sent[0]).toMatchObject({ type: 'error', code: 'refused' })

    const back = connect()
    await back.send({ type: 'join', player: alex })
    expect(back.sent[0]).toMatchObject({ type: 'state' })
  })

  it('leaves in the pre stage, and leaving when not in the game does nothing', async () => {
    const { connect, game } = setup()
    await connect().send({ type: 'create', player: alex })
    const s = connect()
    await s.send({ type: 'join', player: sam })
    await s.send({ type: 'leave' })
    await s.send({ type: 'leave' })
    expect(game()?.players).toEqual([alex])
    expect(s.sent.some((m) => m.type === 'error')).toBe(false)
  })

  it('renames only the player the socket joined as', async () => {
    const { connect, game } = setup()
    const a = connect()
    await a.send({ type: 'create', player: alex })
    const s = connect()
    await s.send({ type: 'join', player: sam })
    await s.send({ type: 'rename', name: 'Samantha' })
    expect(game()?.players).toEqual([alex, { ...sam, name: 'Samantha' }])
  })

  it('ignores a rename from a player who has left', async () => {
    const { connect, broadcasts } = setup()
    await connect().send({ type: 'create', player: alex })
    const s = connect()
    await s.send({ type: 'join', player: sam })
    await s.send({ type: 'leave' })
    const before = broadcasts.length
    await s.send({ type: 'rename', name: 'Ghost' })
    expect(broadcasts).toHaveLength(before)
  })

  it('rejects bad messages and edits from the wrong socket without throwing', async () => {
    const { connect, game } = setup()
    const a = connect()
    await a.send({ type: 'create', player: alex })

    const stranger = connect()
    await stranger.send({ type: 'rename', name: 'Hacked' })
    expect(stranger.sent[0]).toMatchObject({ type: 'error', code: 'forbidden' })

    await a.send({ type: 'join', player: sam }) // already bound to alex
    expect(a.sent.at(-1)).toMatchObject({ type: 'error', code: 'forbidden' })

    await a.send({ type: 'rename', name: '' })
    expect(a.sent.at(-1)).toMatchObject({ type: 'error', code: 'invalid' })
    await a.send('not json at all')
    expect(a.sent.at(-1)).toMatchObject({ type: 'error', code: 'invalid' })
    expect(game()?.players).toEqual([alex])
  })
})
