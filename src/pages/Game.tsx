import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  SyntheticEvent,
} from 'react'
import { useParams, Link } from 'react-router-dom'
import useSocketIO, { SocketCallbacks } from '../hooks/useSocketIO'
import {
  readGameConfig,
  clearPersistedGameConfig,
} from '../helpers/persistGame'
import { getUserSessionID } from '../helpers/getUserSession'
import log from '../helpers/log'
import { ENGLISH_LETTERS } from '../constants/letters'
import { ClientEvent, ServerEvent, Payload } from '../typings/socket-events'
import { Player, GameConfig } from '../typings/game'

const sessionID = getUserSessionID()

interface GameParams {
  gameID: string
}

export default function Game() {
  const { gameID }: GameParams = useParams()
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null)
  const [players, setPlayers] = useState<Player[]>()
  const hasGameConfig = gameConfig !== null

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

        if (!hasGameConfig || newGameConfig.lastAuthor !== sessionID) {
          log.r('GAME_CONFIG', 'Updating game config', newGameConfig)
          setGameConfig(newGameConfig)
          clearPersistedGameConfig()
        } else {
          log.r('GAME_CONFIG', 'Not setting because client is last author')
        }
      },
    }),
    [hasGameConfig]
  )

  const { socket, isInitialised, emit } = useSocketIO({ callbacks, getPayload })

  const createOrJoinGame = useCallback(() => {
    if (!isInitialised) return

    const persistedGameConfig = readGameConfig()

    if (persistedGameConfig && !gameConfig) {
      setGameConfig(persistedGameConfig)
      emit(ClientEvent.REQUEST_START_GAME, persistedGameConfig)
    } else if (!gameConfig) {
      emit(ClientEvent.REQUEST_JOIN_GAME)
    }
  }, [emit, isInitialised, gameConfig])

  useEffect(() => {
    if (socket && isConnected) createOrJoinGame()
  }, [socket, isConnected, createOrJoinGame])

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
