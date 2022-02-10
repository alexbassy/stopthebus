import { q } from '@/client/fauna'
import { query } from 'faunadb'

export type DocumentRef = typeof query.Ref

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
  numRounds: number
  mode: GameMode
  time?: number
  letters: string
  created: number
  lastAuthor?: string
  alliteration: boolean
}

/**
 * GAME PLAYERS
 */

export interface Player {
  id: string
  name: string
  colour: string
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
  FINISHED = 'finished',
}

// Y offsets of questions on ActiveRound page.
// Players run along the "lanes" in the Lanes component.
export interface QuestionPositions {
  [categoryIndex: string]: number // value is X offset
}

export interface FinalScores {
  [player: string]: number
}

export interface GameState {
  stage: GameStage
  finalScores?: FinalScores
  nextGameId?: string
}

export interface RoundResults {
  [category: string]: string
}

export interface Round {
  [player: string]: RoundResults
}

export type OpponentProgress = Record<Player['id'], string>

export interface PlayerScores {
  [category: string]: number
}

export interface Scores {
  [player: string]: PlayerScores
}

export interface GameRound {
  index: number
  letter: string
  timeStarted: number
  timeEnded?: number | null
  endedByPlayer?: string | null
  opponentProgress: OpponentProgress | null
  answers: Round
  scores: Scores
}

/**
 * TOP LEVEL TYPES
 */

export interface GameResponse {
  ref: DocumentRef
  ts: number
  data: Game
}

export interface Game {
  id: string
  state: GameState
  config: GameConfig
  currentRound: GameRound | null
  previousRounds: GameRound[] | null
  players: Player[]
}

export interface Games {
  [x: string]: Game
}

// FAUNADB TYPES
export interface FfbGame {
  ref: typeof q.Ref
  data: Game
}
export interface FdbAnswersCollection {
  data: {
    gameId: string
    playerId: string
    round: number
    answers: RoundResults
  }
}

export interface FdbAllAnswersQuery {
  data: FdbAnswersCollection['data'][]
}
