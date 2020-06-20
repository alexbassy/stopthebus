import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { readGameConfig } from '../helpers/persistGame'
import { getUserSessionID } from '../helpers/getUserSession'
import io from 'socket.io-client'
import { ClientEvent, ServerEvent, Payload } from '../typings/socket-events'
import { Player, Room, GameConfig } from '../typings/game'

const logEvents = true

const sessionID = getUserSessionID()

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

const useSocket = (
  callbacks: SocketCallbacks
): SocketIOClient.Socket | undefined => {
  const socketRef = useRef<SocketIOClient.Socket>()
  const socket = socketRef.current

  useEffect(() => {
    if (socket?.connected) {
      return
    }

    const soc = io({ query: { sessionID } })
    socketRef.current = soc

    soc.on(ClientEvent.DISCONNECT, () => {
      socketRef.current = undefined
    })
  }, [socket])

  useEffect(() => {
    if (!socketRef.current) return
    const socket = socketRef.current

    console.log('[useSocket] adding listeners', socket, Object.keys(callbacks))

    socket.on('ping', (arg: any) => console.log('pong', arg))

    // Add all event listeners to the socket
    const boundCallbacks: [string, Function][] = Object.entries(callbacks).map(
      ([name, callback]) => {
        console.log(name, callback)
        if (!callback) return [name, () => {}]

        const cb = (...args: any) => {
          if (logEvents) console.log(`[${name}]`, ...args)
          return callback(socket, ...args)
        }

        socket.on(name, cb)

        return [name, cb]
      }
    )

    return () => {
      boundCallbacks.forEach(([name, callback]: [string, Function]) => {
        socket.off(name, callback)
      })
    }
  }, [callbacks])

  return socket
}

export default function Game() {
  const { gameID }: GameParams = useParams()
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [gameConfig, setGameConfig] = useState<GameConfig>()
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

  // const callbacks: SocketCallbacks = useMemo(
  //   () => ({
  //     [ClientEvent.CONNECT]: (socket) => {
  //       console.log('[CONNECT] with ID', socket.id)
  //       setIsConnected(true)
  //     },

  //     [ClientEvent.DISCONNECT]: (socket) => {
  //       console.log('[DISCONNECTED]')
  //     },

  //     [ServerEvent.PLAYER_JOINED_GAME]: (socket, players: Player[]) => {
  //       console.log('[PLAYER_JOINED_GAME]', players)
  //       setPlayers(players)
  //     },

  //     [ServerEvent.PLAYER_LEFT]: (socket, players: Player[]) => {
  //       console.log('[PLAYER_JOINED_GAME]', players)
  //       setPlayers(players)
  //     },

  //     [ServerEvent.GAME_CONFIG]: (socket, gameConfig: GameConfig) => {
  //       console.log('[GAME_CONFIG]', gameConfig)
  //       if (gameConfig.lastAuthor !== sessionID) {
  //         console.log('[GAME_CONFIG] Updating game config')
  //         setGameConfig(gameConfig)
  //       } else {
  //         console.log('[GAME_CONFIG] Not setting because client is last author')
  //       }
  //     },
  //   }),
  //   [gameID]
  // )

  const socket = useSocket({
    [ClientEvent.CONNECT]: (socket) => {
      console.log('[CONNECT] with ID', socket.id)
      setIsConnected(true)
    },

    [ClientEvent.DISCONNECT]: (socket) => {
      console.log('[DISCONNECTED]')
    },

    [ServerEvent.PLAYER_JOINED_GAME]: (socket, players: Player[]) => {
      console.log('[PLAYER_JOINED_GAME]', players)
      debugger
      setPlayers(players)
    },

    [ServerEvent.PLAYER_LEFT]: (socket, players: Player[]) => {
      console.log('[PLAYER_LEFT]', players)
      setPlayers(players)
    },

    [ServerEvent.GAME_CONFIG]: (socket, gameConfig: GameConfig) => {
      console.log('[GAME_CONFIG]', gameConfig)
      if (gameConfig.lastAuthor !== sessionID) {
        console.log('[GAME_CONFIG] Updating game config')
        setGameConfig(gameConfig)
      } else {
        console.log('[GAME_CONFIG] Not setting because client is last author')
      }
    },
  })

  useEffect(() => {
    // debugger

    if (!socket || !isConnected) return

    const persistedGameConfig = readGameConfig()
    if (persistedGameConfig && !gameConfig) {
      setGameConfig(persistedGameConfig)
      const payload = getPayload(persistedGameConfig)
      console.log('Emitting REQUEST_START_GAME', payload)
      socket.emit(ClientEvent.REQUEST_START_GAME, payload)
      // debugger
    } else if (!gameConfig) {
      const payload = getPayload()
      console.log('Emitting REQUEST_JOIN_GAME', payload)
      socket.emit(ClientEvent.REQUEST_JOIN_GAME, payload)
      // debugger
    }
  }, [socket, isConnected, gameConfig, gameID, getPayload])

  return (
    <>
      <h1>Game {gameID}</h1>
      <p>Welcome, {sessionID}!</p>
      <button
        onClick={() => {
          socket?.emit(ClientEvent.SELF_IDENTIFY, getPayload())
        }}
      >
        Self identify
      </button>
      <section>
        <h2>Categories</h2>
        <ul>
          {gameConfig?.categories &&
            [...gameConfig?.categories].map((cat) => <li key={cat}>{cat}</li>)}
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
