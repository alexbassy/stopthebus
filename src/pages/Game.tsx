import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  SyntheticEvent,
  ChangeEvent,
} from 'react'
import { useParams, Link } from 'react-router-dom'
import ActiveRound from '../components/ActiveRound'
import ReviewRound from '../components/ReviewRound'
import useSocketIO, { SocketCallbacks } from '../hooks/useSocketIO'
import {
  readGameConfig,
  clearPersistedGameConfig,
} from '../helpers/persistGame'
import { getUserSessionID } from '../helpers/getUserSession'
import { range } from '../helpers/util'
import log from '../helpers/log'
import { ENGLISH_LETTERS } from '../constants/letters'
import { ClientEvent, ServerEvent, Payload } from '../typings/socket-events'
import {
  Player,
  GameConfig,
  GameMode,
  GameState,
  GameStage,
  Room,
  Scores,
} from '../typings/game'
import GameContext from '../contexts/GameContext'
import EmitterContext from '../contexts/EmitterContext'

const sessionID = getUserSessionID()

interface GameParams {
  gameID: string
}

const defaultGameState: GameState = {
  stage: GameStage.PRE,
  rounds: [],
}

export default function Game() {
  const { gameID }: GameParams = useParams()
  const [isConnected, setIsConnected] = useState<boolean>(false)

  // Each of these states represents a top level property on the room
  const [gameState, setGameState] = useState<GameState>(defaultGameState)
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

      [ServerEvent.JOINED_GAME]: (socket, room: Room) => {
        setPlayers(room.players)
        setGameConfig(room.config)
        setGameState(room.state)
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

      [ServerEvent.ROUND_STARTED]: (socket, newGameState: GameState) => {
        setGameState(newGameState)
      },

      [ServerEvent.ROUND_ENDED]: (socket, newGameState: GameState) => {
        setGameState(newGameState)
      },

      [ServerEvent.UPDATE_VOTES]: (socket, newVotes: Scores) => {
        setGameState((currentGameState) => {
          const newGameState: GameState = { ...currentGameState }

          if (!newGameState.currentRound) {
            return currentGameState
          }

          newGameState.currentRound.scores = newVotes
          return newGameState
        })
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
      emit(ClientEvent.REQUEST_CREATE_GAME, persistedGameConfig)
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

  const handleModeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setGameConfig((gameConfig) => {
      const newGameConfig = {
        ...gameConfig,
        mode: value as GameMode,
      }
      emit(ClientEvent.GAME_CONFIG, newGameConfig)
      return newGameConfig as GameConfig
    })
  }

  const handleTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value)
    setGameConfig((gameConfig) => {
      if (!gameConfig) return gameConfig
      const newGameConfig = {
        ...gameConfig,
        time: value * 1000,
      }
      emit(ClientEvent.GAME_CONFIG, newGameConfig)
      return newGameConfig
    })
  }

  const handleRoundCountChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setGameConfig((gameConfig) => {
      if (!gameConfig) return gameConfig
      const newGameConfig: GameConfig = {
        ...gameConfig,
        rounds: Number(value),
      }
      emit(ClientEvent.GAME_CONFIG, newGameConfig)
      return newGameConfig
    })
  }

  const handleAlliterationChange = (event: ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked
    setGameConfig((gameConfig) => {
      if (!gameConfig) return gameConfig
      const newGameConfig: GameConfig = {
        ...gameConfig,
        scoreWithAlliteration: isChecked,
      }
      emit(ClientEvent.GAME_CONFIG, newGameConfig)
      return newGameConfig
    })
  }

  const handleReconnectButtonClick = (
    event: SyntheticEvent<HTMLButtonElement>
  ) => {}

  const handleStartGameClick = (event: SyntheticEvent<HTMLButtonElement>) => {
    emit(ClientEvent.START_ROUND)
  }

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

  if (gameConfig && gameState?.stage === GameStage.ACTIVE) {
    const game = {
      config: gameConfig,
      state: gameState,
      players: players || [],
    }
    return (
      <EmitterContext.Provider value={emit}>
        <GameContext.Provider value={game}>
          <ActiveRound />
        </GameContext.Provider>
      </EmitterContext.Provider>
    )
  }

  if (gameConfig && gameState?.stage === GameStage.REVIEW) {
    const game = {
      config: gameConfig,
      state: gameState,
      players: players || [],
    }
    return (
      <EmitterContext.Provider value={emit}>
        <GameContext.Provider value={game}>
          <ReviewRound />
        </GameContext.Provider>
      </EmitterContext.Provider>
    )
  }

  return (
    <>
      <h1>Game {gameID}</h1>
      <p>Welcome, {sessionID}!</p>
      <p>
        Game state: {gameState?.stage}{' '}
        <button onClick={() => console.log(gameState)}>log to console</button>
      </p>
      <h2>Game settings</h2>
      <section>
        <h3>Categories</h3>
        <ul>
          {gameConfig?.categories &&
            gameConfig?.categories.map((cat) => <li key={cat}>{cat}</li>)}
        </ul>
      </section>
      <section>
        <h3>Mode</h3>
        <p>You can race against each other, or with a time limit</p>
        <div>
          <label>
            Play mode{' '}
            <select value={gameConfig?.mode} onChange={handleModeChange}>
              <option value={GameMode.RACE}>Race</option>
              <option value={GameMode.TIMER}>Timer</option>
            </select>
          </label>
        </div>
        <div>
          {gameConfig?.mode === GameMode.TIMER && (
            <label>
              Time (seconds){' '}
              <input
                type='number'
                value={Math.round(
                  gameConfig.time ? gameConfig.time / 1000 : 60
                )}
                onChange={handleTimeChange}
              />
            </label>
          )}
        </div>
        <div>
          Number of rounds{' '}
          <select value={gameConfig?.rounds} onChange={handleRoundCountChange}>
            {range(1, 10).map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>
            <input
              type='checkbox'
              checked={gameConfig?.scoreWithAlliteration}
              onChange={handleAlliterationChange}
            />{' '}
            Points for alliteration
          </label>
        </div>
      </section>
      <section>
        <h3>Letters</h3>
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
        <h3>Players</h3>
        <ul>
          {players &&
            players.map((player) => <li key={player.uuid}>{player.uuid}</li>)}
        </ul>
      </section>
      <button onClick={handleStartGameClick}>Start game</button>
    </>
  )
}
