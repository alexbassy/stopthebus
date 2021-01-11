import { promisify } from 'util'
import { RequestHandler } from 'express'
import redis from 'redis'
import {
  GameConfig,
  GameState,
  Player,
  Rooms,
  RoundResults,
  Round,
  QueueJob,
} from '../typings/game'

const ONE_HOUR = 60 * 60
const ONE_DAY = ONE_HOUR * 24

const playerPrefix = 'player'
const gameConfigPrefix = 'gameConfig'
const gameStatePrefix = 'gameState'
const gamePlayersPrefix = 'gamePlayers'
const playerAnswersPrefix = 'answers'
const nextGamePrefix = 'nextGame'
const queuePrefix = 'queue'

const getKey = (key: string, prefix: string) => {
  return key.startsWith(prefix) ? key : `${prefix}:${key}`
}

const removePrefix = (key: string) => key.split(':').slice(1)

const client = redis.createClient(process.env.REDIS_URL as string)

client.on('error', (error) => {
  console.error(error)
})

type KeysFn = { (key: string): Promise<string[] | null> }
type SetFn = { <T>(key: string, val: T, ex: 'EX', time: number): Promise<T> }
type DelFn = { (key: string | string[]): Promise<number> }
type FlushFn = { (): Promise<void> }

export const getAsync = promisify(client.get).bind(client)
export const keysAsync = promisify(client.keys).bind(client) as KeysFn
export const setAsync = promisify(client.set).bind(client) as SetFn
export const delAsync = promisify(client.del).bind(client) as DelFn
export const flushAllAsync = promisify(client.flushall).bind(client) as FlushFn

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

export const playerAnswers = {
  get: async (gameID: string, playerID: string): Promise<RoundResults> => {
    const answersKey = `${gameID}:${playerID}`
    const result = await getAsync(getKey(answersKey, playerAnswersPrefix))
    return JSON.parse(result)
  },
  getByGame: async (gameID: string): Promise<Round> => {
    const round: Round = {}
    const answersForGame = await keysAsync(
      getKey(`${gameID}:*`, playerAnswersPrefix)
    )

    if (!answersForGame || !answersForGame.length) return {}

    for (const key of answersForGame) {
      const answers = await getAsync(key)
      const [gameID, uuid] = removePrefix(key)
      round[uuid] = JSON.parse(answers)
    }

    return round
  },
  set: async (
    gameID: string,
    playerID: string,
    answers: RoundResults
  ): Promise<RoundResults> => {
    const answersKey = `${gameID}:${playerID}`
    await setAsync(
      getKey(answersKey, playerAnswersPrefix),
      JSON.stringify(answers),
      'EX',
      ONE_HOUR
    )
    return answers
  },
  delByGame: async (gameID: string) => {
    const answersForGame = await keysAsync(
      getKey(`${gameID}:*`, playerAnswersPrefix)
    )

    if (!answersForGame || !answersForGame.length) return {}

    for (const key of answersForGame) {
      await delAsync(key)
    }
  },
  del: (gameID: string, playerID: string) =>
    delAsync(getKey(`${gameID}:${playerID}`, playerAnswersPrefix)),
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

// Key for queues:
// {queuePrefix}:{id}:{time}
// All keys can be gotten with `{queuePrefix}:`
// Keys ready for work can be gotten with `{queuePrefix}`
export const queue = {
  get: async (id: string): Promise<QueueJob | null> => {
    const result = await getAsync(getKey(id, queuePrefix))
    return JSON.parse(result)
  },
  getJobs: async (timeNow: number = Date.now()) => {
    const keys = await keysAsync(getKey('*', queuePrefix))

    if (!keys) {
      return []
    }

    const dueJobs = keys
      .map(removePrefix)
      .filter(([id, timeDue]) => Number(timeDue) <= timeNow)

    const jobs: QueueJob[] = await Promise.all(
      dueJobs.map(([id, timeDue]) =>
        getAsync(getKey(`${id}:${timeDue}`, queuePrefix)).then(JSON.parse)
      )
    )

    return jobs
  },
  getJobsForGame: async (gameID: string) => {
    const keys = await keysAsync(getKey('*', queuePrefix))

    if (!keys) {
      return []
    }

    // Filter the queue item names that contain the game ID
    const jobsForGame = keys
      .map(removePrefix)
      .filter(([id]) => id === gameID)
      .map((keys) => keys.join(':'))

    // Get the records for the matching keys
    const jobs: QueueJob[] = await Promise.all(
      jobsForGame.map((key) =>
        getAsync(getKey(key, queuePrefix)).then(JSON.parse)
      )
    )

    return jobs
  },
  add: async (id: string, job: QueueJob): Promise<string> => {
    const { due } = job
    // Return the unprefixed key for easy GETting
    const keyWithoutPrefix = `${id}:${due}`
    const key = getKey(`${id}:${due}`, queuePrefix)
    const newJob: QueueJob = {
      ...job,
      id: key,
      created: Date.now(),
    }
    console.log('Adding', key, newJob)
    await setAsync(key, JSON.stringify(newJob), 'EX', ONE_DAY)
    return keyWithoutPrefix
  },
  setInProgress: async (key: string) => {
    const result = await getAsync(key)
    const job: QueueJob = JSON.parse(result)
    job.inProgress = true
    await setAsync(key, JSON.stringify(job), 'EX', ONE_DAY)
    return job
  },
  remove: async (id: string) => delAsync(id),
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
      const [gameID] = removePrefix(key)
      response.nextGames[gameID] = games[i]
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
      .map(([gameID]) =>
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

interface ClearRoomsRouteResponse {
  status: 'ok' | 'error'
  message?: string
}

export const routeClearRooms: RequestHandler = async (req, res) => {
  const response: ClearRoomsRouteResponse = {
    status: 'ok',
  }

  try {
    await flushAllAsync()
  } catch (e) {
    response.status = 'error'
    response.message = e?.message
    return res.json(response)
  }

  return res.json(response)
}

interface GetQueueRouteResponse {
  count: number
  all: QueueJob[]
  due: QueueJob[]
}

export const routeGetQueue: RequestHandler = async (req, res) => {
  const allJobs = await queue.getJobs(0)
  const dueJobs = await queue.getJobs()

  let response: GetQueueRouteResponse = {
    count: 0,
    all: allJobs,
    due: dueJobs,
  }

  res.json(response)
}

export default client
