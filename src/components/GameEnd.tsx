import React, { useContext } from 'react'
import GameContext from '../contexts/GameContext'
import EmitterContext from '../contexts/EmitterContext'

export default function ReviewRound() {
  const emit = useContext(EmitterContext)
  const game = useContext(GameContext)

  if (!game || !emit) return null

  const { config, state, players } = game

  if (!state.finalScores) return null

  return (
    <div>
      <h2>Game {config.id} finished</h2>
      <ul>
        {Object.entries(state.finalScores).map(([playerID, score]) => {
          const playerData = players.find(({ uuid }) => uuid === playerID)
          const displayName = playerData?.name ?? playerID

          return (
            <li key={playerID}>
              {displayName} scored {score}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
