import styled from './styled'
import { css } from '@emotion/core'

interface DistributeProps {
  columns: number[]
  stackOnMobile: boolean
}

export const Distribute = styled.div<DistributeProps>`
  display: grid;
  grid-template-columns: ${(props) =>
    props.columns
      .map((col) => col + `fr`)
      .join(' ')
      .trim()};

  ${(props) =>
    props.stackOnMobile &&
    css`
      @media screen and (max-width: 460px) {
        grid-template-columns: 1fr;
      }
    `}
`
