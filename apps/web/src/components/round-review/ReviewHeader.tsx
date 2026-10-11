import { useGameConfigRounds, useGamePlayers, useReviewedRound } from '@/hooks/database'

const ReviewHeader: React.FC = () => {
  const round = useReviewedRound()
  const players = useGamePlayers()
  const numRounds = useGameConfigRounds()

  const duration = (round?.timeEnded ?? 0) - (round?.timeStarted ?? 0)
  const stopperId = round?.stopperId
  const stopper = players.find(({ id }) => id === stopperId)?.name || stopperId

  return (
    <>
      <h2>
        End of round {(round?.index ?? 0) + 1}/{numRounds}
      </h2>
      <p>
        Round finished by <strong>{stopper}</strong> in {Math.floor(duration / 1000)}s
      </p>
    </>
  )
}

export default ReviewHeader
