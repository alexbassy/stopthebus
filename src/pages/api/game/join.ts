import getSupabaseClient from '@/client/supabase'
import httpStatuses from '@/constants/http-codes'
import { assertMethod, getGameId, getGamePlayer, getIsJoining } from '@/helpers/api/validation'
import log from '@/helpers/log'
import { Game, Player } from '@/typings/game'
import { SupabaseClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

type ErrorResponse = any

function getGame(client: SupabaseClient, id: string) {
  return client.from<Game>('game').select().eq('id', id).single()
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Game | ErrorResponse>
) {
  if (!assertMethod('POST', { req, res })) {
    return
  }

  const [name, nameError] = getGameId({ req, res })
  if (nameError) return

  const [player, playerError] = getGamePlayer({ req, res })
  if (playerError) return

  const [isJoining, isJoiningError] = getIsJoining({ req, res })
  if (isJoiningError) return

  const start = Date.now()

  const supabase = getSupabaseClient()

  const game = await getGame(supabase, name)

  if (game.error) {
    log.e(game.error)
    return res.status(httpStatuses.NOT_FOUND).end()
  }

  let players = (game.data.players || []) as Player[]

  const isInGame = players.find((gamePlayer) => gamePlayer.id === player.id)

  const isValidAction = (!isInGame && isJoining) || (isInGame && !isJoining)
  if (isValidAction) {
    const newPlayer: Player = {
      id: player.id,
      colour: player.colour,
      name: player.name,
    }

    players = isJoining
      ? [...players, newPlayer]
      : players.filter((gamePlayer) => gamePlayer.id !== player.id)

    try {
      console.log(isJoining ? 'adding' : 'removing', player, 'in game')
      await supabase.from('game').update({ players }).match({ id: name })
    } catch (e) {
      return res.status(httpStatuses.BAD_REQUEST).json({ message: e })
    } finally {
      log.d(`Took ${Date.now() - start}ms to ${isJoining ? 'add' : 'remove'} player`)
    }
  }

  return res.status(httpStatuses.ACCEPTED).end()
}
