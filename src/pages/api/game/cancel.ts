import { q, serverClient } from '@/client/fauna'
import httpStatuses from '@/constants/http-codes'
import { assertMethod, getGameId } from '@/helpers/api/validation'
import log from '@/helpers/log'
import { Game, GameResponse, GameRound, GameStage } from '@/typings/game'
import type { NextApiRequest, NextApiResponse } from 'next'

type ErrorResponse = any

function getGame(id: string): Promise<GameResponse> {
  return serverClient.query<GameResponse>(q.Get(q.Match(q.Index('game_by_id'), id)))
}

function getNewRounds(previousRounds: GameRound[] | null): [GameRound | null, GameRound[] | null] {
  const newPreviousRounds = [...(previousRounds || [])]
  const currentRound = newPreviousRounds.pop() || null
  return [currentRound, newPreviousRounds.length ? newPreviousRounds : null]
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

  const { ref, data: game } = await getGame(id)

  if (!game) {
    return res.status(404).json({ error: true })
  }

  const currentStage = game?.state.stage
  const wasStarted = currentStage === GameStage.ACTIVE

  if (!wasStarted) {
    return res.status(400).json({ message: 'The game has not been started' })
  }

  try {
    const [currentRound, previousRounds] = getNewRounds(game.previousRounds)
    await serverClient.query(
      q.Update(ref, {
        data: {
          state: {
            stage: GameStage.PRE,
          },
          previousRounds,
          currentRound,
        },
      })
    )
  } catch (e) {
    return res.status(httpStatuses.BAD_REQUEST).json({ message: e })
  } finally {
    log.d(`Took ${Date.now() - start}ms to cancel game`)
  }

  return res.status(200).end()
}
