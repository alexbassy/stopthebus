import { useGamePlayers } from '@/hooks/database'
import { H3, Item, List, SectionContainer } from '@/components/visual'
import Player from '@/components/Player'

const Players: React.FC = () => {
  const gamePlayers = useGamePlayers()

  return (
    <SectionContainer colour='yellow'>
      <H3>Players</H3>
      <List>
        {gamePlayers &&
          gamePlayers.map((player) => (
            <Item key={player.id}>
              <Player {...player} showMe />
            </Item>
          ))}
      </List>
    </SectionContainer>
  )
}

export default Players
