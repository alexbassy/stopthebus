import React from 'react'
import styled from './styled'
import { Spacing } from './visual'
import { Player as PlayerType } from '../typings/game'
import { getUserSessionID } from '../helpers/getUserSession'

const sessionID = getUserSessionID()

interface PinProps {
  colour?: string
}

export const Pin = styled<'span', PinProps>('span')`
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border-radius: 100%;
  background-color: ${(props) => props.colour};
  vertical-align: middle;
`

const Lighter = styled<'span'>('span')`
  color: rgb(255 255 255 / 60%);
`

export default function Player(props: PlayerType) {
  return (
    <div>
      <Pin colour={props.colour} />
      <Spacing r={0.5} inline />
      {props.name || props.uuid}{' '}
      {props.uuid === sessionID && <Lighter> (me)</Lighter>}
    </div>
  )
}
