import type { FinalScores, GameConfig, Player, Round, RoundAnswers, Score, Scores } from './schemas'

const sanitiseAnswer = (answer: string | undefined) => answer?.trim().toLowerCase() ?? ''

export const scoreAnswer = (
  scoreWithAlliteration: boolean,
  letter: string,
  input: string | undefined,
  // Pass false to score an answer regardless of its first letter, as when
  // overriding the default score in review
  shouldValidate: boolean = true,
): Score => {
  if (!input) return 0
  const answer = sanitiseAnswer(input)
  const isInvalid = !answer.startsWith(letter) || answer === letter
  if (isInvalid && shouldValidate) return 0

  // With alliteration, every word starting with the letter scores
  return scoreWithAlliteration
    ? answer.split(' ').filter((word) => word.startsWith(letter)).length
    : 1
}

// Scores every player's answers for a round. Answers given by more than one
// player score nothing, and missing answers score nothing.
export const getInitialScores = (
  answers: RoundAnswers,
  letter: string,
  config: Pick<GameConfig, 'categories' | 'alliteration'>,
  players: Pick<Player, 'id'>[],
): Scores => {
  const scores: Scores = Object.fromEntries(players.map(({ id }) => [id, {}]))

  for (const category of config.categories) {
    const counts = new Map<string, number>()
    for (const playerAnswers of Object.values(answers)) {
      const answer = sanitiseAnswer(playerAnswers[category])
      counts.set(answer, (counts.get(answer) ?? 0) + 1)
    }

    for (const { id } of players) {
      const answer = sanitiseAnswer(answers[id]?.[category])
      scores[id][category] =
        (counts.get(answer) ?? 0) > 1 ? 0 : scoreAnswer(config.alliteration, letter, answer)
    }
  }

  return scores
}

export const getFinalScores = (rounds: Pick<Round, 'scores'>[]): FinalScores => {
  const totals: FinalScores = {}
  for (const round of rounds) {
    for (const [playerId, playerScores] of Object.entries(round.scores)) {
      const roundTotal = Object.values(playerScores).reduce((sum, score) => sum + score, 0)
      totals[playerId] = (totals[playerId] ?? 0) + roundTotal
    }
  }
  return totals
}
