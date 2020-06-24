import React, { ReactChild } from 'react'
import Helmet from 'react-helmet'
import { ThemeProvider } from 'emotion-theming'

const pastel = {
  fonts: {
    title: {
      name: 'Faster One',
      url: 'https://fonts.googleapis.com/css2?family=Faster+One&display=swap',
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
        <head>
          <link href={themes[theme].fonts.url} rel='stylesheet' />
        </head>
      </Helmet>
      {children}
    </ThemeProvider>
  )
}
