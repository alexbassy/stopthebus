import { useGamePlayers } from '@/hooks/database'
import Player from '@/components/Player'
import usePlayer from '@/hooks/usePlayer'
import PlayerName from '@/components/new-game/PlayerName'
import { SectionContainer, Spacing } from '../visual'

const CurrentPlayer: React.FC = () => {
  const [player] = usePlayer()
  const gamePlayers = useGamePlayers()

  const currentPlayer = gamePlayers.find((gamePlayer) => gamePlayer.id === player?.id)

  if (!currentPlayer) {
    return <section>Welcome!</section>
  }

  return (
    <SectionContainer colour='blue'>
      <Spacing b={0.5}>
        Welcome, <Player {...currentPlayer} inline />!
      </Spacing>
      <PlayerName />
    </SectionContainer>
  )
}

export default CurrentPlayer
