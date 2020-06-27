import styled from './styled'

interface DistributeProps {
  columns: number[]
}

export const Distribute = styled.div<DistributeProps>`
  display: grid;
  grid-template-columns: ${(props) =>
    props.columns
      .map((col) => col + `fr`)
      .join(' ')
      .trim()};
`
