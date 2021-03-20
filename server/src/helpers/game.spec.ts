import { GameConfig, GameState } from 'shared/typings/game'
import { hasPlayedAllRounds } from './game'

jest.mock('./redis-client')

describe('hasPlayedAllRounds', () => {
  it('returns true when all rounds finalised', () => {
    const state: GameState = {
      rounds: [{}, {}, {}],
    } as GameState
    const config: GameConfig = { rounds: 3 } as GameConfig

    expect(hasPlayedAllRounds({ state, config })).toBe(true)
  })

  it('returns true when current round has ended', () => {
    const state: GameState = {
      rounds: [{}, {}],
      currentRound: { timeEnded: Date.now() },
    } as GameState
    const config: GameConfig = { rounds: 3 } as GameConfig

    expect(hasPlayedAllRounds({ state, config })).toBe(true)
  })

  it('returns false when current round is active', () => {
    const state: GameState = {
      rounds: [{}, {}],
      currentRound: { timeStarted: Date.now() },
    } as GameState
    const config: GameConfig = { rounds: 3 } as GameConfig

    expect(hasPlayedAllRounds({ state, config })).toBe(false)
  })

  it('returns false when first round is active', () => {
    const state: GameState = {
      rounds: [],
      currentRound: { timeStarted: Date.now() },
    } as GameState
    const config: GameConfig = { rounds: 1 } as GameConfig

    expect(hasPlayedAllRounds({ state, config })).toBe(false)
  })
})
