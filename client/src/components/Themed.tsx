import React, { ChangeEvent, ReactChild, useState } from 'react'
import { Helmet } from 'react-helmet'
import { ThemeProvider } from 'emotion-theming'
import { Global } from '@emotion/core'
import {
  globalStyles,
  Background,
  GameWrapper,
  Spacing,
  ExternalLink,
  HiddenLabel,
} from './visual'
import styled from './styled'
import { Flex } from './Grid'
import themes, { Themes } from '../themes'

interface ThemedProps {
  children: ReactChild
}

const Footer = styled<'footer'>('footer')`
  color: #fff;
  text-align: center;
  font-weight: 600;
`.withComponent(Flex)

const ChangeThemeWrapper = styled.div`
  margin-top: auto;
  text-align: center;
`

const ThemeButton = styled.select`
  appearance: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-family: inherit;
  background: rgb(0 0 0 / 30%);
  color: #fff;
  border: 1px solid rgb(0 0 0 / 30%);
`

const FooterLink = styled(ExternalLink)`
  text-decoration: none;
  color: rgb(255 255 255 / 90%);
`

function getPersistedTheme(): Themes {
  const persistedTheme = localStorage.getItem('theme')
  return persistedTheme ? (persistedTheme as Themes) : Themes.PASTEL
}

function persistTheme(theme: Themes) {
  localStorage.setItem('theme', theme)
}

export default function Themed({ children }: ThemedProps) {
  const [activeTheme, setActiveTheme] = useState<Themes>(getPersistedTheme())
  const changeTheme = (ev: ChangeEvent<HTMLSelectElement>) => {
    const newTheme: Themes = ev.target.value as Themes
    if (newTheme !== activeTheme) {
      setActiveTheme(newTheme)
      persistTheme(newTheme)
    }
  }

  return (
    <ThemeProvider theme={themes[activeTheme]}>
      <Helmet>
        <link href={themes[activeTheme].fonts.title.href} rel='stylesheet' />
      </Helmet>
      <Global styles={globalStyles} />
      <Background>
        <GameWrapper>
          {children}
          <Spacing t={2} />
          <ChangeThemeWrapper>
            <HiddenLabel htmlFor='change-theme'>Change theme</HiddenLabel>
            <ThemeButton
              id='change-theme'
              value={activeTheme}
              onChange={changeTheme}
            >
              <option value={Themes.PASTEL}>Theme: Original</option>
              <option value={Themes.DARK}>Theme: Dark</option>
            </ThemeButton>
          </ChangeThemeWrapper>
        </GameWrapper>
        <Footer yCentre xCentre>
          <Spacing y={1}>
            @{process.env.SHORT_SHA || 'local'}
            <Spacing l={0.5} r={0.5} inline>
              &bull;
            </Spacing>
            <FooterLink href='https://bass.dev/'>
              made with{' '}
              <span role='img' aria-label='pizazz'>
                💛
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
