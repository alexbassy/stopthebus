import React from 'react'
import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { SMALL_SCREEN_BREAKPOINT } from '@/constants/styles'
import { Pin } from './Player'
import { useGamePlayers, usegameRoundOpponentProgress } from '@/hooks/database'

interface LanesProps extends Record<string, number> {}

const Wrapper = styled.div`
  display: flex;
  margin-left: 1rem;

  @media screen and (max-width: ${SMALL_SCREEN_BREAKPOINT}px) {
    margin-left: 0.5rem;
  }
`

interface PinWrapperProps {
  count: number
}

const PlayerPinWrapper = styled.span<PinWrapperProps>`
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
      box-shadow: 0 0 0 2px ${props.theme.colours.gameBackground};
    `};
`

function Lanes(props: LanesProps) {
  const gamePlayers = useGamePlayers()
  const opponentProgress = usegameRoundOpponentProgress()
  const numPlayers = gamePlayers.length

  if (!opponentProgress) {
    return null
  }

  return (
    <Wrapper>
      {gamePlayers.map((player) => {
        const currentQuestion = opponentProgress?.[player.id]
        const playerOffset = props[currentQuestion]

        return (
          <PlayerPinWrapper
            key={player.id}
            count={numPlayers}
            style={{
              transform: `translateY(${playerOffset}px)`,
            }}
          >
            <Pin colour={player.colour} small />
          </PlayerPinWrapper>
        )
      })}
    </Wrapper>
  )
}

export default Lanes
