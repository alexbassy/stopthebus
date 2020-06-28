import React, { ReactChild } from 'react'
import { Helmet } from 'react-helmet'
import { Global } from '@emotion/core'
import { ThemeProvider } from 'emotion-theming'
import { globalStyles, Background, Wrapper } from './visual'

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
      name: 'Raleway',
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

export default function Themed({ theme = 'pastel', children }: ThemedProps) {
  return (
    <ThemeProvider theme={themes[theme]}>
      <Helmet>
        <link href={themes[theme].fonts.title.href} rel='stylesheet' />
      </Helmet>
      <Global styles={globalStyles} />
      <Background>
        <Wrapper>{children}</Wrapper>
      </Background>
    </ThemeProvider>
  )
}
