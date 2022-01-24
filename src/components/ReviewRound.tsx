import React, { useContext, ChangeEvent, SyntheticEvent } from 'react'
import Head from 'next/head'
import { ClientEvent, PlayerVote } from '@/typings/socket-events'
import { Round, Scores, Player as PlayerType, GameStage } from '@/typings/game'
import { Button, Checkbox } from './visual'
import styled from '@emotion/styled'
import Player from './Player'
import Dialog from './Dialog'
import Countdown from './Countdown'
import { Flex } from './Grid'
import GameContext from '../contexts/GameContext'
import useScrollToTop from '../hooks/useScrollToTop'
import useIsSmallScreen from '../hooks/useIsSmallScreen'
import {
  useGameConfigCategories,
  useGameConfigRounds,
  useGamePlayers,
  useGameRoundAllAnswers,
  useGameRoundAllScores,
  useGameRoundEndingPlayer,
  useGameRoundIndex,
  useGameRoundTimeEnded,
  useGameRoundTimeStarted,
  useGameStateStage,
} from '@/hooks/supabase'
import usePlayer from '@/hooks/usePlayer'

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
  const emit = (...args: any[]) => console.log(...args)
  const isSmallScreen = useIsSmallScreen()
  const players = useGamePlayers()

  useScrollToTop()

  if (!emit) {
    return null
  }

  const handleVote =
    (playerID: string, category: string) => (event: ChangeEvent<HTMLInputElement>) => {
      const payload: PlayerVote = {
        playerID,
        category,
        value: event.target.checked,
      }
      emit(ClientEvent.VOTE_ANSWER, payload)
    }

  const getPlayer = (id: string) => players.find((player) => id === player.id)

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

          return (
            <tr key={`${categoryName}-${playerID}`}>
              <PlayerColumn>
                <Player {...player} small={isSmallScreen} />
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
  const emit = (...args: any[]) => console.log(...args)

  const gameAnswers = useGameRoundAllAnswers()
  const gameScores = useGameRoundAllScores()
  const stage = useGameStateStage()
  const categories = useGameConfigCategories()
  const timeStarted = useGameRoundTimeStarted()
  const timeEnded = useGameRoundTimeEnded()
  const numRounds = useGameConfigRounds()
  const roundEndingPlayer = useGameRoundEndingPlayer()
  const roundIndex = useGameRoundIndex()
  const players = useGamePlayers()

  if (!emit) return null

  const roundDuration = timeEnded - timeStarted

  const handleNextRoundClick = (event: SyntheticEvent<HTMLButtonElement>) => {
    emit(ClientEvent.START_ROUND)
  }

  const handleCancelStartGame = () => {
    emit(ClientEvent.CANCEL_START_ROUND)
  }

  const isLastRound = (roundIndex || 0) + 1 === numRounds

  const playerWhoEndedRound =
    players.find(({ id }) => id === roundEndingPlayer)?.name || roundEndingPlayer

  const RoundDuration =
    roundDuration === 0 ? null : <span> in {Math.floor(roundDuration / 1000)}s</span>

  return (
    <div>
      <Head>
        <title>Review - Stop The Bus</title>
      </Head>
      <h2>
        End of round {(roundIndex || 0) + 1}/{numRounds}
      </h2>
      <p>
        Round finished by <strong>{playerWhoEndedRound}</strong>
        {RoundDuration}
      </p>

      {categories.map((category) => {
        return (
          <ResultsTable
            key={category}
            categoryName={category}
            answers={gameAnswers as Round}
            scores={gameScores as Scores}
          />
        )
      })}

      <Button onClick={handleNextRoundClick}>{isLastRound ? 'Finish game' : 'Next round'}</Button>

      <Dialog>
        {!isLastRound && stage === GameStage.ACTIVE && (
          <Countdown
            from={3}
            onCancel={handleCancelStartGame}
            showAfter={{}.nextLetter?.toUpperCase()}
            // In reality it should be displayed for 1.5s, but instruct the
            // component to display it for longer to account for transport latency
            afterMessageDuration={3000}
          />
        )}
      </Dialog>
    </div>
  )
}
