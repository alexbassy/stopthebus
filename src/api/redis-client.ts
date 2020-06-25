import redis from 'redis'
import { promisify } from 'util'
import { Player, GameConfig, GameState, Rooms } from '../typings/game'
import { RequestHandler } from 'express'

const ONE_HOUR = 60 * 60

const playerPrefix = 'player'
const gameConfigPrefix = 'gameConfig'
const gameStatePrefix = 'gameState'
const gamePlayersPrefix = 'gamePlayers'

const getKey = (key: string, prefix: string) => {
  return key.startsWith(prefix) ? key : `${prefix}:${key}`
}

const removePrefix = (key: string) => key.split(':')[1]

const client = redis.createClient(process.env.REDIS_URL as string)

client.on('error', (error) => {
  console.error(error)
})

type SetFn = { <T>(key: string, val: T, ex: 'EX', time: number): Promise<T> }
type DelFn = { (key: string | string[]): Promise<number> }

export const getAsync = promisify(client.get).bind(client)
export const setAsync = promisify(client.set).bind(client) as SetFn
export const delAsync = promisify(client.del).bind(client) as DelFn

export const players = {
  get: async (id: string): Promise<Player> => {
    const result = await getAsync(getKey(id, playerPrefix))
    return JSON.parse(result)
  },
  set: async (id: string, newVal: Player): Promise<Player> => {
    await setAsync(
      getKey(id, playerPrefix),
      JSON.stringify(newVal),
      'EX',
      ONE_HOUR
    )
    return newVal
  },
  del: (id: string) => delAsync(getKey(id, playerPrefix)),
}

export const gameConfigs = {
  get: async (id: string): Promise<GameConfig> => {
    const result = await getAsync(getKey(id, gameConfigPrefix))
    return JSON.parse(result)
  },
  set: async (id: string, newVal: GameConfig): Promise<GameConfig> => {
    await setAsync(
      getKey(id, gameConfigPrefix),
      JSON.stringify(newVal),
      'EX',
      ONE_HOUR
    )
    return newVal
  },
  del: (id: string) => delAsync(getKey(id, gameConfigPrefix)),
}

export const gameStates = {
  get: async (id: string): Promise<GameState> => {
    const result = await getAsync(getKey(id, gameStatePrefix))
    return JSON.parse(result)
  },
  set: async (id: string, newVal: GameState): Promise<GameState> => {
    await setAsync(
      getKey(id, gameStatePrefix),
      JSON.stringify(newVal),
      'EX',
      ONE_HOUR
    )
    return newVal
  },
  del: (id: string) => delAsync(getKey(id, gameStatePrefix)),
}

export const gamePlayers = {
  get: async (id: string): Promise<Player[]> => {
    const result = await getAsync(getKey(id, gamePlayersPrefix))
    return JSON.parse(result)
  },
  set: async (id: string, newVal: Player[]): Promise<Player[]> => {
    await setAsync(
      getKey(id, gamePlayersPrefix),
      JSON.stringify(newVal),
      'EX',
      ONE_HOUR
    )
    return newVal
  },
  del: (id: string) => delAsync(getKey(id, gamePlayersPrefix)),
}

interface GetRoomsRouteResponse {
  state: 'clean' | 'faulty' | 'empty'
  errors: string[]
  count?: number
  rooms?: Rooms
}

export const routeGetRooms: RequestHandler = async (req, res) => {
  client.keys('gameConfig:*', async (err, games) => {
    if (err) return console.log(err)

    let response: GetRoomsRouteResponse = {
      state: 'clean',
      errors: [],
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
  })
}

export default client
