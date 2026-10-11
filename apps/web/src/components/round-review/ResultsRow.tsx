import styled from '@emotion/styled'
import { Flex } from '@/components/Grid'
import {
  manager,
  useGameConfigAlliteration,
  useGamePlayers,
  useGameRoundLetter,
} from '@/hooks/database'
import Player from '@/components/Player'
import { Checkbox } from '@/components/visual'
import useIsSmallScreen from '@/hooks/useIsSmallScreen'
import { ChangeEvent, memo } from 'react'
import { scoreAnswer } from '@/helpers/scores'
import useSound from 'use-sound'

const PlayerColumn = styled.td`
  word-break: break-all;
  padding-right: 0.5rem;
`

interface ResultsRowProps {
  playerId: string
  categoryName: string
  answer: string
  score: number
}

const ResultsRow: React.FC<ResultsRowProps> = (props) => {
  const { playerId, categoryName, answer, score } = props
  const isSmallScreen = useIsSmallScreen()
  const scoreWithAlliteration = useGameConfigAlliteration()
  const letter = useGameRoundLetter()
  const players = useGamePlayers()
  const player = players.find((player) => player.id === playerId)
  const [playCheck] = useSound('/sounds/tap.mp3', { volume: 0.1 })

  const handleVote =
    (playerId: string, category: string, answer: string) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      playCheck()
      const newScore = event.target.checked
        ? scoreAnswer(scoreWithAlliteration, letter!, answer)
        : 0
      manager.updateScore(playerId, category, newScore)
    }

  return (
    <tr key={`${categoryName}-${playerId}`}>
      <PlayerColumn>
        {player ? <Player {...player} small={isSmallScreen} /> : playerId}
      </PlayerColumn>
      <td>{answer}</td>
      <td>
        <Flex yCentre>
          <Checkbox
            type='checkbox'
            title='Vote'
            checked={score > 0}
            disabled={!answer}
            onChange={handleVote(playerId, categoryName, answer)}
          />{' '}
          {score}
        </Flex>
      </td>
    </tr>
  )
}

export default memo(ResultsRow, (prevProps, nextProps) => {
  return prevProps.score === nextProps.score
})
