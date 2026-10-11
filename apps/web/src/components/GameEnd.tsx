import { Player as PlayerType } from '@stopthebus/shared'

import { APP_ROUTES } from '@/client/api-routes'
import { useGamePlayers, useGameStateFinalScores, useGameStateNextGameId } from '@/hooks/database'

import Player from './Player'
import { ExternalLink, Item, List, Spacing } from './visual'

export default function ReviewRound() {
  const finalScores = useGameStateFinalScores()
  const gamePlayers = useGamePlayers()
  const nextGameId = useGameStateNextGameId()

  if (!finalScores || !nextGameId) {
    return null
  }

  const sortedScores = Object.entries(finalScores).sort((a, b) => {
    const scoreA = a[1]
    const scoreB = b[1]
    return scoreA < scoreB ? 1 : -1
  })

  return (
    <div>
      <title>Game Finished - Stop The Bus</title>
      <List>
        {sortedScores.map(([playerID, score], index) => {
          const playerData = gamePlayers.find(({ id }) => id === playerID) as PlayerType

          if (index === 0) {
            return (
              <Item key={playerID}>
                <Spacing b={0.5}>
                  <Player {...playerData} inline /> won with a score of {score}
                </Spacing>
              </Item>
            )
          }

          return (
            <Item key={playerID}>
              <Spacing b={0.5}>
                <Player {...playerData} inline /> scored {score}
              </Spacing>
            </Item>
          )
        })}
      </List>
      <ExternalLink href={APP_ROUTES.game(nextGameId)}>Play another game</ExternalLink>
    </div>
  )
}
