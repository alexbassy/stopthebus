import React from 'react'
import { SMALL_SCREEN_BREAKPOINT } from '@/constants/styles'
import { Grid } from './Grid'
import styled from '@emotion/styled'

interface FormControlProps {
  children: React.ReactNode
}

const StyledGrid = styled(Grid)`
  max-width: calc(100vw - 2rem);

  > * {
    max-width: 100%;
    min-width: 0;
  }

  @media screen and (max-width: ${SMALL_SCREEN_BREAKPOINT}px) {
    max-width: 100%;
  }
`

export default function FormControl(props: FormControlProps) {
  return (
    <StyledGrid columns={[5, 2]} gap={0.5}>
      {props.children}
    </StyledGrid>
  )
}
