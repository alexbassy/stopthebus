import {
  Room,
  GameConfig,
  Scores,
  GameRound,
  FinalScores,
} from '../typings/game'
import log from '../helpers/log'

export const getWords = (string: string) => string.trim().split(' ')

const sanitiseAnswer = (answer: string) =>
  typeof answer === 'string' ? answer.trim().toLowerCase() : ''

export const scoreAnswer = (
  gameConfig: GameConfig,
  letter: string,
  input: string | undefined,
  shouldValidate: boolean = true
) => {
  if (!input) return 0
  const answer = input.trim().toLowerCase()
  const { scoreWithAlliteration } = gameConfig
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

export const getInitialScores = (room: Room): Scores | undefined => {
  const categories = room.config.categories
  const { answers, letter } = room.state.currentRound ?? {}

  if (!room.state.currentRound || !answers || typeof letter !== 'string') {
    log.e('Cannot get votes without answers')
    return
  }

  const votes: Scores = {}

  const groupedAnswers = Object.values(answers).reduce<GroupedAnswers>(
    (accum, answers) => {
      categories.forEach((category) => {
        if (!accum[category]) {
          accum[category] = {}
        }

        const answer = sanitiseAnswer(answers[category])

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

  room.players.forEach(
    (player) =>
      categories.map((category) => {
        if (!votes[player.uuid]) votes[player.uuid] = {}
        const answer = sanitiseAnswer(answers?.[player.uuid]?.[category])
        votes[player.uuid][category] = scoreAnswer(room.config, letter, answer)

        if (groupedAnswers[category][answer] > 1) {
          votes[player.uuid][category] = 0
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
