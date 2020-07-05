import React, { useContext, ChangeEvent, SyntheticEvent } from 'react'
import { Helmet } from 'react-helmet'
import { Button, Checkbox } from './visual'
import styled from './styled'
import Player from './Player'
import { Flex } from './layout'
import GameContext from '../contexts/GameContext'
import EmitterContext from '../contexts/EmitterContext'
import useScrollToTop from '../hooks/useScrollToTop'
import { ClientEvent, PlayerVote } from '../typings/socket-events'
import { Round, Scores, Player as PlayerType } from '../typings/game'

const Table = styled('table')`
  width: 100%;
  table-layout: fixed;
  margin-bottom: 3rem;
  border-collapse: collapse;

  thead {
    text-align: left;
  }

  td {
    padding-top: 0.5rem;
  }
`

const PlayerColumn = styled('td')`
  word-break: break-all;
  padding-right: 0.5rem;
`

const TableHeader = styled('thead')`
  padding-bottom: 0.5rem;
  font-size: 0.75rem;

  th {
    color: rgb(255 255 255 / 75%);
    padding-bottom: 0.5rem;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 1px rgb(255 255 255 / 10%);
  }
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

  const getPlayer = (uuid: string) =>
    game.players.find((player) => uuid === player.uuid)

  return (
    <Table>
      <colgroup>
        <col span={1} style={{ width: '30%' }} />
        <col span={1} style={{ width: '52.5%' }} />
        <col span={1} style={{ width: '17.5%' }} />
      </colgroup>
      <TableHeader>
        <tr>
          <th>{/* Player */}</th>
          <th>{categoryName}</th>
          <th>Score</th>
        </tr>
      </TableHeader>
      <tbody>
        {Object.keys(answers).map((playerID) => {
          const player = getPlayer(playerID) as PlayerType
          const answer = answers[playerID][categoryName]
          const score = scores[playerID][categoryName]

          if (score > 0) console.log({ score, bool: Boolean(score) })

          return (
            <tr key={`${categoryName}-${playerID}`}>
              <PlayerColumn>
                <Player {...player} small />
              </PlayerColumn>
              <td>{answer}</td>
              <td>
                <Flex yCentre>
                  <Checkbox
                    type='checkbox'
                    title='Vote'
                    checked={score > 0}
                    onChange={handleVote(playerID, categoryName)}
                  />{' '}
                  {score}
                </Flex>
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
