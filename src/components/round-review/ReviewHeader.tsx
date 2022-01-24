import {
  useGameConfigRounds,
  useGamePlayers,
  useGameRoundDuration,
  useGameRoundEndingPlayer,
  useGameRoundIndex,
} from '@/hooks/supabase'

const ReviewHeader: React.FC = () => {
  const duration = useGameRoundDuration()
  const roundEndingPlayer = useGameRoundEndingPlayer()
  const players = useGamePlayers()
  const numRounds = useGameConfigRounds()
  const roundIndex = useGameRoundIndex()

  const playerWhoEndedRound =
    players.find(({ id }) => id === roundEndingPlayer)?.name || roundEndingPlayer

  return (
    <>
      <h2>
        End of round {(roundIndex || 0) + 1}/{numRounds}
      </h2>
      <p>
        Round finished by <strong>{playerWhoEndedRound}</strong> in {Math.floor(duration / 1000)}s
      </p>
    </>
  )
}

export default ReviewHeader
