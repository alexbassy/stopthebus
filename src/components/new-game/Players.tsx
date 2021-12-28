import { useGamePlayers } from '@/hooks/supabase'
import { H3, Item, List } from '@/components/visual'
import Player from '@/components/Player'

const Players: React.FC = () => {
  const gamePlayers = useGamePlayers()

  return (
    <section>
      <H3>Players</H3>
      <List>
        {gamePlayers &&
          gamePlayers.map((player) => (
            <Item key={player.id}>
              <Player {...player} showMe />
            </Item>
          ))}
      </List>
    </section>
  )
}

export default Players
