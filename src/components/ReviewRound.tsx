import React, { useContext, ChangeEvent, SyntheticEvent } from 'react'
import GameContext from '../contexts/GameContext'
import EmitterContext from '../contexts/EmitterContext'
import { ClientEvent, PlayerVote } from '../typings/socket-events'
import { Button, List, Item } from './visual'
import styled from './styled'
import { categories } from '../constants/categories'

const Table = styled('table')`
  width: 100%;

  thead {
    text-align: left;
  }
`

export default function ReviewRound() {
  const emit = useContext(EmitterContext)
  const game = useContext(GameContext)

  if (!game || !emit) return null

  const { config, state, players } = game
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

  const playerWhoEndedRound =
    players.find(({ uuid }) => uuid === round.endedByPlayer)?.name ||
    round.endedByPlayer

  return (
    <div>
      <h1>Game {config.id}</h1>
      <h2>Review of round {state.rounds.length + 1}</h2>
      <p>
        Round finished by <strong>{playerWhoEndedRound}</strong>
      </p>
      <Table>
        <thead>
          <th></th>
          {config.categories.map((category, index) => {
            return <th key={category}>{category}</th>
          })}
          <th>Points</th>
        </thead>
        <tbody>
          {config.categories.map((category, index) => {
            return Object.keys(round.answers).map((player) => {
              const answersForPlayer = round.answers[player]
              const playerData = players.find(({ uuid }) => uuid === player)
              const displayName = playerData?.name ?? player
              if (!answersForPlayer) return null
              const score = round.scores[player][category]

              return (
                <tr key={category}>
                  <td>{displayName}</td>
                  <td>{answersForPlayer[category]}</td>
                  <td>
                    <input
                      type='checkbox'
                      title='Vote'
                      checked={Boolean(score)}
                      onChange={handleVote(player, category)}
                    />{' '}
                    {score} point{score === 1 ? '' : 's'}
                  </td>
                </tr>
              )
            })
          })}
        </tbody>
      </Table>

      <Button onClick={handleNextRoundClick}>Next round</Button>
    </div>
  )
}
