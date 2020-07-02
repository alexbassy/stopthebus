import { promisify } from 'util'
import { RequestHandler } from 'express'
import redis from 'redis'

import { GameConfig, GameState, Player, Rooms } from '../typings/game'

const ONE_HOUR = 60 * 60

const playerPrefix = 'player'
const gameConfigPrefix = 'gameConfig'
const gameStatePrefix = 'gameState'
const gamePlayersPrefix = 'gamePlayers'
const nextGamePrefix = 'nextGame'

const getKey = (key: string, prefix: string) => {
  return key.startsWith(prefix) ? key : `${prefix}:${key}`
}

const removePrefix = (key: string) => key.split(':')[1]

const client = redis.createClient(process.env.REDIS_URL as string)

client.on('error', (error) => {
  console.error(error)
})

type KeysFn = { (key: string): Promise<string[] | null> }
type SetFn = { <T>(key: string, val: T, ex: 'EX', time: number): Promise<T> }
type DelFn = { (key: string | string[]): Promise<number> }

export const getAsync = promisify(client.get).bind(client)
export const keysAsync = promisify(client.keys).bind(client) as KeysFn
export const setAsync = promisify(client.set).bind(client) as SetFn
export const delAsync = promisify(client.del).bind(client) as DelFn

export const players = {
  get: async (gameID: string): Promise<Player> => {
    const result = await getAsync(getKey(gameID, playerPrefix))
    return JSON.parse(result)
  },
  set: async (gameID: string, newVal: Player): Promise<Player> => {
    await setAsync(
      getKey(gameID, playerPrefix),
      JSON.stringify(newVal),
      'EX',
      ONE_HOUR
    )
    return newVal
  },
  del: (gameID: string) => delAsync(getKey(gameID, playerPrefix)),
}

export const gameConfigs = {
  get: async (gameID: string): Promise<GameConfig> => {
    const result = await getAsync(getKey(gameID, gameConfigPrefix))
    return JSON.parse(result)
  },
  set: async (gameID: string, newVal: GameConfig): Promise<GameConfig> => {
    await setAsync(
      getKey(gameID, gameConfigPrefix),
      JSON.stringify(newVal),
      'EX',
      ONE_HOUR
    )
    return newVal
  },
  del: (id: string) => delAsync(getKey(id, gameConfigPrefix)),
}

export const gameStates = {
  get: async (gameID: string): Promise<GameState> => {
    const result = await getAsync(getKey(gameID, gameStatePrefix))
    return JSON.parse(result)
  },
  set: async (gameID: string, newVal: GameState): Promise<GameState> => {
    await setAsync(
      getKey(gameID, gameStatePrefix),
      JSON.stringify(newVal),
      'EX',
      ONE_HOUR
    )
    return newVal
  },
  del: (id: string) => delAsync(getKey(id, gameStatePrefix)),
}

export const gamePlayers = {
  get: async (gameID: string): Promise<Player[]> => {
    const result = await getAsync(getKey(gameID, gamePlayersPrefix))
    return JSON.parse(result)
  },
  set: async (gameID: string, newVal: Player[]): Promise<Player[]> => {
    await setAsync(
      getKey(gameID, gamePlayersPrefix),
      JSON.stringify(newVal),
      'EX',
      ONE_HOUR
    )
    return newVal
  },
  del: (gameID: string) => delAsync(getKey(gameID, gamePlayersPrefix)),
}

export const nextGame = {
  get: async (gameID: string): Promise<string> => {
    return getAsync(getKey(gameID, nextGamePrefix))
  },
  set: async (gameID: string, nextGameID: string): Promise<string> => {
    await setAsync(getKey(gameID, nextGamePrefix), nextGameID, 'EX', ONE_HOUR)
    return nextGameID
  },
  del: (gameID: string) => delAsync(getKey(gameID, nextGamePrefix)),
}

interface GetRoomsRouteResponse {
  state: 'clean' | 'faulty' | 'empty'
  errors: string[]
  nextGames: { [nextGameID: string]: string }
  count?: number
  rooms?: Rooms
}

export const routeGetRooms: RequestHandler = async (req, res) => {
  const games = await keysAsync(getKey('*', gameConfigPrefix))
  const nextGames = await keysAsync(getKey('*', nextGamePrefix))

  let response: GetRoomsRouteResponse = {
    state: 'clean',
    errors: [],
    nextGames: {},
  }

  if (nextGames && nextGames.length) {
    const games = await Promise.all(
      nextGames.map((gameID) => nextGame.get(gameID))
    )
    nextGames.forEach((key, i) => {
      response.nextGames[removePrefix(key)] = games[i]
    })
  }

  if (!games || !games.length) {
    response.state = 'empty'
    res.json(response)
    return
  }

  // Loop through list of games and retrieve all properties for each one
  // into an array of `[id, config, state, players]`
  const gameTuples = await Promise.all(
    games
      .map(removePrefix)
      .map((gameID) =>
        Promise.all([
          Promise.resolve(gameID),
          gameConfigs.get(gameID),
          gameStates.get(gameID),
          gamePlayers.get(gameID),
        ])
      )
  )

  // Transform tuples into an object of {[gameID]: Game}
  const rooms = gameTuples.reduce<Rooms>(
    (rooms, [gameID, config, state, players]) => {
      if (!config) {
        response.state = 'faulty'
        response.errors.push(`Missing config for room ${gameID}`)
        return rooms
      }

      rooms[gameID] = { config, state, players }
      return rooms
    },
    {}
  )

  response.count = Object.keys(rooms).length
  response.rooms = rooms

  return res.json(response)
}

export default client
