import styled from '@emotion/styled'

interface FlexProps {
  xCentre?: boolean
  yCentre?: boolean
}

export const Flex = styled.div<FlexProps>`
  display: flex;
  ${(props) => props.xCentre && `justify-content: center;`};
  ${(props) => props.yCentre && `align-items: center;`};
`
