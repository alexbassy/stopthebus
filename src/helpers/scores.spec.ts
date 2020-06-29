import { scoreAnswer, getFinalScores } from './scores'
import { rounds } from './__fixtures__'
import { GameConfig } from '../typings/game'

describe('scoreAnswer()', () => {
  const gameConfig = { scoreWithAlliteration: false } as GameConfig
  const gameConfigWithAlliteration = {
    scoreWithAlliteration: true,
  } as GameConfig

  it('scores invalid answer', () => {
    expect(scoreAnswer(gameConfig, 'e', '')).toBe(0)
    expect(scoreAnswer(gameConfig, 'z', 'eggs')).toBe(0)
  })
  it('scores invalid answer with alliteration', () => {
    expect(scoreAnswer(gameConfigWithAlliteration, 'f', 'frog city')).toBe(1)
    expect(scoreAnswer(gameConfigWithAlliteration, 'c', 'frog city')).toBe(0)
  })
  it('scores valid answer ', () => {
    expect(scoreAnswer(gameConfig, 'e', 'exeter')).toBe(1)
    expect(scoreAnswer(gameConfig, 'e', 'end of the game')).toBe(1)
    expect(scoreAnswer(gameConfig, 'a', 'amazing angel')).toBe(1)
  })
  it('scores valid answer with alliteration', () => {
    expect(
      scoreAnswer(gameConfigWithAlliteration, 'e', 'end of the road')
    ).toBe(1)
    expect(scoreAnswer(gameConfigWithAlliteration, 'l', 'lilies')).toBe(1)
    expect(scoreAnswer(gameConfigWithAlliteration, 't', 'tina turner')).toBe(2)
    expect(
      scoreAnswer(gameConfigWithAlliteration, 't', 'tilly took the thyme')
    ).toBe(4)
  })
  it('ignore validation when told', () => {
    expect(scoreAnswer(gameConfig, 'l', 'poppies', false)).toBe(1)
    expect(
      scoreAnswer(gameConfigWithAlliteration, 'k', 'kylie jenner', false)
    ).toBe(1)
    expect(scoreAnswer(gameConfigWithAlliteration, 'p', 'ru paul', false)).toBe(
      1
    )
  })
})

describe('getFinalScores()', () => {
  it('sums up total scores', () => {
    expect(getFinalScores(rounds)).toEqual({
      '8c86d893-9b55-4019-b8bf-a1c92daa4c64': 7,
      '06c245a4-7b87-43fe-bb55-c3b3607fa3bd': 4,
    })
  })
})
