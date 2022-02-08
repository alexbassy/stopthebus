import httpStatuses from '@/constants/http-codes'
import { assertMethod, getGameId, getGamePlayer, getIsJoining } from '@/helpers/api/validation'
import { Game, GameResponse, GameStage, Player } from '@/typings/game'
import type { NextApiRequest, NextApiResponse } from 'next'
import { serverClient, q } from '@/client/fauna'

type ErrorResponse = any

function getGame(id: string): Promise<GameResponse> {
  return serverClient.query<GameResponse>(q.Get(q.Match(q.Index('game_by_id'), id)))
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

  let game: GameResponse | null
  try {
    game = await getGame(name)
    if (!game) {
      throw new Error()
    }
  } catch (e) {
    return res.status(httpStatuses.NOT_FOUND).end()
  }

  const { ref, data } = game

  let players = (data.players || []) as Player[]

  const isInGame = players.find((gamePlayer) => gamePlayer.id === player.id)

  if (!isInGame && data.state.stage !== GameStage.PRE) {
    return res.status(httpStatuses.FORBIDDEN).end()
  }

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
      await serverClient.query(q.Update(ref, { data: { players } }))
    } catch (e) {
      return res.status(httpStatuses.BAD_REQUEST).json({ message: e })
    } finally {
      console.info(`Took ${Date.now() - start}ms to ${isJoining ? 'add' : 'remove'} player`)
    }
  }

  return res.status(httpStatuses.ACCEPTED).end()
}
