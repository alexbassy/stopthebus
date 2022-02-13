import styled from '@emotion/styled'
import { useGamePlayers } from '@/hooks/database'
import Player from '@/components/Player'
import usePlayer from '@/hooks/usePlayer'
import PlayerName from '@/components/new-game/PlayerName'
import { Spacing } from '../visual'

const Container = styled.section`
  background-color: var(--blue-bg);
  border-radius: var(--container-radius);
  color: var(--blue-fg);
  padding: 1rem;
`

const CurrentPlayer: React.FC = () => {
  const [player] = usePlayer()
  const gamePlayers = useGamePlayers()

  const currentPlayer = gamePlayers.find((gamePlayer) => gamePlayer.id === player?.id)

  if (!currentPlayer) {
    return <section>Welcome!</section>
  }

  return (
    <Container>
      <Spacing b={0.5}>
        Welcome, <Player {...currentPlayer} inline />!
      </Spacing>
      <PlayerName />
    </Container>
  )
}

export default CurrentPlayer
