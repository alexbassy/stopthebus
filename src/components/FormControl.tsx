import React from 'react'
import { Grid } from './layout'
import styled from './styled'
import { Button } from './visual'
import useIsSmallScreen from '../hooks/useIsSmallScreen'

interface FormControlProps {
  children: React.ReactNode
}

const StyledGrid = styled(Grid)`
  > * {
    width: 100%;
  }
`

export default function FormControl(props: FormControlProps) {
  const isSmallScreen = useIsSmallScreen()

  if (isSmallScreen) {
    return (
      <StyledGrid columns={[3, 1]} gap={0.5}>
        {props.children}
      </StyledGrid>
    )
  }

  return <>{props.children}</>
}
