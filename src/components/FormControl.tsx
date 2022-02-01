import React from 'react'
import { Grid } from '@nextui-org/react'

interface FormControlProps {
  action: React.ReactNode
  children: React.ReactNode
}

const FormControl: React.FC<FormControlProps> = (props) => {
  return (
    <Grid.Container gap={1}>
      <Grid xs={8}>{props.children}</Grid>
      <Grid xs={4}>{props.action}</Grid>
    </Grid.Container>
  )
}

export default FormControl
