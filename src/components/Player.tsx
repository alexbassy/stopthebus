import React from 'react'
import { Player as PlayerType } from '@/typings/game'
import { getUserSessionID } from '@/helpers/getUserSession'
import styled from '@emotion/styled'
import { Spacing, Lighter } from './visual'

interface PlayerProps extends PlayerType {
  inline?: boolean
  small?: boolean
  showMe?: boolean
}

const sessionID = getUserSessionID()

interface PinProps {
  colour?: string
  small?: boolean
}

interface WrapperProps {
  inline?: boolean
  small?: boolean
}

const Wrapper = styled<'div', WrapperProps>('div')`
  display: ${(props) => (props.inline ? 'inline-block' : 'block')};
  font-size: ${(props) => (props.small ? '0.75rem' : 'inherit')};
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
    <Wrapper inline={props.inline} small={props.small}>
      <Pin colour={props.colour} small={props.small} />
      <Spacing r={props.small ? 0.25 : 0.5} inline />
      {props.name || props.uuid}{' '}
      {props.showMe && !props.inline && props.uuid === sessionID && (
        <Lighter> (me)</Lighter>
      )}
    </Wrapper>
  )
}
