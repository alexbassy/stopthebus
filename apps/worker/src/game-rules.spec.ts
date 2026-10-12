import type { Game, GameConfig, RoundAnswers, ServerMessage } from '@stopthebus/shared'
import { describe, expect, it } from 'vitest'

import { type Connection, EXPIRY_MS, GameRules, STOP_GRACE_MS } from './game-rules'

const alex = { id: 'p1', name: 'Alex', colour: '#f00' }
const sam = { id: 'p2', name: 'Sam', colour: '#0f0' }

function setup() {
  let stored: Game | undefined
  let answers: RoundAnswers | undefined
  let activity: number | undefined
  const broadcasts: ServerMessage[] = []
  const clock = { now: 1_000_000 }
  const created: { id: string; config: GameConfig }[] = []
  const alarms: number[] = []
  const room = new GameRules(
    'happy-cat-12',
    {
      get: async () => stored,
      put: async (g) => void (stored = g),
      getAnswers: async () => answers,
      putAnswers: async (a) => void (answers = a),
      getActivity: async () => activity,
      putActivity: async (t) => void (activity = t),
      clear: async () => {
        stored = undefined
        answers = undefined
        activity = undefined
      },
    },
    (m) => broadcasts.push(m),
    {
      now: () => clock.now,
      setAlarm: async (at) => void alarms.push(at),
      newGameId: () => 'next-game-1',
      createGame: async (id, config) => void created.push({ id, config }),
    },
  )
  const connect = () => {
    const sent: ServerMessage[] = []
    const conn: Connection = { send: (m) => sent.push(m) }
    const send = (message: unknown) => room.onMessage(conn, JSON.stringify(message))
    return { conn, sent, send }
  }
  const seed = (g: Game) => void (stored = g)
  return {
    room,
    connect,
    broadcasts,
    clock,
    created,
    alarms,
    // Ends the grace window after a Stop
    endGrace: async () => {
      clock.now += STOP_GRACE_MS
      await room.onAlarm()
    },
    game: () => stored,
    seed,
  }
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

// A lobby with Alex and Sam, one category and a single letter so rounds are predictable
async function lobby() {
  const t = setup()
  const a = t.connect()
  const s = t.connect()
  await a.send({ type: 'create', player: alex })
  await s.send({ type: 'join', player: sam })
  await a.send({ type: 'toggleCategory', category: 'Animal' })
  await a.send({ type: 'updateConfig', config: { letters: 'c', numRounds: 2 } })
  return { ...t, a, s }
}

describe('config', () => {
  it('replaces fields as a whole and toggles categories', async () => {
    const { a, s, game } = await lobby()
    await s.send({ type: 'toggleCategory', category: 'City' })
    expect(game()?.config.categories).toEqual(['Animal', 'City'])
    await a.send({ type: 'toggleCategory', category: 'Animal' })
    expect(game()?.config).toMatchObject({ categories: ['City'], letters: 'c', numRounds: 2 })
    await a.send({ type: 'updateConfig', config: { alliteration: true } })
    expect(game()?.config.alliteration).toBe(true)
  })

  it('is closed to outsiders and once the game has started', async () => {
    const { a, connect, game } = await lobby()
    const stranger = connect()
    await stranger.send({ type: 'toggleCategory', category: 'City' })
    expect(stranger.sent[0]).toMatchObject({ type: 'error', code: 'forbidden' })
    await a.send({ type: 'start' })
    await a.send({ type: 'toggleCategory', category: 'City' })
    expect(a.sent.at(-1)).toMatchObject({ type: 'error', code: 'refused' })
    expect(game()?.config.categories).toEqual(['Animal'])
  })
})

describe('start and cancel', () => {
  it('starts a round with an unplayed letter, a little in the future', async () => {
    const { a, game, clock } = await lobby()
    await a.send({ type: 'start' })
    expect(game()?.state.stage).toBe('active')
    expect(game()?.currentRound).toMatchObject({
      index: 0,
      letter: 'c',
      timeStarted: clock.now + 3500,
      timeEnded: null,
      answers: {},
    })
    await a.send({ type: 'start' })
    expect(a.sent.at(-1)).toMatchObject({ type: 'error', code: 'refused' })
  })

  it('refuses to start when no letters are left', async () => {
    const { a, game } = await lobby()
    await a.send({ type: 'updateConfig', config: { letters: '' } })
    await a.send({ type: 'start' })
    expect(a.sent.at(-1)).toMatchObject({ type: 'error', code: 'refused' })
    expect(game()?.state.stage).toBe('pre')
  })

  it('cancelling the first start goes back to the lobby', async () => {
    const { a, game } = await lobby()
    await a.send({ type: 'start' })
    await a.send({ type: 'cancelStart' })
    expect(game()).toMatchObject({
      state: { stage: 'pre' },
      currentRound: null,
      previousRounds: null,
    })
  })

  it('cancelling a later start goes back to reviewing the last round', async () => {
    const { a, s, game, endGrace } = await lobby()
    await a.send({ type: 'updateConfig', config: { letters: 'cd', numRounds: 3 } })
    await a.send({ type: 'start' })
    await a.send({ type: 'stop' })
    await endGrace()
    const reviewed = game()!.currentRound
    await s.send({ type: 'start' })
    expect(game()?.currentRound).toMatchObject({ index: 1 })
    expect(game()?.currentRound?.letter).not.toBe(reviewed?.letter)
    await s.send({ type: 'cancelStart' })
    expect(game()).toMatchObject({
      state: { stage: 'review' },
      currentRound: reviewed,
      previousRounds: null,
    })
  })

  it('cannot cancel outside the countdown stage or after a stop', async () => {
    const { a, game } = await lobby()
    await a.send({ type: 'cancelStart' })
    expect(a.sent.at(-1)).toMatchObject({ type: 'error', code: 'refused' })
    await a.send({ type: 'start' })
    await a.send({ type: 'stop' })
    await a.send({ type: 'cancelStart' })
    expect(a.sent.at(-1)).toMatchObject({ type: 'error', code: 'refused' })
    expect(game()?.state.stage).toBe('active')
  })
})

describe('answers', () => {
  it('never broadcasts answers, and gives a rejoining player their own back', async () => {
    const { a, s, broadcasts, connect } = await lobby()
    await a.send({ type: 'start' })
    await a.send({ type: 'saveAnswers', answers: { Animal: 'cat-secret' } })
    await s.send({ type: 'saveAnswers', answers: { Animal: 'camel-secret' } })
    await a.send({ type: 'setProgress', category: 'Animal' })
    expect(JSON.stringify(broadcasts)).not.toContain('secret')
    expect(JSON.stringify(s.sent)).not.toContain('cat-secret')

    const reloaded = connect()
    await reloaded.send({ type: 'join', player: alex })
    expect(reloaded.sent).toContainEqual({ type: 'answers', answers: { Animal: 'cat-secret' } })
    expect(JSON.stringify(reloaded.sent)).not.toContain('camel-secret')
  })

  it('confirms saved answers, echoing whether they were final', async () => {
    const { a } = await lobby()
    await a.send({ type: 'start' })
    await a.send({ type: 'saveAnswers', answers: { Animal: 'cat' } })
    expect(a.sent.at(-1)).toEqual({ type: 'answersSaved', final: false })
    await a.send({ type: 'saveAnswers', answers: { Animal: 'cat' }, final: true })
    expect(a.sent.at(-1)).toEqual({ type: 'answersSaved', final: true })
  })

  it('shares only which category each player is on', async () => {
    const { a, game } = await lobby()
    await a.send({ type: 'start' })
    await a.send({ type: 'setProgress', category: 'Animal' })
    expect(game()?.currentRound?.opponentProgress).toEqual({ p1: 'Animal' })
  })

  it('rejects answers outside a round or for unknown categories', async () => {
    const { a } = await lobby()
    await a.send({ type: 'saveAnswers', answers: { Animal: 'cat' } })
    expect(a.sent.at(-1)).toMatchObject({ code: 'refused' })
    await a.send({ type: 'start' })
    await a.send({ type: 'saveAnswers', answers: { Nope: 'cat' } })
    expect(a.sent.at(-1)).toMatchObject({ code: 'invalid' })
  })
})

describe('stop and review', () => {
  it('keeps answers that arrive in the grace window, then scores the round', async () => {
    const { a, s, game, clock, alarms, endGrace } = await lobby()
    await a.send({ type: 'start' })
    await a.send({ type: 'saveAnswers', answers: { Animal: 'Cat' } })

    clock.now += 60_000
    await a.send({ type: 'stop' })
    expect(alarms.at(-1)).toBe(clock.now + STOP_GRACE_MS)
    expect(game()?.currentRound).toMatchObject({ stopperId: 'p1', timeEnded: clock.now })
    expect(game()?.state.stage).toBe('active')

    await s.send({ type: 'saveAnswers', answers: { Animal: 'camel' } })
    await endGrace()

    expect(game()?.state.stage).toBe('review')
    expect(game()?.currentRound).toMatchObject({
      answers: { p1: { Animal: 'Cat' }, p2: { Animal: 'camel' } },
      scores: { p1: { Animal: 1 }, p2: { Animal: 1 } },
    })
    await s.send({ type: 'saveAnswers', answers: { Animal: 'late' } })
    expect(s.sent.at(-1)).toMatchObject({ code: 'refused' })
  })

  it('does not review before the grace window is over, and re-arms the alarm', async () => {
    const { a, game, room, alarms, clock } = await lobby()
    await a.send({ type: 'start' })
    await a.send({ type: 'stop' })
    clock.now += STOP_GRACE_MS - 1
    await room.onAlarm()
    expect(game()?.state.stage).toBe('active')
    expect(alarms.at(-1)).toBe(clock.now - (STOP_GRACE_MS - 1) + STOP_GRACE_MS)
    await room.onAlarm() // a stray alarm outside a Stop does nothing
    clock.now += 1
    await room.onAlarm()
    expect(game()?.state.stage).toBe('review')
    await room.onAlarm()
    expect(game()?.state.stage).toBe('review')
  })

  it('fills missing answers with empty strings and ignores a second stop', async () => {
    const { a, s, game, endGrace } = await lobby()
    await a.send({ type: 'start' })
    await a.send({ type: 'saveAnswers', answers: { Animal: 'cat' } })
    await a.send({ type: 'stop' })
    await s.send({ type: 'stop' })
    expect(s.sent.at(-1)).toMatchObject({ code: 'refused' })
    expect(game()?.currentRound?.stopperId).toBe('p1')
    await endGrace()
    expect(game()?.currentRound?.answers.p2).toEqual({ Animal: '' })
    expect(game()?.currentRound?.scores.p2).toEqual({ Animal: 0 })
  })

  it('lets any player change any score in review, and only in review', async () => {
    const { a, s, game, endGrace } = await lobby()
    await a.send({ type: 'start' })
    await s.send({ type: 'setScore', playerId: 'p1', category: 'Animal', score: 5 })
    expect(s.sent.at(-1)).toMatchObject({ code: 'refused' })
    await a.send({ type: 'stop' })
    await endGrace()
    await s.send({ type: 'setScore', playerId: 'p1', category: 'Animal', score: 5 })
    expect(game()?.currentRound?.scores.p1).toEqual({ Animal: 5 })
    await s.send({ type: 'setScore', playerId: 'nobody', category: 'Animal', score: 1 })
    expect(s.sent.at(-1)).toMatchObject({ code: 'invalid' })
  })
})

describe('finishing', () => {
  async function playRound(l: Awaited<ReturnType<typeof lobby>>, answerA: string) {
    await l.a.send({ type: 'start' })
    await l.a.send({ type: 'saveAnswers', answers: { Animal: answerA } })
    await l.a.send({ type: 'stop' })
    await l.endGrace()
  }

  it('finishes after the last round and creates the rematch', async () => {
    const l = await lobby()
    await l.a.send({ type: 'updateConfig', config: { letters: 'cdef', numRounds: 2 } })
    await l.a.send({ type: 'toggleCategory', category: 'City' })
    await playRound(l, 'cat')
    await l.s.send({ type: 'setScore', playerId: 'p1', category: 'Animal', score: 3 })
    await playRound(l, 'dog')
    await l.a.send({ type: 'start' })

    const game = l.game()!
    expect(game.state).toMatchObject({
      stage: 'finished',
      nextGameId: 'next-game-1',
      finalScores: { p1: expect.any(Number), p2: 0 },
    })
    expect(game.state.finalScores?.p1).toBeGreaterThanOrEqual(3)
    expect(game.currentRound).toBeNull()
    expect(game.previousRounds).toHaveLength(2)

    const played = game.previousRounds!.map((r) => r.letter)
    expect(l.created).toHaveLength(1)
    expect(l.created[0].id).toBe('next-game-1')
    expect(l.created[0].config).toMatchObject({
      categories: ['Animal', 'City'],
      numRounds: 2,
      letters: 'cdef'
        .split('')
        .filter((x) => !played.includes(x))
        .join(''),
    })
    // The finished game can't be started again
    await l.a.send({ type: 'start' })
    expect(l.a.sent.at(-1)).toMatchObject({ code: 'refused' })
  })

  it('sets up the rematch as an empty lobby', async () => {
    const { room, game } = setup()
    await room.createWithConfig({
      categories: ['Animal'],
      numRounds: 2,
      letters: 'ab',
      alliteration: false,
    })
    expect(game()).toMatchObject({
      state: { stage: 'pre' },
      players: [],
      config: { letters: 'ab' },
    })
    await room.createWithConfig({ categories: [], numRounds: 1, letters: '', alliteration: false })
    expect(game()?.config.letters).toBe('ab')
  })
})

describe('expiry', () => {
  it('deletes the game after a day without activity, and then it is not found', async () => {
    const { connect, game, room, clock, alarms } = await lobby()
    const last = clock.now
    expect(alarms.at(-1)).toBe(last + EXPIRY_MS)

    clock.now = last + EXPIRY_MS
    await room.onAlarm()
    expect(game()).toBeUndefined()

    const late = connect()
    await late.send({ type: 'join', player: alex })
    expect(late.sent[0]).toMatchObject({ type: 'error', code: 'notFound' })
  })

  it('is pushed back by every message', async () => {
    const { a, game, room, clock, alarms } = await lobby()
    const start = clock.now
    clock.now += EXPIRY_MS - 1000
    await a.send({ type: 'toggleCategory', category: 'City' })
    expect(alarms.at(-1)).toBe(clock.now + EXPIRY_MS)

    // The earlier alarm fires now: the game is not idle yet, so it survives
    clock.now = start + EXPIRY_MS
    await room.onAlarm()
    expect(game()).toBeDefined()
    expect(alarms.at(-1)).toBe(clock.now - 1000 + EXPIRY_MS)
  })

  it('does not set an alarm for a game that does not exist', async () => {
    const { connect, alarms } = setup()
    await connect().send({ type: 'join', player: alex })
    expect(alarms).toHaveLength(0)
  })

  it('keeps the Stop deadline ahead of expiry, then goes back to expiry', async () => {
    const { a, game, room, clock, alarms } = await lobby()
    await a.send({ type: 'start' })
    await a.send({ type: 'stop' })
    expect(alarms.at(-1)).toBe(clock.now + STOP_GRACE_MS)
    clock.now += STOP_GRACE_MS
    await room.onAlarm()
    expect(game()?.state.stage).toBe('review')
    expect(alarms.at(-1)).toBe(clock.now - STOP_GRACE_MS + EXPIRY_MS)
  })

  it('arms an alarm for a rematch game too', async () => {
    const { room, clock, alarms } = setup()
    await room.createWithConfig({ categories: [], numRounds: 1, letters: 'a', alliteration: false })
    expect(alarms.at(-1)).toBe(clock.now + EXPIRY_MS)
  })
})
