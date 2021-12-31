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

function getPreviouslyPlayedLetters(previousRounds: GameRound[] | null) {
  if (!previousRounds || !previousRounds.length) {
    return []
  }
  return previousRounds.map((round) => round.letter)
}

function getPreviousRounds(currentRound: GameRound | null, previousRounds: GameRound[] | null) {
  const newPreviousRounds = [...(previousRounds || [])]
  if (currentRound?.timeEnded) {
    newPreviousRounds.push(currentRound)
  }
  return newPreviousRounds
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

  if (error) {
    log.e(error)
    return res.status(400).json(error)
  }

  const currentStage = game?.state.stage
  const canStart = currentStage && [GameStage.PRE, GameStage.REVIEW].includes(currentStage)

  if (!canStart) {
    return res.status(400).json({ message: 'The game is either finished or already in play' })
  }

  try {
    // 3 seconds with a bit of buffer time to account for network delay
    const startTime = Date.now() + 3500

    const newState = { ...game.state, stage: GameStage.ACTIVE }
    const previousRounds = getPreviousRounds(game.currentRound, game.previousRounds)

    const newRound: GameRound = {
      letter: getNextLetterForGame(
        game.config.letters.split(''),
        getPreviouslyPlayedLetters(previousRounds)
      ),
      timeStarted: startTime,
      answers: {},
      scores: {},
    }

    await supabase
      .from<Game>('game')
      .update({ state: newState, previousRounds, currentRound: newRound })
      .match({ id })
  } catch (e) {
    return res.status(httpStatuses.BAD_REQUEST).json({ message: e })
  } finally {
    log.d(`Took ${Date.now() - start}ms to start game`)
  }

  return res.status(200).end()
}
