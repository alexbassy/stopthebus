import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { readGameConfig, clearPersistedGameConfig } from '@/helpers/persistGame'
import { getUserSessionID, getUserSession } from '@/helpers/getPersistedPlayer'
import log from '@/helpers/log'
import { ClientEvent, ServerEvent, Payload } from '@/typings/socket-events'
import {
  Player,
  GameConfig,
  GameState,
  GameStage,
  Room,
  Scores,
  RoundResults,
  OpponentProgress,
} from '@/typings/game'
import NewGame from '@/components/NewGame'
import ActiveRound from '@/components/ActiveRound'
import ReviewRound from '@/components/ReviewRound'
import GameEnd from '@/components/GameEnd'
import PageTitle from '@/components/PageTitle'
import { ExternalLink } from '@/components/visual'
import GameName from '@/components/GameName'
import useSocketIO, { SocketCallbacks } from '../../hooks/useSocketIO'
import GameContext from '../../contexts/GameContext'
import EmitterContext from '../../contexts/EmitterContext'

const sessionID = getUserSessionID()

interface GameParams {
  gameID: string
}

const defaultGameState: GameState = {
  stage: GameStage.PRE,
  rounds: [],
}

export default function Game() {
  const { query } = useRouter()
  const { id: gameID } = query
  const [isConnected, setIsConnected] = useState<boolean>(false)

  // Each of these states represents a top level property on the room
  const [gameState, setGameState] = useState<GameState>(defaultGameState)
  const [gameConfig, setGameConfig] = useState<GameConfig | null | undefined>()
  const [answers, setAnswers] = useState<RoundResults>()
  const [players, setPlayers] = useState<Player[]>()
  const [opponentProgress, setOpponentProgress] = useState<OpponentProgress>()

  const hasGameConfig = gameConfig !== null

  const getPayload = useCallback(
    (payload?: any): Payload | null => {
      return {
        gameID: gameID as string,
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
        log.d('Gone inactive')
        setIsConnected(false)
      },

      [ServerEvent.GAME_NOT_FOUND]: () => {
        setGameConfig(null)
      },

      [ServerEvent.JOINED_GAME]: (socket, room: Room) => {
        const session = getUserSession()
        socket.emit(ClientEvent.UPDATE_NICKNAME, getPayload(session.name))
        setPlayers(room.players)
        setGameConfig(room.config)
        setGameState(room.state)
      },

      [ServerEvent.OPPONENT_CURRENT_CATEGORY]: (_socket, progress: OpponentProgress) => {
        console.log({ progress })
        setOpponentProgress((currentProgress) => ({
          ...currentProgress,
          ...progress,
        }))
      },

      [ServerEvent.PLAYER_JOINED_GAME]: (_socket, players: Player[]) => {
        setPlayers(players)
      },

      [ServerEvent.PLAYER_LEFT]: (_socket, players: Player[]) => {
        setPlayers(players)
      },

      [ServerEvent.GAME_CONFIG]: (_socket, newGameConfig: GameConfig | null) => {
        if (newGameConfig === null) {
          setGameConfig(null)
          return
        }

        if (!hasGameConfig || newGameConfig.lastAuthor !== sessionID) {
          setGameConfig(newGameConfig)
          clearPersistedGameConfig()
        } else {
          log.r('GAME_CONFIG', 'Not setting because client is last author')
        }
      },

      [ServerEvent.ROUND_STARTING]: (_socket, newGameState: GameState) => {
        setGameState(newGameState)
      },

      [ServerEvent.GAME_STATE_CHANGE]: (_socket, newGameState: GameState) => {
        setGameState(newGameState)
      },

      [ServerEvent.ROUND_STARTED]: (_socket, newGameState: GameState) => {
        setGameState(newGameState)
      },

      [ServerEvent.SEND_ANSWERS]: (_socket, playerAnswers: RoundResults) => {
        setAnswers(playerAnswers)
      },

      [ServerEvent.ROUND_ENDING]: (_socket, newGameState: GameState) => {
        setGameState(newGameState)
      },

      [ServerEvent.ROUND_ENDED]: (_socket, newGameState: GameState) => {
        setGameState(newGameState)
        setOpponentProgress({})
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
    [hasGameConfig, getPayload]
  )

  const { socket, isInitialised, emit } = useSocketIO({ callbacks, getPayload })

  const createOrJoinGame = useCallback(() => {
    if (!isInitialised) return

    const persistedGameConfig = readGameConfig()
    const isCorrect = persistedGameConfig?.id === gameID

    if (persistedGameConfig && isCorrect && !gameConfig) {
      setGameConfig(persistedGameConfig)
      emit(ClientEvent.REQUEST_CREATE_GAME, persistedGameConfig)
      clearPersistedGameConfig()
    } else if (!gameConfig) {
      emit(ClientEvent.REQUEST_JOIN_GAME)
    }
  }, [emit, gameID, isInitialised, gameConfig])

  useEffect(() => {
    if (socket && isConnected) createOrJoinGame()
  }, [socket, isConnected, createOrJoinGame])

  if (!isConnected) {
    return (
      <>
        <PageTitle />
        <GameName />
        <p>Connecting…</p>
      </>
    )
  }

  if (!isConnected && gameConfig === null) {
    return (
      <>
        <PageTitle />
        <GameName />
        <p>Sorry! You disconnected from the server. Please refresh the page.</p>
      </>
    )
  }

  if (isConnected && gameConfig === null) {
    return (
      <>
        <PageTitle />
        <GameName />
        <p>Sorry, the game does not exist.</p>
        <p>
          Please refresh the page or <ExternalLink href='/'>create a new game</ExternalLink>
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
    answers,
    opponentProgress,
  }

  let Component

  switch (gameState.stage) {
    case GameStage.ACTIVE:
    case GameStage.ENDING:
      Component = ActiveRound
      break
    case GameStage.NEXT_STARTING:
    case GameStage.REVIEW:
      Component = ReviewRound
      break
    case GameStage.FINISHED:
      Component = GameEnd
      break
    case GameStage.PRE:
    default:
      // eslint-disable-next-line react/display-name
      Component = () => <NewGame onChange={setGameConfig} />
  }

  return (
    <EmitterContext.Provider value={emit}>
      <GameContext.Provider value={gameContextValue}>
        <PageTitle isInGame={gameState.stage !== GameStage.PRE} />
        <GameName isShareable={gameState.stage === GameStage.PRE} />
        <Component />
      </GameContext.Provider>
    </EmitterContext.Provider>
  )
}
