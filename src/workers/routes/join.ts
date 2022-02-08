import { Handler } from 'worktop'
import { GameResponse, GameStage, Player } from '@/typings/game'
import httpStatuses from '@/constants/http-codes'
import { getFaunaError } from '../fauna-error'
import { workerClient, q } from '../client'
import { errors } from 'faunadb'

function getGame(id: string): Promise<GameResponse> {
  return workerClient.query<GameResponse>(q.Get(q.Match(q.Index('game_by_id'), id)))
}

type RequestBody = { id?: string; player?: Player; isJoining?: boolean }

const handleJoinOrLeave: Handler = async (req, res) => {
  const body = await req.body<RequestBody>()

  const id = body?.id
  const player = body?.player
  const isJoining = body?.isJoining

  if (!id) return res.send(httpStatuses.UNPROCESSABLE_ENTITY, { message: 'Game ID required' })
  if (!player) return res.send(httpStatuses.UNPROCESSABLE_ENTITY, { message: 'Player required' })
  if (typeof isJoining === 'undefined')
    return res.send(httpStatuses.UNPROCESSABLE_ENTITY, {
      message: 'Must specify if joining or not',
    })

  let game: GameResponse | null
  try {
    game = await getGame(id)
    if (!game) {
      throw new Error()
    }
  } catch (e) {
    return res.send(httpStatuses.NOT_FOUND)
  }

  const { ref, data } = game

  let players = (data.players || []) as Player[]

  const isInGame = players.find((gamePlayer) => gamePlayer.id === player.id)

  if (!isInGame && data.state.stage !== GameStage.PRE) {
    return res.send(httpStatuses.FORBIDDEN)
  }

  const isValidAction = (!isInGame && isJoining) || (isInGame && !isJoining)

  // Probably client-side issue, just accept and move on
  if (!isValidAction) {
    return res.send(httpStatuses.ACCEPTED)
  }

  const newPlayer: Player = {
    id: player.id,
    colour: player.colour,
    name: player.name,
  }

  players = isJoining
    ? [...players, newPlayer]
    : players.filter((gamePlayer) => gamePlayer.id !== player.id)

  try {
    await workerClient.query(q.Update(ref, { data: { players } }))
  } catch (e) {
    const error = getFaunaError(e as errors.FaunaHTTPError)
    return res.send(error.status, { message: error.description })
  }

  return res.send(httpStatuses.ACCEPTED)
}

export default handleJoinOrLeave
