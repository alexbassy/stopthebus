export interface GameConfig {
  id: string
  categories: string[]
  letters?: string[]
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
