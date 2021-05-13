import { Theme } from './type'

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
    ...palette,
    gameBorder: palette.pink,
    interactiveButton: 'rgb(80 80 80)',
    gameBackground: '#1d3557',
    pageBackground: '#132339',
    inputBackground: '#2e5286',
    buttonBackground: '#2866bd',
  },
}

export default pastel
