import React, { useContext } from 'react'
import { Helmet } from 'react-helmet'
import { GameName, Item, Link, List } from './visual'
import EmitterContext from '../contexts/EmitterContext'
import GameContext from '../contexts/GameContext'

export default function ReviewRound() {
  const emit = useContext(EmitterContext)
  const game = useContext(GameContext)

  if (!game || !emit) return null

  const { config, state, players } = game

  if (!state.finalScores) return null

  return (
    <div>
      <Helmet>
        <title>Game Finished - Stop The Bus</title>
      </Helmet>
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
