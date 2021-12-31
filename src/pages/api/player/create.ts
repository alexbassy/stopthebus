// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import getSupabaseClient from '@/client/supabase'
import { Player } from '@/typings/game'
import * as random from '@/helpers/random'
import type { NextApiRequest, NextApiResponse } from 'next'

type ErrorResponse = any

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Player | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const name = req.body.name

  const supabase = getSupabaseClient()

  const { data: player, error: playerError } = await supabase.from<Player>('players').insert([
    {
      name: name || random.getPlayerName(),
    },
  ])

  if (playerError) {
    console.error('Error', playerError)
    return res.status(400).json({ message: JSON.stringify(playerError.message) })
  }

  return res.status(201).json(player)
}
