import { scoreAnswer, getInitialScores, getFinalScores } from './scores'
import { rounds } from './__fixtures__'
import { GameConfig, Game, Player, Round } from '../typings/game'

describe('scoreAnswer()', () => {
  const gameConfig = { alliteration: false } as GameConfig
  const gameConfigWithAlliteration = {
    alliteration: true,
  } as GameConfig

  it('scores invalid answer', () => {
    expect(scoreAnswer(false, 'e', '')).toBe(0)
    expect(scoreAnswer(false, 'z', 'eggs')).toBe(0)
  })
  it('scores invalid answer with alliteration', () => {
    expect(scoreAnswer(true, 'f', 'frog city')).toBe(1)
    expect(scoreAnswer(true, 'c', 'frog city')).toBe(0)
  })
  it('scores valid answer ', () => {
    expect(scoreAnswer(false, 'e', 'exeter')).toBe(1)
    expect(scoreAnswer(false, 'e', 'end of the game')).toBe(1)
    expect(scoreAnswer(false, 'a', 'amazing angel')).toBe(1)
  })
  it('scores valid answer with alliteration', () => {
    expect(scoreAnswer(true, 'e', 'end of the road')).toBe(1)
    expect(scoreAnswer(true, 'l', 'lilies')).toBe(1)
    expect(scoreAnswer(true, 't', 'tina turner')).toBe(2)
    expect(scoreAnswer(true, 't', 'tilly took the thyme')).toBe(4)
  })
  it('ignore validation when told', () => {
    expect(scoreAnswer(false, 'l', 'poppies', false)).toBe(1)
    expect(scoreAnswer(true, 'k', 'kylie jenner', false)).toBe(1)
    expect(scoreAnswer(true, 'p', 'ru paul', false)).toBe(1)
  })
})

describe('getInitialScores()', () => {
  let game: Game
  let config: GameConfig
  let players: Player[]
  let letter: string
  let answers: Round

  beforeEach(() => {
    config = { alliteration: false, categories: ['animals', 'people'] } as GameConfig
    players = [{ id: 'one' }, { id: 'two' }] as Player[]
    letter = 'c'
    answers = {
      one: { animals: 'cat', people: 'cady' },
      two: { animals: 'cayote', people: 'carry' },
    }
  })

  it('adds up scores', () => {
    const results = getInitialScores(answers, letter, config, players)
    expect(results).toEqual({
      one: { animals: 1, people: 1 },
      two: { animals: 1, people: 1 },
    })
  })

  it('gives extra points for alliteration', () => {
    config.alliteration = true
    answers.one.people = 'cady carson'
    const results = getInitialScores(answers, letter, config, players)
    expect(results).toEqual({
      one: { animals: 1, people: 2 },
      two: { animals: 1, people: 1 },
    })
  })

  it('excludes duplicates', () => {
    answers.two.people = 'cady'
    const results = getInitialScores(answers, letter, config, players)
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
