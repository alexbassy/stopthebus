import getSupabaseClient from '@/client/supabase'
import httpStatuses from '@/constants/http-codes'
import { assertMethod, getGameId, getGamePlayer, getIsJoining } from '@/helpers/api/validation'
import { getNextLetterForGame } from '@/helpers/letters'
import log from '@/helpers/log'
import { Game, GameRound, GameStage, Player } from '@/typings/game'
import { SupabaseClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

type ErrorResponse = any

function getGame(client: SupabaseClient, id: string) {
  return client.from<Game>('game').select().eq('id', id).single()
}

function getNewRounds(previousRounds: GameRound[] | null): [GameRound | null, GameRound[]] {
  const newPreviousRounds = [...(previousRounds || [])]
  const currentRound = newPreviousRounds.pop() || null
  return [currentRound, newPreviousRounds]
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Game | ErrorResponse>
) {
  if (!assertMethod('POST', { req, res })) {
    return
  }

  const [id, idError] = getGameId({ req, res })
  if (idError) return

  const start = Date.now()

  const supabase = getSupabaseClient()

  const { error, data: game } = await getGame(supabase, id)

  if (error || !game) {
    log.e(error)
    return res.status(400).json(error)
  }

  const currentStage = game?.state.stage
  const wasStarted = currentStage === GameStage.ACTIVE

  if (!wasStarted) {
    return res.status(400).json({ message: 'The game has not been started' })
  }

  try {
    const newState = { ...game.state, stage: GameStage.PRE }
    const [currentRound, previousRounds] = getNewRounds(game.previousRounds)
    await supabase
      .from<Game>('game')
      .update({ state: newState, previousRounds, currentRound })
      .match({ id })
  } catch (e) {
    return res.status(httpStatuses.BAD_REQUEST).json({ message: e })
  } finally {
    log.d(`Took ${Date.now() - start}ms to cancel game`)
  }

  return res.status(200).end()
}
