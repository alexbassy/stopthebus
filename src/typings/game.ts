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

export interface Player {
  id: string
  uuid: string
}

export interface Room {
  config: GameConfig
  players: Player[]
}

export interface Rooms {
  [x: string]: Room
}
