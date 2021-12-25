import { definitions } from '@/typings/supabase-generated'
import * as appTypes from './game'

export type GameConfig = definitions['gameConfig']
export type GameState = definitions['gameStates']
export type GameRound = definitions['gameRound']
export type Players = definitions['players']
export type Rooms = definitions['rooms']
export type Game = definitions['game']

export type IGame = {
  id: string
  config: appTypes.GameConfig
  state: appTypes.GameState
  players: Players
}
