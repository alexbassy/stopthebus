import React, { ReactChild } from 'react'
import { Helmet } from 'react-helmet'
import { Global } from '@emotion/core'
import { ThemeProvider } from 'emotion-theming'
import { globalStyles } from './visual'

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
      name: 'Faster One',
      href: 'https://fonts.googleapis.com/css2?family=Faster+One&display=swap',
    },
    body: {
      name: '',
      href: '',
    },
  },
  colours: {
    purple: '#A91ADD',
    pink: '#F38099',
    yellow: '#FFE07B',
    blue: '#7ADEC6',
    green: '#35EF9E',
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
      {children}
    </ThemeProvider>
  )
}
