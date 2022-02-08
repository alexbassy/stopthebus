import '@emotion/react'

declare module '@emotion/react' {
  export interface ThemeFont {
    name: string
    href: string
  }
  export interface Theme {
    fonts: {
      title: ThemeFont
      body: ThemeFont
    }
    props?: { [prop: string]: any }
    colours: {
      orange?: string
      pink?: string
      yellow?: string
      lemon?: string
      blue?: string
      purple?: string
      green?: string
      text?: string
      gameBorder?: string
      interactiveButton?: string
      gameBackground?: string
      pageBackground?: string
      inputBackground?: string
      buttonBackground?: string
    }
  }
}
