import getSupabaseClient from '@/client/supabase'
import httpStatuses from '@/constants/http-codes'
import { assertMethod, getGameName, getGamePlayer } from '@/helpers/api/validation'
import log from '@/helpers/log'
import { GameConfig, GameState, Players, Rooms } from '@/typings/supabase'
import { SupabaseClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  game: Rooms
  gameConfig: GameConfig
  gameState: GameState
  players: Players[]
}

type ErrorResponse = any

function getRoom(client: SupabaseClient, name: string) {
  return client.from<Rooms>('room').select().eq('name', name).single()
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | ErrorResponse>
) {
  if (!assertMethod('POST', { req, res })) {
    return
  }

  const [name, nameError] = getGameName({ req, res })
  if (nameError) return

  const [player, playerError] = getGamePlayer({ req, res })
  if (playerError) return

  const start = Date.now()

  const supabase = getSupabaseClient()

  const [room] = await Promise.all([getRoom(supabase, name)])

  if (room.error) {
    log.e(room.error)
    return res.status(400).json({ message: JSON.stringify(room.error) })
  }

  const players = (room.data.players || []) as string[]

  if (!players.includes(player)) {
    try {
      const newPlayers = [...new Set<string>(players)]
      await supabase.from<Rooms>('rooms').update({ players: newPlayers }).match({ name })
      return res.status(httpStatuses.ACCEPTED).end()
    } catch (e) {
      return res.status(httpStatuses.BAD_REQUEST).json({ message: e })
    } finally {
      log.d(`Took ${Date.now() - start}ms to add player to room`)
    }
  }

  log.d(`Took ${Date.now() - start}ms to check player is in room`)
  return res.status(httpStatuses.OK).end()
}
