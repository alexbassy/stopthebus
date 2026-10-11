import { describe, expect, it } from 'vitest'
import { ClientMessageSchema, ServerMessageSchema } from './protocol'

const player = { id: 'p1', name: 'Alex', colour: '#f00' }

describe('ClientMessageSchema', () => {
  it.each([
    { type: 'create', player },
    { type: 'join', player },
    { type: 'leave' },
    { type: 'rename', name: 'Sam' },
    { type: 'updateConfig', config: { letters: 'abc', numRounds: 5, alliteration: true } },
    { type: 'updateConfig', config: { numRounds: 2 } },
    { type: 'toggleCategory', category: 'Animal' },
    { type: 'start' },
    { type: 'cancelStart' },
    { type: 'saveAnswer', category: 'Animal', answer: 'cat' },
    { type: 'saveAnswer', category: 'Animal', answer: '' },
    { type: 'setProgress', category: 'Animal' },
    { type: 'stop' },
    { type: 'setScore', playerId: 'p1', category: 'Animal', score: 2 },
  ])('accepts $type', (message) => {
    expect(ClientMessageSchema.safeParse(message).success).toBe(true)
  })

  it.each([
    ['not an object', 'start'],
    ['missing type', { player }],
    ['unknown type', { type: 'cheat' }],
    ['create without player', { type: 'create' }],
    ['join with a bad player', { type: 'join', player: { id: 'p1' } }],
    ['rename to blank', { type: 'rename', name: '   ' }],
    ['rename to a huge name', { type: 'rename', name: 'x'.repeat(1000) }],
    ['config with uppercase letters', { type: 'updateConfig', config: { letters: 'ABC' } }],
    ['config with zero rounds', { type: 'updateConfig', config: { numRounds: 0 } }],
    ['config with categories', { type: 'updateConfig', config: { categories: ['Animal'] } }],
    ['blank category', { type: 'toggleCategory', category: '' }],
    ['answer that is not a string', { type: 'saveAnswer', category: 'Animal', answer: 3 }],
    ['progress without category', { type: 'setProgress' }],
    ['join with a blank name', { type: 'join', player: { ...player, name: ' ' } }],
    ['negative score', { type: 'setScore', playerId: 'p1', category: 'Animal', score: -1 }],
    ['fractional score', { type: 'setScore', playerId: 'p1', category: 'Animal', score: 1.5 }],
    ['score without player', { type: 'setScore', category: 'Animal', score: 1 }],
  ])('rejects %s', (_, message) => {
    expect(ClientMessageSchema.safeParse(message).success).toBe(false)
  })
})

describe('ServerMessageSchema', () => {
  it('accepts a full game state', () => {
    const game = {
      id: 'happy-cat-12',
      state: { stage: 'pre' },
      config: { categories: [], numRounds: 3, letters: 'abc', alliteration: false },
      currentRound: null,
      previousRounds: null,
      players: [player],
    }
    expect(ServerMessageSchema.safeParse({ type: 'state', game }).success).toBe(true)
  })

  it('rejects an unknown error code', () => {
    const message = { type: 'error', code: 'oops', message: 'nope' }
    expect(ServerMessageSchema.safeParse(message).success).toBe(false)
  })
})
