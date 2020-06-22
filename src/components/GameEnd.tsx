import React, { useContext } from 'react'
import GameContext from '../contexts/GameContext'
import EmitterContext from '../contexts/EmitterContext'

export default function ReviewRound() {
  const emit = useContext(EmitterContext)
  const game = useContext(GameContext)

  if (!game || !emit) return null

  const { config, state } = game

  if (!state.finalScores) return null

  return (
    <div>
      <h2>Game {config.id} finished</h2>
      <ul>
        {Object.entries(state.finalScores).map(([playerID, score]) => {
          return (
            <li key={playerID}>
              {playerID} scored {score}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
