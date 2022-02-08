import { useGamePlayers } from '@/hooks/database'
import Player from '@/components/Player'
import usePlayer from '@/hooks/usePlayer'

const CurrentPlayer: React.FC = () => {
  const [player] = usePlayer()
  const gamePlayers = useGamePlayers()

  const currentPlayer = gamePlayers.find((gamePlayer) => gamePlayer.id === player?.id)

  if (!currentPlayer) {
    return <section>Welcome!</section>
  }

  return (
    <section>
      Welcome, <Player {...currentPlayer} inline />!
    </section>
  )
}

export default CurrentPlayer
