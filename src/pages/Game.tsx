import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  SyntheticEvent,
  ChangeEvent,
} from 'react'
import { useParams, Link } from 'react-router-dom'
import NewGame from '../components/NewGame'
import ActiveRound from '../components/ActiveRound'
import ReviewRound from '../components/ReviewRound'
import GameEnd from '../components/GameEnd'
import useSocketIO, { SocketCallbacks } from '../hooks/useSocketIO'
import {
  readGameConfig,
  clearPersistedGameConfig,
} from '../helpers/persistGame'
import { getUserSessionID } from '../helpers/getUserSession'
import log from '../helpers/log'
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
        <p>Sorry! You disconnected from the server. Please refresh the page.</p>
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

  if (!gameConfig || !gameState) {
    return <div>Loading...</div>
  }

  const gameContextValue = {
    config: gameConfig,
    state: gameState,
    players: players || [],
  }

  let Component

  switch (gameState.stage) {
    case GameStage.ACTIVE:
      Component = ActiveRound
      break
    case GameStage.REVIEW:
      Component = ReviewRound
      break
    case GameStage.END:
      Component = GameEnd
      break
    case GameStage.PRE:
    default:
      Component = () => <NewGame onChange={setGameConfig} />
  }

  return (
    <EmitterContext.Provider value={emit}>
      <GameContext.Provider value={gameContextValue}>
        <h1>Stop The Bus</h1>
        <Component />
      </GameContext.Provider>
    </EmitterContext.Provider>
  )
}
