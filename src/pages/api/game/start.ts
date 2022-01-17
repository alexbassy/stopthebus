import { q, serverClient } from '@/client/fauna'
import httpStatuses from '@/constants/http-codes'
import { assertMethod, getGameId } from '@/helpers/api/validation'
import { getNextLetterForGame } from '@/helpers/letters'
import log from '@/helpers/log'
import { Game, GameResponse, GameRound, GameStage } from '@/typings/game'
import type { NextApiRequest, NextApiResponse } from 'next'

type ErrorResponse = any

function getGame(id: string): Promise<GameResponse> {
  return serverClient.query<GameResponse>(q.Get(q.Match(q.Index('game_by_id'), id)))
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

  const { ref, data: game } = await getGame(id)

  if (!game) {
    return res.status(404).json(!game)
  }

  const currentStage = game?.state.stage
  const canStart = currentStage && [GameStage.PRE, GameStage.REVIEW].includes(currentStage)

  if (!canStart) {
    return res.status(400).json({ message: 'The game is either finished or already in play' })
  }

  try {
    // 3 seconds with a bit of buffer time to account for network delay
    const startTime = Date.now() + 3500

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

    await serverClient.query<GameResponse>(
      q.Update(ref, {
        data: {
          state: {
            stage: GameStage.ACTIVE,
          },
          previousRounds,
          currentRound: newRound,
        },
      })
    )
  } catch (e) {
    return res.status(httpStatuses.BAD_REQUEST).json({ message: e })
  } finally {
    log.d(`Took ${Date.now() - start}ms to start game`)
  }

  return res.status(200).end()
}
