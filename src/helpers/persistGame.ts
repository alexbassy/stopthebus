import { GameConfig } from '../typings/game'
import getLetters from './getLetters'

const KEY = 'newGame'

export const persistGameConfig = (
  gameID: string,
  categories: string[]
): void => {
  const gameConfig = JSON.stringify({
    id: gameID,
    categories: Array.from(categories),
    letters: getLetters(),
    created: Date.now(),
  })

  window.sessionStorage.setItem(KEY, gameConfig)
}

export const clearPersistedGameConfig = (): void => {
  window.sessionStorage.removeItem(KEY)
}

export const readGameConfig = (): GameConfig | undefined => {
  const game = window.sessionStorage.getItem(KEY)

  if (!game) return undefined

  const parsed = JSON.parse(game)

  return {
    id: parsed.id,
    categories: parsed.categories,
    letters: parsed.letters,
    created: parsed.created,
    lastAuthor: parsed.lastAuthor,
  }
}
