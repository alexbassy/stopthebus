import React, { ReactChild } from 'react'
import { Helmet } from 'react-helmet'
import { ThemeProvider } from 'emotion-theming'
import { Global } from '@emotion/core'
import {
  globalStyles,
  Background,
  Wrapper,
  Spacing,
  ExternalLink,
} from './visual'
import styled from './styled'
import { Flex } from './layout'

interface Typeface {
  name: string
  href: string
}

export interface Theme {
  fonts: { [typeface: string]: Typeface }
  colours: { [color: string]: string }
}

const pastel: Theme = {
  fonts: {
    title: {
      name: 'Raleway, sans-serif',
      href:
        'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Raleway:wght@700&display=swap',
    },
    body: {
      name: '"Roboto"',
      href: '',
    },
  },
  colours: {
    orange: '#FF9770',
    pink: '#FF70A6',
    yellow: '#FFD670',
    lemon: '#E9FF70',
    blue: '#1d3557',
    purple: '#b523da',
    green: '#35EF9E',
    text: '#fff',
    interactiveButton: 'rgb(80 80 80)',
    pageBackground: '#132339',
    inputBackground: '#2e5286',
    buttonBackground: '#2866bd',
  },
}

const themes = { pastel }

interface ThemedProps {
  theme?: 'pastel'
  children: ReactChild
}

const Footer = styled<'footer'>('footer')`
  color: #fff;
  text-align: center;
  font-weight: 600;
`.withComponent(Flex)

const FooterLink = styled(ExternalLink)`
  text-decoration: none;
  color: rgb(255 255 255 / 90%);
`

const PrideBanner = styled<'div'>('div')`
  color: #fff;
  text-align: center;
  text-transform: uppercase;
`.withComponent(Flex)

const PrideFlag = styled<'div'>('div')`
  display: inline-block;
  width: 50px;
  height: 28px;
  margin-right: 1rem;
  overflow: hidden;
  border-radius: 2px;

  svg {
    width: 100%;
    height: 100%;
  }
`

const PrideFlagSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="50" height="28">
  <g fill="none" fill-rule="evenodd">
    <path fill="#EE3024" d="M0 0h50v4.02H0z"/>
    <path fill="#F67F29" d="M0 4.02h50v5.07H0z"/>
    <path fill="#FFEF01" d="M0 9.09h50v5.07H0z"/>
    <path fill="#57B946" d="M0 14.16h50v5.07H0z"/>
    <path fill="#0254A6" d="M0 19.23h50v5.07H0z"/>
    <path fill="#9F258F" d="M0 24.3h50v3.85H0z"/>
    <g>
      <path fill="#010101" d="M7.03-4.37l18.54 18.54L7.03 32.71l-18.54-18.54z"/>
      <path fill="#603A17" d="M2.17-4.39l18.55 18.54L2.18 32.7l-18.55-18.54z"/>
    </g>
    <path fill="#7CC0EA" d="M-2.5-4.39l18.55 18.54L-2.5 32.7l-18.54-18.54z"/>
    <path fill="#F498C0" d="M-6.34-4.38L12.2 14.16-6.34 32.7l-18.54-18.54z"/>
    <path fill="#FAF9F5" d="M-10.01-4.39L8.53 14.15-10.01 32.7l-18.54-18.54z"/>
  </g>
</svg>
`

export default function Themed({ theme = 'pastel', children }: ThemedProps) {
  return (
    <ThemeProvider theme={themes[theme]}>
      <Helmet>
        <link href={themes[theme].fonts.title.href} rel='stylesheet' />
      </Helmet>
      <Global styles={globalStyles} />
      <Background>
        <Wrapper>
          {children}
          <Spacing t={2} />
          <PrideBanner yCentre xCentre>
            <PrideFlag dangerouslySetInnerHTML={{ __html: PrideFlagSVG }} />
            <strong>Happy Pride</strong>
          </PrideBanner>
        </Wrapper>
        <Footer yCentre xCentre>
          <Spacing t={1} b={1}>
            <FooterLink href='https://bass.dev/'>
              made with{' '}
              <span role='img' aria-label='pizazz'>
                ✨
              </span>
              in berlin
            </FooterLink>
            <Spacing l={0.5} r={0.5} inline>
              &bull;
            </Spacing>
            <FooterLink href='/acknowledgements'>acknowledgements</FooterLink>
          </Spacing>
        </Footer>
      </Background>
    </ThemeProvider>
  )
}
