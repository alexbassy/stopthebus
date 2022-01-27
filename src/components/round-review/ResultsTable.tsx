import { ChangeEvent } from 'react'
import {
  manager,
  useGameConfigAlliteration,
  useGamePlayers,
  useGameRoundLetter,
} from '@/hooks/supabase'
import useIsSmallScreen from '@/hooks/useIsSmallScreen'
import useScrollToTop from '@/hooks/useScrollToTop'
import { Round, Scores } from '@/typings/game'
import { PlayerVote } from '@/typings/socket-events'
import styled from '@emotion/styled'
import { Flex } from '@/components/Grid'
import Player from '@/components/Player'
import { Checkbox } from '@/components/visual'
import { scoreAnswer } from '@/helpers/scores'
import ResultsRow from '@/components/round-review/ResultsRow'

const Table = styled.table`
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

const PlayerColumn = styled.td`
  word-break: break-all;
  padding-right: 0.5rem;
`

const TableHeader = styled.thead`
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
  answers: Record<string, string>
  scores: Record<string, number>
}

const ResultsTable = ({ categoryName, answers, scores }: ResultsTableProps) => {
  useScrollToTop()

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
        {Object.entries(answers).map(([playerId, answer]) => {
          const score = scores[playerId]

          return (
            <ResultsRow
              key={`${categoryName}-${playerId}`}
              playerId={playerId}
              categoryName={categoryName}
              answer={answer}
              score={score}
            />
          )
        })}
      </tbody>
    </Table>
  )
}

export default ResultsTable
