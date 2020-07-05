import React, { useContext } from 'react'
import { css } from '@emotion/core'
import { Pin } from './Player'
import styled from './styled'
import { QuestionPositions } from '../typings/game'
import GameContext from '../contexts/GameContext'

interface LanesProps {
  questionPositions: QuestionPositions
}

const Wrapper = styled('div')`
  display: flex;
  margin-left: 0.5rem;
`

interface PinWrapperProps {
  count: number
}

const PlayerPinWrapper = styled<'span', PinWrapperProps>('span')`
  display: inline-block;
  margin-right: ${(props) => (props.count > 7 ? 0 : 0.25)}rem;
  line-height: 0;
  font-size: 0;
  max-height: 0.5rem;
  margin-top: -0.25rem;
  will-change: transform;
  transition: transform 0.25s ease-in-out;
  border-radius: 100%;
  ${(props) =>
    props.count > 7 &&
    css`
      box-shadow: 0 0 0 2px ${props.theme.colours.blue};
    `};
`

function Lanes(props: LanesProps) {
  const game = useContext(GameContext)

  if (!game || !game.players) {
    return null
  }

  return (
    <Wrapper>
      {game.players.map((player) => {
        const numPlayers = game.players.length
        const currentQuestion = game?.opponentProgress?.[player.uuid] ?? 0
        const playerOffset = props.questionPositions[currentQuestion]
        return (
          <PlayerPinWrapper
            key={player.uuid}
            count={numPlayers}
            style={{
              transform: `translateY(${playerOffset + currentQuestion}px)`,
            }}
          >
            <Pin colour={player.colour} small />
          </PlayerPinWrapper>
        )
      })}
    </Wrapper>
  )
}

// Compare the offsets against each other to determine
// whether the component should rerender. This prevents
// rerendering when typing into the fields.
export default React.memo(Lanes, (prevProps, nextProps) => {
  return (
    Object.values(prevProps.questionPositions).join('') ===
    Object.values(nextProps.questionPositions).join('')
  )
})
