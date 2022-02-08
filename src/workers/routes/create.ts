import { GameMode, GameResponse, GameStage, Player } from '@/typings/game'
import { GameConfig, GameState } from '@/typings/game'
import { Handler } from 'worktop'
import { getFaunaError } from '../fauna-error'
import { workerClient, q } from '../client'
import httpStatuses from '@/constants/http-codes'
import { errors } from 'faunadb'

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

type RequestBody = { id?: string; player?: Player }

const handleCreate: Handler = async (req, res) => {
  const body = await req.body<RequestBody>()

  const id = body?.id
  const player = body?.player

  if (!id) return res.send(httpStatuses.UNPROCESSABLE_ENTITY, { message: 'Game ID required' })
  if (!player) return res.send(httpStatuses.UNPROCESSABLE_ENTITY, { message: 'Player required' })

  const gameConfig = createGameConfig()
  const gameState = createGameState()

  try {
    const response = await workerClient.query<GameResponse>(
      q.Create(q.Collection('game'), {
        data: {
          id,
          state: gameState,
          config: gameConfig,
          players: [player],
        },
      })
    )

    if (!response.ref) {
      return res.send(httpStatuses.BAD_REQUEST, { message: JSON.stringify(response) })
    }

    return res.send(httpStatuses.CREATED, response.data)
  } catch (e) {
    console.error(e)
    const error = getFaunaError(e as errors.FaunaHTTPError)
    return res.send(error.status, { message: error.description })
  }
}

export default handleCreate
