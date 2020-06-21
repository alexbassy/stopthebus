/**
 * GAME CONFIG
 */

export enum GameMode {
  RACE = 'race',
  TIMER = 'timer',
}

export interface GameConfig {
  id: string
  categories: string[]
  rounds: number
  mode: GameMode
  time?: number
  letters: string[]
  created: number
  lastAuthor?: string
}

/**
 * GAME PLAYERS
 */

export interface Player {
  id: string
  uuid: string
}

/**
 * GAME STATE
 */

export enum GameStage {
  // Still on the config screen, game not started yet
  PRE = 'pre',

  // Game is in progress, players are typing answers
  ACTIVE = 'active',

  // Round has finished, players are reviewing/scoring
  REVIEW = 'review',

  // Game has finished, scores are revealed
  END = 'end',
}

export interface GameState {
  stage: GameStage
  rounds: GameRound[]
  currentRound?: GameRound
}

export interface RoundResults {
  [category: string]: string
}

export interface Round {
  [player: string]: RoundResults
}

export interface GameRound {
  timeStarted: number // Time the round started
  timeEnded?: number // The time the round ended, more applicable for races
  endedByPlayer?: string // The player who ended the round
  answers: Round
}

/**
 * TOP LEVEL TYPES
 */

export interface Room {
  state: GameState
  config: GameConfig
  players: Player[]
}

export interface Rooms {
  [x: string]: Room
}
