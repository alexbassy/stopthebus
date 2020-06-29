import React, { ReactChild } from 'react'
import { Helmet } from 'react-helmet'
import { Global } from '@emotion/core'
import { ThemeProvider } from 'emotion-theming'
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
    <path fill="#D40606" d="M0 0h50v4.02H0z"/>
    <path fill="#F09D03" d="M0 4.02h50v5.07H0z"/>
    <path fill="#E5FE04" d="M0 9.09h50v5.07H0z"/>
    <path fill="#0ABF02" d="M0 14.16h50v5.07H0z"/>
    <path fill="#081A9A" d="M0 19.23h50v5.07H0z"/>
    <path fill="#76008A" d="M0 24.3h50v3.85H0z"/>
    <g>
      <path fill="#010101" d="M7.03-4.37l18.54 18.54L7.03 32.71l-18.54-18.54z"/>
      <path fill="#613915" d="M1.17-4.39l18.55 18.54L1.18 32.7l-18.55-18.54z"/>
    </g>
    <path fill="#74D7EE" d="M-4.5-4.39l18.55 18.54L-4.5 32.7l-18.54-18.54z"/>
    <path fill="#FFAFC8" d="M-9.34-4.38L9.2 14.16-9.34 32.7l-18.54-18.54z"/>
    <path fill="#FAF9F5" d="M-14.01-4.39L4.53 14.15-14.01 32.7l-18.54-18.54z"/>
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
          <FooterLink href='https://bass.dev/'>
            <Spacing t={0.5} b={0.5}>
              made with{' '}
              <span role='img' aria-label='pizazz'>
                ✨
              </span>
              in berlin
            </Spacing>
          </FooterLink>
        </Footer>
      </Background>
    </ThemeProvider>
  )
}
