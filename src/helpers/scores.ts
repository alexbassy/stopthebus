// @ts-nocheck
import { Game, GameConfig, Scores, GameRound, FinalScores, Round } from '@/typings/game'
import log from '../helpers/log'

export const getWords = (string: string) => string.trim().split(' ')

const sanitiseAnswer = (answer: string) =>
  typeof answer === 'string' ? answer.trim().toLowerCase() : ''

export const scoreAnswer = (
  scoreWithAlliteration: boolean,
  letter: string,
  input: string | undefined,
  shouldValidate: boolean = true
) => {
  if (!input) return 0
  const answer = input.trim().toLowerCase()
  const isValidFirstCharacter = answer.startsWith(letter)
  const isOnlyLetter = answer === letter
  const words = getWords(answer)
  const isValid = !isValidFirstCharacter || isOnlyLetter
  const alliteratedWords = scoreWithAlliteration
    ? words.filter((word) => word.startsWith(letter))
    : []

  // `shouldValidate` can be passed to override the
  // default score on the round review screen
  if (!shouldValidate && isValid) {
    return scoreWithAlliteration ? alliteratedWords.length : 1
  }

  // If scoring with alliteration, score all individual
  // words beginning with that letter
  return isValid ? 0 : scoreWithAlliteration ? alliteratedWords.length : 1
}

interface GroupedAnswers {
  [categoryName: string]: { [answer: string]: number }
}

export const getInitialScores = (
  answers: Round,
  letter: string,
  config: GameConfig,
  players: Player[]
): Scores => {
  if (!answers || typeof letter !== 'string') {
    throw new Error('Cannot get votes without answers')
  }

  const votes: Scores = {}

  const groupedByCategory = Object.values(answers).reduce<GroupedAnswers>(
    (accum, playerAnswers) => {
      config.categories.forEach((category) => {
        if (!accum[category]) {
          accum[category] = {}
        }

        // Get the answer the player provided for this category
        const answer = sanitiseAnswer(playerAnswers[category])

        if (accum[category][answer]) {
          accum[category][answer] += 1
        } else {
          accum[category][answer] = 1
        }
      })
      return accum
    },
    {}
  )

  players.forEach(
    (player) =>
      config.categories.map((category) => {
        if (!votes[player.id]) votes[player.id] = {}
        const providedAnswer = answers?.[player.id]?.[category] ?? ''

        const answer = sanitiseAnswer(providedAnswer)
        votes[player.id][category] = scoreAnswer(config, letter, answer)

        if (groupedByCategory[category][answer] > 1) {
          votes[player.id][category] = 0
        }

        return votes
      }),
    {}
  )

  return votes
}

const add = (accum: number, n: number) => accum + n

const addObjectValues = (obj: { [key: string]: number }): number =>
  Object.values(obj).reduce(add, 0)

export const getFinalScores = (rounds: GameRound[]): FinalScores => {
  if (!rounds.length) return {}
  const scores = rounds.reduce<FinalScores>((scores, round) => {
    Object.keys(round.scores).forEach((playerID) => {
      if (!round.scores[playerID]) return scores
      if (!scores[playerID]) scores[playerID] = 0
      const score = addObjectValues(round.scores[playerID])
      scores[playerID] += score
    })
    return scores
  }, {})
  return scores
}
