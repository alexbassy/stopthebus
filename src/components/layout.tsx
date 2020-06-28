import styled from './styled'
import { css } from '@emotion/core'

interface GridProps {
  columns: number[]
  stackOnMobile: boolean
}

export const Grid = styled.div<GridProps>`
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

interface FlexProps {
  xCentre?: boolean
  yCentre?: boolean
}

export const Flex = styled.div<FlexProps>`
  display: flex;
  ${(props) => props.xCentre && `justify-items: center;`};
  ${(props) => props.yCentre && `align-items: center;`};
`
