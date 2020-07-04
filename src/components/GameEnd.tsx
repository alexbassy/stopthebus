import React, { useContext } from 'react'
import { Helmet } from 'react-helmet'
import { Item, List, ExternalLink } from './visual'
import GameName from './GameName'
import EmitterContext from '../contexts/EmitterContext'
import GameContext from '../contexts/GameContext'

export default function ReviewRound() {
  const emit = useContext(EmitterContext)
  const game = useContext(GameContext)

  if (!game || !emit) return null

  const { config, state, players } = game

  if (!state.finalScores) return null

  const sortedScores = Object.entries(state.finalScores).sort((a, b) => {
    const scoreA = a[1]
    const scoreB = b[1]
    return scoreA > scoreB ? 1 : -1
  })

  return (
    <div>
      <Helmet>
        <title>Game Finished - Stop The Bus</title>
      </Helmet>
      <GameName />
      <List>
        {sortedScores.map(([playerID, score], index) => {
          const playerData = players.find(({ uuid }) => uuid === playerID)
          const displayName = playerData?.name ?? playerID

          if (index === 0) {
            return (
              <Item key={playerID}>
                {displayName} won with a score of {score}
              </Item>
            )
          }

          return (
            <Item key={playerID}>
              {displayName} scored {score}
            </Item>
          )
        })}
      </List>
      <ExternalLink href={`/game/${state.nextGameID}`}>
        Play another game
      </ExternalLink>
    </div>
  )
}
