import {
  Room,
  GameConfig,
  Scores,
  GameRound,
  FinalScores,
} from '../typings/game'
import log from '../helpers/log'

export const getWords = (string: string) => string.trim().split(' ')

export const scoreAnswer = (
  gameConfig: GameConfig,
  letter: string,
  answer: string | undefined,
  shouldValidate: boolean = true
) => {
  if (!answer) return 0
  const { scoreWithAlliteration } = gameConfig
  const isValidFirstCharacter = answer.startsWith(letter)
  const isOnlyLetter = answer === letter
  const words = getWords(answer)
  const isValid = !isValidFirstCharacter || isOnlyLetter

  if (!shouldValidate && isValid) {
    return scoreWithAlliteration
      ? words.filter((word) => word.startsWith(letter)).length
      : 1
  }

  return isValid
    ? 0
    : scoreWithAlliteration
    ? words.every((word) => word.startsWith(letter))
      ? words.length
      : words.filter((word) => word.startsWith(letter)).length
    : 1
}

export const getInitialScores = (room: Room): Scores | undefined => {
  const categories = room.config.categories
  const { answers, letter } = room.state.currentRound ?? {}

  if (!room.state.currentRound || !answers || typeof letter !== 'string') {
    log.e('Cannot get votes without answers')
    return
  }

  const votes: Scores = {}

  room.players.forEach(
    (player) =>
      categories.map((category) => {
        if (!votes[player.uuid]) votes[player.uuid] = {}
        const answer =
          (answers[player.uuid] &&
            answers[player.uuid][category] &&
            answers[player.uuid][category].toLowerCase()) ||
          ''
        votes[player.uuid][category] = scoreAnswer(room.config, letter, answer)
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
