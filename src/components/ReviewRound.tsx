import React, { useContext, ChangeEvent, SyntheticEvent } from 'react'
import { Helmet } from 'react-helmet'
import { Button, Checkbox } from './visual'
import styled from './styled'
import GameContext from '../contexts/GameContext'
import EmitterContext from '../contexts/EmitterContext'
import useScrollToTop from '../hooks/useScrollToTop'
import { ClientEvent, PlayerVote } from '../typings/socket-events'
import { Round, Scores } from '../typings/game'

const Table = styled('table')`
  width: 100%;
  table-layout: fixed;
  margin-bottom: 2rem;

  thead {
    text-align: left;
  }
`

const PlayerColumn = styled('td')`
  word-break: break-all;
  padding-right: 0.5rem;
`

interface ResultsTableProps {
  categoryName: string
  answers: Round
  scores: Scores
}

const ResultsTable = ({ categoryName, answers, scores }: ResultsTableProps) => {
  const game = useContext(GameContext)
  const emit = useContext(EmitterContext)

  useScrollToTop()

  if (!game || !emit) {
    return null
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

  const getPlayerName = (uuid: string) =>
    game.players.find((player) => uuid === player.uuid)?.name || uuid

  return (
    <Table>
      <colgroup>
        <col span={1} style={{ width: '30%' }} />
        <col span={1} style={{ width: '50%' }} />
        <col span={1} style={{ width: '20%' }} />
      </colgroup>
      <thead>
        <tr>
          <th>{/* Player */}</th>
          <th>{categoryName}</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(answers).map((playerID) => {
          const answer = answers[playerID][categoryName]
          const score = scores[playerID][categoryName]

          if (score > 0) console.log({ score, bool: Boolean(score) })

          return (
            <tr key={`${categoryName}-${playerID}`}>
              <PlayerColumn>{getPlayerName(playerID)}</PlayerColumn>
              <td>{answer}</td>
              <td>
                <Checkbox
                  type='checkbox'
                  title='Vote'
                  checked={score > 0}
                  onChange={handleVote(playerID, categoryName)}
                />{' '}
                {score}
              </td>
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
}

export default function ReviewRound() {
  const emit = useContext(EmitterContext)
  const game = useContext(GameContext)

  if (!game || !emit) return null

  const { config, state, players } = game
  const round = state.currentRound
  const timeStarted = state.currentRound?.timeStarted ?? 0
  const timeEnded = state.currentRound?.timeEnded ?? timeStarted
  const roundDuration = timeEnded - timeStarted

  if (!round) return null

  const handleNextRoundClick = (event: SyntheticEvent<HTMLButtonElement>) => {
    emit(ClientEvent.START_ROUND)
  }

  const isLastRound = state.rounds.length + 1 === config.rounds

  const playerWhoEndedRound =
    players.find(({ uuid }) => uuid === round.endedByPlayer)?.name ||
    round.endedByPlayer

  const RoundDuration =
    roundDuration === 0 ? null : (
      <span> in {Math.floor(roundDuration / 1000)}s</span>
    )

  return (
    <div>
      <Helmet>
        <title>Review - Stop The Bus</title>
      </Helmet>
      <h2>
        End of round {state.rounds.length + 1}/{config.rounds}
      </h2>
      <p>
        Round finished by <strong>{playerWhoEndedRound}</strong>
        {RoundDuration}
      </p>

      {config.categories.map((category) => {
        return (
          <ResultsTable
            key={category}
            categoryName={category}
            answers={round.answers}
            scores={round.scores}
          />
        )
      })}

      <Button onClick={handleNextRoundClick}>
        {isLastRound ? 'Finish game' : 'Next round'}
      </Button>
    </div>
  )
}
