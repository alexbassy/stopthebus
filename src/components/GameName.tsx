import React, { useContext, SyntheticEvent } from 'react'
import { css } from '@emotion/core'
import { useParams } from 'react-router-dom'
import styled from './styled'
import { Spacing } from './visual'
import GameContext from '../contexts/GameContext'
import log from '../helpers/log'

interface GameNameProps {
  inactive?: boolean
}

interface GameParams {
  gameID: string
}

const baseStyles = css`
  font-size: 1.5rem;
  font-family: monospace;

  @media screen and (max-width: 460px) {
    font-size: 1.25rem;
  }
`

const Title = styled<'h2'>('h2')`
  ${baseStyles}
  margin: 0 1rem 0 0;
`

const BorderedName = styled<'h2'>('h2')`
  display: inline-flex;
  align-items: center;
  ${baseStyles}
  border: 2px dashed #fff;
  padding: 0.5rem;
  border-radius: 6px;
`

const ShareIcon = `<svg width="27" height="32" xmlns="http://www.w3.org/2000/svg"><path d="M0 16v11.64A4.35 4.35 0 004.36 32h17.46a4.35 4.35 0 004.36-4.36V16a1.46 1.46 0 00-2.9 0v11.64a1.45 1.45 0 01-1.46 1.45H4.36a1.45 1.45 0 01-1.45-1.45V16A1.46 1.46 0 000 16zM11.64 4.97v15.4a1.46 1.46 0 002.9 0V4.96l3.34 3.33a1.45 1.45 0 102.06-2.06L14.12.43A1.47 1.47 0 0012.53.1c-.17.07-.33.18-.47.32L6.24 6.24A1.45 1.45 0 108.3 8.3l3.34-3.33z" fill="white" fill-rule="nonzero"/></svg>`

const ShareButton = styled<'button'>('button')`
  -webkit-appearance: none;
  appearance: none;
  background-color: transparent;
  border: none;
  width: 1.25rem;
  height: 1.25rem;
  background-image: url('data:image/svg+xml;utf8,${ShareIcon}');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 80%;
  padding: .75rem;

  @media screen and (max-width: 460px) {
  width: 1rem;
  height: 1rem;
    background-size: 70%
  }
`

export default function GameName(props: GameNameProps) {
  const { gameID: paramsGameID }: GameParams = useParams()
  const game = useContext(GameContext)
  const gameID = game && game.config ? game.config.id : paramsGameID

  const handleShareClick = async (event: SyntheticEvent<HTMLButtonElement>) => {
    try {
      await window.navigator.share({
        title: `Share game ${gameID}`,
        url: window.location.href,
      })
    } catch (e) {
      console.log(e)
      log.e('GAME_NAME.tsx', 'Share API not supported')
    }
  }

  if (!game || !game.config || props.inactive) {
    return (
      <Spacing t={1} b={1}>
        <Title>{paramsGameID}</Title>
      </Spacing>
    )
  }

  return (
    <BorderedName>
      <Title>{game.config.name} </Title>
      <ShareButton type='button' onClick={handleShareClick} />
    </BorderedName>
  )
}
