// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import getSupabaseClient from '@/client/supabase'
import { GameConfig, GameState, Players, Rooms } from '@/typings/supabase'
import * as random from '@/helpers/random'
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  game: Rooms
  gameConfig: GameConfig
  gameState: GameState
  players: Players[]
}

type ErrorResponse = any

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | ErrorResponse>
) {
  const name = req.body.name || req.query.name

  const supabase = getSupabaseClient()

  const { data: player, error: playerError } = await supabase.from<Players>('players').insert([
    {
      name: name || random.getPlayerName(),
    },
  ])

  console.log(player)

  if (playerError) {
    console.error(playerError)
    return res.status(400).json({ message: JSON.stringify(playerError.message) })
  }

  return res.status(201).send(JSON.stringify({ player }, null, 2))
}
