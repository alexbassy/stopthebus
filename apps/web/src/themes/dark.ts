import { Theme } from '@emotion/react'

const palette = {
  orange: '#FF9770',
  pink: '#FF70A6',
  yellow: '#FFD670',
  lemon: '#E9FF70',
  blue: '#1d3557',
  purple: '#b523da',
  green: '#35EF9E',
  text: '#fff',
}

const dark: Theme = {
  fonts: {
    title: {
      name: 'Raleway, sans-serif',
      href: 'https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=Raleway:wght@700&display=swap',
    },
    body: {
      name: '"Sora"',
      href: '',
    },
  },
  props: {
    gameBorderColour: '',
  },
  colours: {
    ...palette,

    gameBorder: 'transparent',
    interactiveButton: 'green',
    gameBackground: '#000',
    pageBackground: 'hsl(0, 0%, 0%)',
    inputBackground: 'hsl(0, 0%, 15%)',
    buttonBackground: 'hsl(225, 56%, 20%)',
  },
}

export default dark
