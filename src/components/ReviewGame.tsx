import React, { useContext, useState, ChangeEvent, SyntheticEvent } from 'react'
import GameContext from '../contexts/GameContext'
import EmitterContext from '../contexts/EmitterContext'
import { RoundResults } from '../typings/game'
import { ClientEvent } from '../typings/socket-events'

export default function ReviewGame() {
  const emit = useContext(EmitterContext)
  const game = useContext(GameContext)

  if (!game || !emit) return null

  const { config, state, players } = game
  const lastRound = state.rounds[state.rounds.length - 1]

  if (!lastRound) return null

  return (
    <div>
      <h1>Game {config.id}</h1>
      <h2>Review</h2>
      <p>
        Round finished by <strong>{lastRound.endedByPlayer}</strong>
      </p>
      <ul>
        {config.categories.map((category) => {
          return (
            <li key={category}>
              <h3>{category}</h3>
              {Object.keys(lastRound.answers).map((player) => {
                const answersForPlayer = lastRound.answers[player]
                if (!answersForPlayer) return
                return (
                  <div>
                    <strong>{player}</strong>: {answersForPlayer[category]}
                  </div>
                )
              })}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
