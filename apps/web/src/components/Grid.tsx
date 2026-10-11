import styled from '@emotion/styled'

interface GridProps {
  columns: number[]
  gap?: number
  stackOnMobile?: boolean
}

const getTemplateColumns = (cols: number[]) =>
  cols
    .map((col) => col + 'fr')
    .join(' ')
    .trim()

export const Grid = styled.div<GridProps>`
  --mobile-columns: ${(props) =>
    props.stackOnMobile ? '1fr' : getTemplateColumns(props.columns)};
  display: grid;
  grid-template-columns: ${(props) => getTemplateColumns(props.columns)};
  grid-column-gap: ${(props) => props.gap + 'rem'};

  @media screen and (max-width: 460px) {
    grid-template-columns: var(--mobile-columns);
  }
`

interface FlexProps {
  xCentre?: boolean
  yCentre?: boolean
}

export const Flex = styled.div<FlexProps>`
  display: flex;
  ${(props) => props.xCentre && `justify-content: center;`};
  ${(props) => props.yCentre && `align-items: center;`};
`
