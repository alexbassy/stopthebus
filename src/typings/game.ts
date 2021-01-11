/**
 * Queued jobs
 */

import { QueueEvent } from './socket-events'

export interface QueueJob {
  id?: string
  name: QueueEvent
  data: any
  created?: number
  due: number
  inProgress: boolean
}

/**
 * GAME CONFIG
 */

export enum GameMode {
  RACE = 'race',
  TIMER = 'timer',
}

export interface GameConfig {
  id: string
  name: string
  categories: string[]
  rounds: number
  mode: GameMode
  time?: number
  letters: string
  created: number
  lastAuthor?: string
  scoreWithAlliteration: boolean
}

/**
 * GAME PLAYERS
 */

export interface Player {
  id?: string
  uuid: string
  name?: string
  colour?: string
}

/**
 * GAME STATE
 */

export enum GameStage {
  // Still on the config screen, game not started yet
  PRE = 'pre',

  // Someone has just clicked the “start game” button
  STARTING = 'starting',

  // Game is in progress, players are typing answers
  ACTIVE = 'active',

  // Game is in progress but one player has finished the round
  ENDING = 'ending',

  // Round has finished, players are reviewing/scoring
  REVIEW = 'review',

  // Game has finished, scores are revealed
  FINISHED = 'finished',
}

// Y offsets of questions on ActiveRound page.
// Players run along the "lanes" in the Lanes component.
export interface QuestionPositions {
  [categoryIndex: string]: number // value is X offset
}

// Map of UUID:questionIndex, to show where each player is.
export interface OpponentProgress {
  [player: string]: number
}

export interface FinalScores {
  [player: string]: number
}

export interface GameState {
  stage: GameStage
  rounds: GameRound[]
  currentRound?: GameRound
  finalScores?: FinalScores
  nextGameID?: string
  nextLetter?: string
}

export interface RoundResults {
  [category: string]: string
}

export interface Round {
  [player: string]: RoundResults
}

export interface PlayerScores {
  [category: string]: number
}

export interface Scores {
  [player: string]: PlayerScores
}

export interface GameRound {
  letter?: string
  timeStarted: number // Time the round started
  timeEnded?: number // The time the round ended, more applicable for races
  endedByPlayer?: string // The player who ended the round
  answers: Round
  scores: Scores
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
