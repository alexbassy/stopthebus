import React, { useContext, ChangeEvent, SyntheticEvent } from 'react'
import GameContext from '../contexts/GameContext'
import EmitterContext from '../contexts/EmitterContext'
import { ClientEvent, PlayerVote } from '../typings/socket-events'

export default function ReviewRound() {
  const emit = useContext(EmitterContext)
  const game = useContext(GameContext)

  if (!game || !emit) return null

  const { config, state } = game
  const round = state.currentRound

  const handleNextRoundClick = (event: SyntheticEvent<HTMLButtonElement>) => {
    emit(ClientEvent.START_ROUND)
  }

  const handleVote = (playerID: string, category: string) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const payload: PlayerVote = {
      playerID,
      category,
      value: event.target.checked,
    }
    emit(ClientEvent.VOTE_ANSWER, payload)
  }

  if (!round) return null

  return (
    <div>
      <h1>Game {config.id}</h1>
      <h2>Review of round {state.rounds.length + 1}</h2>
      <p>
        Round finished by <strong>{round.endedByPlayer}</strong>
      </p>
      <ul>
        {config.categories.map((category) => {
          return (
            <li key={category}>
              <h3>{category}</h3>
              {Object.keys(round.answers).map((player) => {
                const answersForPlayer = round.answers[player]
                if (!answersForPlayer) return null
                const score = round.scores[player][category]
                return (
                  <div key={`result-${player}`}>
                    <strong>{player}</strong>: {answersForPlayer[category]}
                    <input
                      type='checkbox'
                      title='Vote'
                      checked={Boolean(score)}
                      onChange={handleVote(player, category)}
                    />{' '}
                    {score} point{score === 1 ? '' : 's'}
                  </div>
                )
              })}
            </li>
          )
        })}
      </ul>
      <button onClick={handleNextRoundClick}>Next round</button>
    </div>
  )
}
