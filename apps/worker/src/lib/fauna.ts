import { Game, GameResponse } from '@/typings/game'
import { q, workerClient } from '../client'

export function createGameQuery(data: Partial<Game>): Promise<GameResponse> {
  return workerClient.query<GameResponse>(q.Create(q.Collection('game'), { data }))
}
