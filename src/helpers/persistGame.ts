import { GameConfig } from '../typings/game'

const KEY = 'newGame'

export const persistGameConfig = (
  gameID: string,
  categories: string[]
): void => {
  const gameConfig = JSON.stringify({
    id: gameID,
    categories: Array.from(categories),
    created: Date.now(),
    version: 1,
  })

  window.sessionStorage.setItem(KEY, gameConfig)
}

export const clearGameConfig = (): void => {
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
