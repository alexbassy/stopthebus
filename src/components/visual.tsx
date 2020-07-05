import { css } from '@emotion/core'
import { Link as RouterLink } from 'react-router-dom'
import styled from './styled'

export const globalStyles = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  html {
    height: 100%;
    scroll-behavior: smooth;
  }
  body {
    font-family: sans-serif;
    margin: 0;
    height: 100%;
    background: #132339;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  #root {
    height: 100%;
  }
`

export const Background = styled('div')`
  width: 100%;
  min-height: 100%;
  background-color: ${(props) => props.theme.colours.pageBackground};
  padding: 1px 0;

  @media screen and (max-width: 768px) {
    height: 100%;
  }
`

export const Wrapper = styled('div')`
  max-width: 760px;
  margin: 2rem auto 0;
  background: ${(props) => props.theme.colours.blue};
  font-family: ${(props) => props.theme.fonts.body.name};
  padding: 20px;
  color: #fff;
  font-size: 120%;
  border: 10px solid ${(props) => props.theme.colours.pink};

  @media screen and (max-width: 768px) {
    min-height: 100%;
    margin: 0 auto;
    max-width: 100%;
    border: 10px solid ${(props) => props.theme.colours.pink};
  }
`

export const H2 = styled<'h2'>('h2')`
  text-shadow: 1px 1px rgb(0 0 0 / 40%);
`

export const H3 = H2.withComponent('h3')

export const HiddenLabel = styled<'label'>('label')`
  position: absolute !important;
  height: 1px;
  width: 1px;
  overflow: hidden;
  clip: rect(1px, 1px, 1px, 1px);
  white-space: nowrap; /* added line */
`

export const Input = styled<'input'>('input')`
  font-size: 1.2rem;
  padding: 0.75rem;
  -webkit-appearance: none;
  font-family: inherit;
  border: none;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 30%);
  color: ${(props) =>
    props.readOnly ? `rgb(220, 220, 220)` : `rgb(255 255 255)`};
  outline: none;
  box-shadow: 0 0 0 0 ${(props) => props.theme.colours.pink};
  background-color: ${(props) => props.theme.colours.inputBackground};
  transition: box-shadow 0.25s ease;

  ::placeholder {
    color: rgb(255 255 255 / 80%);
  }

  :focus {
    box-shadow: 0 0 0 3px ${(props) => props.theme.colours.pink};
  }
`

export const Checkbox = styled<'input'>('input')`
  font-size: 1.2rem;
  padding: 0 0.4rem;
  -webkit-appearance: none;
  border: none;
  box-shadow: 0 1px 2px rgb(0 0 0 / 30%);
  border-radius: 2px;
  background-color: ${(props) => props.theme.colours.inputBackground};
  width: 1.5rem;
  height: 1.5rem;
  vertical-align: middle;
  color: #fff;
  margin-right: 0.5rem;

  ${(props) =>
    props.checked &&
    css`
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 125"><path fill="white" d="M80.47 28.54a4 4 0 00-5.66 0L40.87 62.48 27.19 48.81a4 4 0 00-5.65 5.65l16.5 16.5a3.99 3.99 0 005.66 0L80.47 34.2a4 4 0 000-5.66z" /></svg>');
      background-size: 110%;
      background-position: center top;
    `}

  :focus {
    outline: none;
    box-shadow: 0 0 0 2px ${(props) => props.theme.colours.pink};
  }

  :active {
    background-color: #274672;
  }
`

const DownArrow = `<svg width="10" height="6" xmlns="http://www.w3.org/2000/svg"><path d="M.6 0a.59.59 0 00-.42.19.69.69 0 000 .92l4.39 4.7a.58.58 0 00.86 0l4.38-4.7A.68.68 0 009.83.2a.58.58 0 00-.86 0L5 4.44 1.03.2A.59.59 0 00.6 0z" fill="white" fill-rule="nonzero"/></svg>`

export const Select = styled<'select'>('select')`
  font-size: 1rem;
  padding: 0.3rem 1.5rem 0.3rem 1rem;
  -webkit-appearance: none;
  font-family: inherit;
  border: none;
  box-shadow: 0 1px 2px rgb(0 0 0 / 30%);
  border-radius: 2px;
  background-color: ${(props) => props.theme.colours.inputBackground};
  background-image: url('data:image/svg+xml;utf8,${DownArrow}');
  background-position: center right 0.5rem;
  background-repeat: no-repeat;
  vertical-align: middle;
  color: #fff;
  margin-right: 0.5rem;

  :focus {
    outline: none;
    box-shadow: 0 0 0 2px ${(props) => props.theme.colours.pink};
  }

  :active {
    background-color: #274672;
  }
`

interface ButtonProps {
  large?: boolean
}

export const Button = styled<'button', ButtonProps>('button')`
  font-size: ${(props) => (props.large ? '1.5rem' : '1.15rem')};
  padding: 0.75rem;
  -webkit-appearance: none;
  background: #2866bd;
  font-family: inherit;
  font-weight: 500;
  color: #fff;
  border: none;
  border-radius: 8px;

  :focus {
    outline: none;
  }

  :active {
    box-shadow: 0 0 0 2px ${(props) => props.theme.colours.pink};
  }
`

export const ExternalLink = styled<'a'>('a')`
  color: #fff;
  cursor: pointer;

  :visited {
    color: #fff;
  }
`

export const Link = ExternalLink.withComponent(RouterLink)

interface ListProps {
  columns?: number[]
  stackOnMobile?: boolean
}

export const List = styled<'ul', ListProps>('ul')`
  list-style: none;
  padding-left: 0;
  ${(props) =>
    props.columns
      ? css`
          display: grid;
          grid-template-columns: ${props.columns
            .map((col) => col + `fr`)
            .join(' ')
            .trim()};

          ${props.stackOnMobile &&
          css`
            @media screen and (max-width: 460px) {
              grid-template-columns: 1fr;
            }
          `}
        `
      : ''}
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
  inline?: boolean
}

export const Spacing = styled<'div', SpacingProps>('div')`
  ${(props) => props.l && `margin-left: ${props.l}rem;`};
  ${(props) => props.t && `margin-top: ${props.t}rem;`};
  ${(props) => props.r && `margin-right: ${props.r}rem;`};
  ${(props) => props.b && `margin-bottom: ${props.b}rem;`};
  ${(props) => props.inline && `display: inline-block;`};
`

export const Lighter = styled<'span'>('span')`
  color: rgb(255 255 255 / 60%);
  font-weight: 400;
`

export const Description = styled(Lighter)`
  font-size: 0.85rem;
`
