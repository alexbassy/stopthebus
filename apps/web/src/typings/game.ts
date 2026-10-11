import { q } from '@/client/fauna'
import { query } from 'faunadb'
import type { Answers, Game } from '@stopthebus/shared'

// FAUNADB TYPES, removed with Fauna in ticket 05

export type DocumentRef = typeof query.Ref

export interface GameResponse {
  ref: DocumentRef
  ts: number
  data: Game
}

export interface FfbGame {
  ref: typeof q.Ref
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
