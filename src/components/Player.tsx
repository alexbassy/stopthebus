import React from 'react'
import styled from './styled'
import { Spacing, Lighter } from './visual'
import { Player as PlayerType } from '../typings/game'
import { getUserSessionID } from '../helpers/getUserSession'

interface PlayerProps extends PlayerType {
  inline?: boolean
}

const sessionID = getUserSessionID()

interface PinProps {
  colour?: string
  small?: boolean
}

interface WrapperProps {
  inline?: boolean
}

const Wrapper = styled<'div', WrapperProps>('div')`
  display: ${(props) => (props.inline ? 'inline-block' : 'block')};
`

export const Pin = styled<'span', PinProps>('span')`
  --size: ${(props) => (props.small ? '0.5rem' : '1rem')};
  display: inline-block;
  width: var(--size);
  height: var(--size);
  border-radius: 100%;
  background-color: ${(props) => props.colour};
  vertical-align: middle;
`

export default function Player(props: PlayerProps) {
  return (
    <Wrapper inline={props.inline}>
      <Pin colour={props.colour} />
      <Spacing r={0.5} inline />
      {props.name || props.uuid}{' '}
      {!props.inline && props.uuid === sessionID && <Lighter> (me)</Lighter>}
    </Wrapper>
  )
}
