import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { readGameConfig, clearPersistedGameConfig } from '@/helpers/persistGame'
import { getUserSessionID, getUserSession } from '@/helpers/getPersistedPlayer'
import log from '@/helpers/log'
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
import GameContext from '../../contexts/GameContext'
import EmitterContext from '../../contexts/EmitterContext'

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

  // First connect to the game.
  useEffect(() => {}, [gameID])

  // REMOVED
  // when connected to socket (change this to realtime connection), create or join game
  // -> get player config (will generate if needed, returns player id)
  // -> read game config from api client
  // -> join the game (new api route needed which adds player to config)
  // ---> add `visibilitychange` listener which removes user from game
  // ->

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
