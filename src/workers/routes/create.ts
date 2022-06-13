import { GameConfig, Player } from '@/typings/game'
import { Handler } from 'worktop'
import { getFaunaError } from '../fauna-error'
import httpStatuses from '@/constants/http-codes'
import { errors } from 'faunadb'
import { createGameConfig, createGameState } from '../lib/game'
import { createGameQuery } from '../lib/fauna'
import { analytics } from '../lib/analytics'

type RequestBody = { id?: string; player?: Player }

const handleCreate: Handler = async (req, res) => {
  const body = await req.body<RequestBody>()

  const id = body?.id
  const player = body?.player

  if (!id) return res.send(httpStatuses.UNPROCESSABLE_ENTITY, { message: 'Game ID required' })
  if (!player) return res.send(httpStatuses.UNPROCESSABLE_ENTITY, { message: 'Player required' })

  try {
    const response = await createGameQuery({
      id,
      state: createGameState(),
      config: createGameConfig() as GameConfig,
      players: [player],
    })

    if (!response.ref) {
      return res.send(httpStatuses.BAD_REQUEST, { message: JSON.stringify(response) })
    }

    analytics.track({
      userId: player.id,
      event: 'create game',
      data: { country: req.headers.get('cf-ipcountry') || undefined },
    })

    console.log('tracked', {
      SB_TOKEN,
      event: 'create game',
      playerId: player.id,
      country: req.headers.get('cf-ipcountry') || undefined,
    })

    return res.send(httpStatuses.CREATED, response.data)
  } catch (e) {
    console.error(e)
    const error = getFaunaError(e as errors.FaunaHTTPError)
    return res.send(error.status, { message: error.description })
  }
}

export default handleCreate
