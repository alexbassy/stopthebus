import { GameResponse, GameRound, GameStage } from '@/typings/game'
import { Handler } from 'worktop'
import { getFaunaError } from '../fauna-error'
import { workerClient, q } from '../client'
import httpStatuses from '@/constants/http-codes'
import { errors } from 'faunadb'

function getGame(id: string): Promise<GameResponse> {
  return workerClient.query<GameResponse>(q.Get(q.Match(q.Index('game_by_id'), id)))
}

function getNewRounds(previousRounds: GameRound[] | null): [GameRound | null, GameRound[] | null] {
  const newPreviousRounds = [...(previousRounds || [])]
  const currentRound = newPreviousRounds.pop() || null
  return [currentRound, newPreviousRounds.length ? newPreviousRounds : null]
}

type RequestBody = { id?: string }

const handleCancel: Handler = async (req, res) => {
  const body = await req.body<RequestBody>()

  const id = body?.id

  if (!id) return res.send(httpStatuses.UNPROCESSABLE_ENTITY, { message: 'Game ID required' })

  const { ref, data: game } = await getGame(id)

  if (!game) return res.send(httpStatuses.NOT_FOUND, { message: 'Game not found' })

  const currentStage = game?.state.stage
  const wasStarted = currentStage === GameStage.ACTIVE

  if (!wasStarted) {
    return res.send(httpStatuses.NOT_ACCEPTABLE, { message: 'The game has not been started' })
  }

  try {
    const [currentRound, previousRounds] = getNewRounds(game.previousRounds)
    const previousStage = !!currentRound ? GameStage.REVIEW : GameStage.PRE
    await workerClient.query(
      q.Update(ref, {
        data: {
          state: { stage: previousStage },
          previousRounds,
          currentRound,
        },
      })
    )
  } catch (e) {
    console.error(e)
    const error = getFaunaError(e as errors.FaunaHTTPError)
    return res.send(error.status, { message: error.description })
  }

  return res.send(httpStatuses.ACCEPTED)
}

export default handleCancel
