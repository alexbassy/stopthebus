import getSupabaseClient from '@/client/supabase'
import httpStatuses from '@/constants/http-codes'
import { assertMethod, getGameId, getGamePlayer } from '@/helpers/api/validation'
import log from '@/helpers/log'
import { Game, GameConfig, GameState, Players, Rooms } from '@/typings/supabase'
import { SupabaseClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  game: Rooms
  gameConfig: GameConfig
  gameState: GameState
  players: Players[]
}

type ErrorResponse = any

function getGame(client: SupabaseClient, id: string) {
  return client.from<Game>('game').select().eq('id', id).single()
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | ErrorResponse>
) {
  if (!assertMethod('POST', { req, res })) {
    return
  }

  const [name, nameError] = getGameId({ req, res })
  if (nameError) return

  const [player, playerError] = getGamePlayer({ req, res })
  if (playerError) return

  const start = Date.now()

  const supabase = getSupabaseClient()

  const room = await getGame(supabase, name)

  if (room.error) {
    log.e(room.error)
    return res.status(400).json(room.error)
  }

  const players = (room.data.players || []) as Players[]

  if (!players.find((gamePlayer) => gamePlayer.id === player)) {
    try {
      players.push({ id: player })
      await supabase.from('game').update({ players }).match({ name })
    } catch (e) {
      return res.status(httpStatuses.BAD_REQUEST).json({ message: e })
    } finally {
      log.d(`Took ${Date.now() - start}ms to add player to room`)
    }
  }

  log.d(`Took ${Date.now() - start}ms to check player is in room`)
  return res.json({
    ...room.data,
    config: room.data.config,
    state: room.data.state,
    players,
  })
}
