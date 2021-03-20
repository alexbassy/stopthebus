import { scoreAnswer, getInitialScores, getFinalScores } from './scores'
import { rounds } from './__fixtures__'
import { GameConfig, Room } from 'shared/typings/game'

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

describe('getInitialScores()', () => {
  let game
  beforeEach(() => {
    game = {
      config: { categories: ['animals', 'people'] },
      players: [{ uuid: 'one' }, { uuid: 'two' }],
      state: {
        currentRound: {
          letter: 'c',
          answers: {
            one: { animals: 'cat', people: 'cady' },
            two: { animals: 'cayote', people: 'carry' },
          },
        },
      },
    }
  })

  it('adds up scores', () => {
    const results = getInitialScores(game as Room)
    expect(results).toEqual({
      one: { animals: 1, people: 1 },
      two: { animals: 1, people: 1 },
    })
  })

  it('gives extra points for alliteration', () => {
    game.config.scoreWithAlliteration = true
    game.state.currentRound.answers.one.people = 'cady carson'
    const results = getInitialScores(game as Room)
    expect(results).toEqual({
      one: { animals: 1, people: 2 },
      two: { animals: 1, people: 1 },
    })
  })

  it('excludes duplicates', () => {
    game.state.currentRound.answers.two.people = 'cady'
    const results = getInitialScores(game as Room)
    expect(results).toEqual({
      one: { animals: 1, people: 0 },
      two: { animals: 1, people: 0 },
    })
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
