import React, { useContext } from 'react'
import GameContext from '../contexts/GameContext'
import EmitterContext from '../contexts/EmitterContext'
import { GameName, List, Item, Link } from './visual'

export default function ReviewRound() {
  const emit = useContext(EmitterContext)
  const game = useContext(GameContext)

  if (!game || !emit) return null

  const { config, state, players } = game

  if (!state.finalScores) return null

  return (
    <div>
      <GameName>Game {config.id} finished</GameName>
      <List>
        {Object.entries(state.finalScores).map(([playerID, score], index) => {
          const playerData = players.find(({ uuid }) => uuid === playerID)
          const displayName = playerData?.name ?? playerID

          // if (index === 0) {
          //   return (
          //     <Item key={playerID}>
          //       {displayName} won with a score of {score}
          //     </Item>
          //   )
          // }

          return (
            <Item key={playerID}>
              {displayName} scored {score}
            </Item>
          )
        })}
      </List>
      <Link to='/'>Play another game</Link>
    </div>
  )
}
