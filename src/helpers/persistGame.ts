import { GameConfig, GameMode } from '../typings/game'
import getLetters from './getLetters'

const KEY = 'newGame'

export const persistGameConfig = (gameID: string): void => {
  const gameConfig = JSON.stringify({
    id: gameID,
    categories: [],
    rounds: 3,
    mode: GameMode.RACE,
    letters: getLetters(),
    created: Date.now(),
    scoreWithAlliteration: false,
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
    name: parsed.id,
    categories: parsed.categories,
    letters: parsed.letters,
    rounds: parsed.rounds,
    mode: parsed.mode as GameMode,
    time: parsed.time,
    created: parsed.created,
    lastAuthor: parsed.lastAuthor,
    scoreWithAlliteration: parsed.scoreWithAlliteration,
  }
}
