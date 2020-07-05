import React from 'react'
import { Grid } from './layout'
import styled from './styled'
import { SMALL_SCREEN_BREAKPOINT } from '../constants/styles'

interface FormControlProps {
  children: React.ReactNode
}

const StyledGrid = styled(Grid)`
  max-width: 400px;

  > * {
    width: 100%;
  }

  @media screen and (max-width: ${SMALL_SCREEN_BREAKPOINT}px) {
    max-width: 100%:
  }
`

export default function FormControl(props: FormControlProps) {
  return (
    <StyledGrid columns={[3, 1]} gap={0.5}>
      {props.children}
    </StyledGrid>
  )
}
