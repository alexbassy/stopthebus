// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import getSupabaseClient from '@/client/supabase'
import { assertMethod, getGameId, getGameOwner } from '@/helpers/api/validation'
import log from '@/helpers/log'
import { GameMode, GameStage } from '@/typings/game'
import { Game, GameConfig, GameState, Player } from '@/typings/game'
import { SupabaseClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

type ErrorResponse = any

function createGameConfig(): Partial<GameConfig> {
  return {
    categories: [],
    numRounds: 3,
    mode: GameMode.RACE,
    alliteration: false,
    letters: 'abcdefghijklmnoprstuvwyz',
  }
}

function createGameState(): Partial<GameState> {
  return {
    stage: GameStage.PRE,
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<void | ErrorResponse>
) {
  if (!assertMethod('POST', { req, res })) {
    return
  }

  const [name, nameError] = getGameId({ req, res })
  if (nameError) return

  const [owner, ownerError] = getGameOwner({ req, res })
  if (ownerError) return

  const supabase = getSupabaseClient()

  const gameConfig = createGameConfig()
  const gameState = createGameState()

  const players = [{ id: owner }]

  const { data: game, error: gameError } = await supabase.from('game').insert([
    {
      id: name,
      state: gameState,
      config: gameConfig,
      players: players,
    },
  ])

  if (gameError) {
    return res.status(400).json({ message: JSON.stringify(gameError) })
  }

  return res.status(201).end()
}
