import { css } from '@emotion/core'
import styled from './styled'

export const globalStyles = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  html {
    height: 100%;
  }
  body {
    font-family: sans-serif;
    margin: 0;
    height: 100%;
    --webkit-font-smoothing: antialiased;
    --moz-osx-font-smoothing: grayscale;
  }
  #root {
    height: 100%;
  }
`

export const Background = styled('div')`
  width: 100%;
  min-height: 100%;
  background-color: #00a1e0;
  padding: 1px 0;
`

export const Wrapper = styled('div')`
  max-width: 760px;
  margin: 2rem auto;
  background: ${(props) => props.theme.colours.blue};
  font-family: ${(props) => props.theme.fonts.body.name};
  padding: 20px;
  color: #fff;
  font-size: 120%;
  box-shadow: 1px 1px ${(props) => props.theme.colours.purple},
    2px 2px ${(props) => props.theme.colours.purple},
    3px 3px ${(props) => props.theme.colours.purple},
    4px 4px ${(props) => props.theme.colours.purple};
`

export const Title = styled<'h1'>('h1')`
  font-family: ${(props) => props.theme.fonts.title.name};
  color: ${(props) => props.theme.colours.yellow};
  text-shadow: 1px 1px ${(props) => props.theme.colours.pink},
    2px 2px ${(props) => props.theme.colours.pink},
    3px 3px ${(props) => props.theme.colours.pink},
    4px 4px ${(props) => props.theme.colours.pink};
  text-transform: uppercase;
  font-size: 4.9rem;
  margin: 0;
  text-align: center;
`

export const H2 = styled<'h2'>('h2')`
  text-shadow: 1px 1px rgb(0 0 0 / 40%);
`

export const H3 = H2.withComponent('h3')

export const Input = styled<'input'>('input')`
  font-size: 1.2rem;
  padding: 0.5rem;
  -webkit-appearance: none;
  border: 1px solid;
`

export const Checkbox = styled<'input'>('input')`
  font-size: 1.2rem;
  padding: 0 0.25rem;
  -webkit-appearance: none;
  border: 1px solid;
  background: white;

  ::before {
    content: '✔';
    color: white;
  }

  &[checked]::before {
    color: black;
  }
`

export const Button = styled<'button'>('button')`
  font-size: 1.2rem;
  padding: 0.5rem;
  -webkit-appearance: none;
`

export const List = styled<'ul'>('ul')`
  list-style: none;
  padding-left: 0;
`

interface ListItemProps {
  inline?: boolean
}

export const Item = styled<'li', ListItemProps>('li')`
  display: ${(props) => (props.inline ? 'inline-block' : 'block')};
`

interface SpacingProps {
  l?: number
  t?: number
  r?: number
  b?: number
}

export const Spacing = styled<'div', SpacingProps>('div')`
  ${(props) => props.l && `margin-left: ${props.l}rem;`};
  ${(props) => props.t && `margin-top: ${props.t}rem;`};
  ${(props) => props.r && `margin-right: ${props.r}rem;`};
  ${(props) => props.b && `margin-bottom: ${props.b}rem;`};
`
