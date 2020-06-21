import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  SyntheticEvent,
} from 'react'
import { useParams, Link } from 'react-router-dom'
import io from 'socket.io-client'
import {
  readGameConfig,
  persistGameConfig,
  clearPersistedGameConfig,
} from '../helpers/persistGame'
import { getUserSessionID } from '../helpers/getUserSession'
import { ENGLISH_LETTERS } from '../constants/letters'
import { ClientEvent, ServerEvent, Payload } from '../typings/socket-events'
import { Player, Room, GameConfig } from '../typings/game'

const logEvents = true

const sessionID = getUserSessionID()

const log = {
  r: (name: string, ...rest: any) => console.log(`⬇️ [${name}]`, ...rest),
  s: (name: string, ...rest: any) => console.log(`⬆️ [${name}]`, ...rest),
}

interface GameParams {
  gameID: string
}

interface GameState {
  gameConfig: GameConfig | undefined
  players: Player[]
}

type SocketCallback = {
  (socket: SocketIOClient.Socket, ...args: any): void
}

type SocketCallbacks = {
  [key in ClientEvent | ServerEvent]?: SocketCallback
}

interface SocketHooksArgs {
  callbacks: SocketCallbacks
  getPayload: (payload?: any) => Payload
}

interface SocketHook {
  socket: SocketIOClient.Socket | undefined
  isInitialised: boolean
  emit: (name: ClientEvent, payload?: any) => SocketIOClient.Socket | undefined
}

const useSocket = ({ callbacks, getPayload }: SocketHooksArgs): SocketHook => {
  const socketRef = useRef<SocketIOClient.Socket>()
  const socket = socketRef.current

  useEffect(() => {
    if (socket?.connected) {
      return
    }

    const soc = io({ query: { sessionID } })
    socketRef.current = soc

    const boundCallbacks: [string, Function][] = Object.entries(callbacks).map(
      ([name, callback]) => {
        if (!callback) return [name, () => {}]

        const cb = (...args: any) => {
          if (logEvents) log.r(name, ...args)
          return callback(soc, ...args)
        }

        soc.on(name, cb)

        return [name, cb]
      }
    )

    return () => {
      if (!socket?.connected) {
        console.log('[useSocket] removing listeners')
        boundCallbacks.forEach(([name, callback]: [string, Function]) => {
          soc.off(name, callback)
        })
      }
    }
  }, [socket, callbacks])

  return {
    socket,
    isInitialised: Boolean(socket),
    emit: (name, payload) => socket?.emit(name, getPayload(payload)),
  }
}

export default function Game() {
  const { gameID }: GameParams = useParams()
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null)
  const [players, setPlayers] = useState<Player[]>()

  const getPayload = useCallback(
    (payload?: any): Payload => {
      return {
        gameID,
        payload,
      }
    },
    [gameID]
  )

  const callbacks: SocketCallbacks = useMemo(
    () => ({
      [ClientEvent.CONNECT]: () => {
        setIsConnected(true)
      },

      [ClientEvent.DISCONNECT]: () => {
        setGameConfig(null)
      },

      [ServerEvent.PLAYER_JOINED_GAME]: (socket, players: Player[]) => {
        setPlayers(players)
      },

      [ServerEvent.PLAYER_LEFT]: (socket, players: Player[]) => {
        setPlayers(players)
      },

      [ServerEvent.GAME_CONFIG]: (socket, newGameConfig: GameConfig | null) => {
        if (newGameConfig === null) {
          setGameConfig(null)
          return
        }

        if (!gameConfig || newGameConfig.lastAuthor !== sessionID) {
          log.r('GAME_CONFIG', 'Updating game config', newGameConfig)
          setGameConfig(newGameConfig)
          clearPersistedGameConfig()
        } else {
          log.r('GAME_CONFIG', 'Not setting because client is last author')
        }
      },
    }),
    []
  )

  const { socket, isInitialised, emit } = useSocket({ callbacks, getPayload })

  const createOrJoinGame = useCallback(() => {
    if (!isInitialised) return

    const persistedGameConfig = readGameConfig()

    if (persistedGameConfig && !gameConfig) {
      setGameConfig(persistedGameConfig)
      emit(ClientEvent.REQUEST_START_GAME, persistedGameConfig)
    } else if (!gameConfig) {
      emit(ClientEvent.REQUEST_JOIN_GAME)
    }
  }, [emit, isInitialised, isConnected, gameConfig, getPayload])

  useEffect(() => {
    if (socket && isConnected) createOrJoinGame()
  }, [socket, isConnected, gameConfig, gameID, getPayload])

  const handleLetterChange = (letter: string) => () => {
    setGameConfig((gameConfig) => {
      const newLetters = new Set(gameConfig?.letters)
      newLetters.has(letter)
        ? newLetters.delete(letter)
        : newLetters.add(letter)

      const newGameConfig = {
        ...gameConfig,
        letters: [...newLetters],
      }

      emit(ClientEvent.GAME_CONFIG, newGameConfig)

      return newGameConfig as GameConfig
    })
  }

  const handleReconnectButtonClick = (
    event: SyntheticEvent<HTMLButtonElement>
  ) => {}

  if (!isConnected) {
    return (
      <>
        <h1>Game {gameID}</h1>
        <p>Connecting…</p>
      </>
    )
  }

  if (!isConnected && gameConfig === null) {
    return (
      <>
        <h1>Game {gameID}</h1>
        <p>
          Sorry! You disconnected from the server.{' '}
          <button onClick={handleReconnectButtonClick}>Reconnect</button>
        </p>
      </>
    )
  }

  if (isConnected && gameConfig === null) {
    return (
      <>
        <h1>Game {gameID}</h1>
        <p>Sorry, the game does not exist.</p>
        <p>
          Please refresh the page or <Link to='/'>create a new game</Link>
        </p>
      </>
    )
  }

  return (
    <>
      <h1>Game {gameID}</h1>
      <p>Welcome, {sessionID}!</p>
      <section>
        <h2>Categories</h2>
        <ul>
          {gameConfig?.categories &&
            gameConfig?.categories.map((cat) => <li key={cat}>{cat}</li>)}
        </ul>
      </section>
      <section>
        <h2>Letters</h2>
        <ul>
          {gameConfig &&
            ENGLISH_LETTERS.map((letter) => {
              return (
                <li key={letter}>
                  <label>
                    <input
                      type='checkbox'
                      value={letter}
                      checked={gameConfig?.letters?.includes(letter)}
                      onChange={handleLetterChange(letter)}
                    />
                    {letter}
                  </label>
                </li>
              )
            })}
        </ul>
      </section>
      <section>
        <h2>Players</h2>
        <ul>
          {players &&
            players.map((player) => <li key={player.uuid}>{player.uuid}</li>)}
        </ul>
      </section>
    </>
  )
}
