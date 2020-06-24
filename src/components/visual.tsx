import { css } from '@emotion/core'
import styled from './styled'

export const globalStyles = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  body {
    font-family: sans-serif;
  }
`

export const Title = styled<'h1'>('h1')`
  font-family: ${(props) => props.theme.fonts.title.name};
  color: #007eff;
  font-size: 3rem;
`
