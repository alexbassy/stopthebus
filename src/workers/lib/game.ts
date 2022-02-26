import { GameConfig, GameMode, GameStage, GameState } from '@/typings/game'

export function createGameConfig(): GameConfig {
  return {
    categories: [],
    numRounds: 3,
    mode: GameMode.RACE,
    alliteration: false,
    letters: 'abcdefghijklmnoprstuvwyz',
  }
}

export function createGameConfigFromPrevious(
  previousConfig: Partial<GameConfig>,
  lettersPlayed: string[]
): GameConfig {
  const freshGame = createGameConfig()
  if (previousConfig.categories) freshGame.categories = previousConfig.categories
  if (previousConfig.numRounds) freshGame.numRounds = previousConfig.numRounds
  if (previousConfig.mode) freshGame.mode = previousConfig.mode
  if (previousConfig.alliteration) freshGame.alliteration = previousConfig.alliteration
  if (previousConfig.letters) {
    freshGame.letters = previousConfig.letters
      .split('')
      .filter((letter) => !lettersPlayed.includes(letter))
      .join('')
  }
  return freshGame
}

export function createGameState(): GameState {
  return {
    stage: GameStage.PRE,
  }
}
