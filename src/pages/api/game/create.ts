// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { assertMethod, getGameId, getGamePlayer } from '@/helpers/api/validation'
import { Game, GameMode, GameResponse, GameStage } from '@/typings/game'
import { GameConfig, GameState } from '@/typings/game'
import type { NextApiRequest, NextApiResponse } from 'next'
import { serverClient, q } from '@/client/fauna'

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

  const [player, playerError] = getGamePlayer({ req, res })
  if (playerError) return

  const gameConfig = createGameConfig()
  const gameState = createGameState()

  const response = await serverClient.query<GameResponse>(
    q.Create(q.Collection('game'), {
      data: {
        id: name,
        state: gameState,
        config: gameConfig,
        players: [player],
      },
    })
  )

  if (!response.ref) {
    return res.status(400).json({ message: JSON.stringify(response) })
  }

  return res.status(201).end()
}
