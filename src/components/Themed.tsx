import React, { ReactChild } from 'react'
import { Helmet } from 'react-helmet'
import { ThemeProvider } from 'emotion-theming'
import { Global } from '@emotion/core'
import {
  globalStyles,
  Background,
  GameWrapper,
  Spacing,
  ExternalLink,
} from './visual'
import styled from './styled'
import { Flex } from './Grid'
import themes, { Themes } from '../themes'

interface ThemedProps {
  theme?: Themes
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

export default function Themed({
  theme = Themes.PASTEL,
  children,
}: ThemedProps) {
  return (
    <ThemeProvider theme={themes[theme]}>
      <Helmet>
        <link href={themes[theme].fonts.title.href} rel='stylesheet' />
      </Helmet>
      <Global styles={globalStyles} />
      <Background>
        <GameWrapper>
          {children}
          <Spacing t={2} />
        </GameWrapper>
        <Footer yCentre xCentre>
          <Spacing y={1}>
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
