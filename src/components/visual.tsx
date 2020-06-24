import { css } from '@emotion/core'
import styled from '@emotion/styled'

export const globalStyles = css``

export const Title = styled.h1`
  font-family: ${(props) => props.theme?.title?.font};
`
