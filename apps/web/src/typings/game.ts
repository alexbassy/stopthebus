import type { Answers, Game } from '@stopthebus/shared'

// FAUNADB TYPES, used only by the old worker routes until they are ported (ticket 05)

export type DocumentRef = any

export interface GameResponse {
  ref: DocumentRef
  ts: number
  data: Game
}

export interface FfbGame {
  ref: DocumentRef
  data: Game
}

export interface FdbAnswersCollection {
  data: {
    gameId: string
    playerId: string
    round: number
    answers: Answers
  }
}

export interface FdbAllAnswersQuery {
  data: FdbAnswersCollection['data'][]
}
