import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Player,
  GameConfig,
  GameState,
  GameStage,
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
import { joinGameWithID, leaveGameWithID } from '@/client/rest'
import { getUserSession } from '@/helpers/getPersistedPlayer'
import Themed from '@/components/Themed'
import { Subscribe } from '@react-rxjs/core'
import { manager } from '@/hooks/supabase'
import useGameIdFromRoute from '@/hooks/useGameIdFromRoute'
import { fromEvent, map, of, startWith } from 'rxjs'

interface GameParams {
  gameId: string
}

export default function Game() {
  const gameId = useGameIdFromRoute()
  const [hasJoined, setHasJoined] = useState<boolean>(false)

  useEffect(() => {
    if (gameId !== manager.gameId) {
      manager.setId(gameId)
    }
  }, [gameId])

  // Each of these states represents a top level property on the room
  const [gameState, setGameState] = useState<GameState>()
  const [gameConfig, setGameConfig] = useState<GameConfig | null | undefined>()
  const [answers, setAnswers] = useState<RoundResults>()
  const [players, setPlayers] = useState<Player[]>()
  const [opponentProgress, setOpponentProgress] = useState<OpponentProgress>()

  const joinGame = useCallback(async () => {
    if (typeof gameId !== 'string' || hasJoined) return
    const player = getUserSession()
    const response = await joinGameWithID(gameId, player)
    setGameConfig(response.config)
    setGameState(response.state)
    setPlayers(response.players)
    setHasJoined(true)
  }, [gameId, hasJoined])

  const leaveGame = useCallback(() => {
    if (!hasJoined) return
    const player = getUserSession()
    leaveGameWithID(gameId, player)
    setHasJoined(false)
  }, [gameId, hasJoined])

  const visibility$ = useMemo(() => {
    if (typeof document === 'undefined') return of(false)
    return fromEvent(document, 'visibilitychange').pipe(
      startWith(false),
      map(() => document.visibilityState === 'hidden')
    )
  }, [])

  // Join/leave game when visibility changes
  useEffect(() => {
    const onVisibilityChange = visibility$.subscribe((isHidden) =>
      isHidden ? leaveGame() : joinGame()
    )

    return () => {
      onVisibilityChange.unsubscribe()
    }
  }, [gameId, joinGame, leaveGame, visibility$])

  // REMOVED
  // when connected to socket (change this to realtime connection), create or join game
  // -> get player config (will generate if needed, returns player id)
  // -> read game config from api client
  // -> join the game (new api route needed which adds player to config)
  // ---> add `visibilitychange` listener which removes user from game
  // ->

  if (!hasJoined) {
    return (
      <Themed>
        <PageTitle />
        <GameName />
        <p>Connecting…</p>
      </Themed>
    )
  }

  if (!hasJoined && gameConfig === null) {
    return (
      <Themed>
        <PageTitle />
        <GameName />
        <p>Sorry! You disconnected from the server. Please refresh the page.</p>
      </Themed>
    )
  }

  if (hasJoined && gameConfig === null) {
    return (
      <Themed>
        <PageTitle />
        <GameName />
        <p>Sorry, the game does not exist.</p>
        <p>
          Please refresh the page or <ExternalLink href='/'>create a new game</ExternalLink>
        </p>
      </Themed>
    )
  }

  const gameContextValue = {
    id: gameId,
    config: gameConfig,
    state: gameState,
    players: players || [],
    answers,
    opponentProgress,
  }

  let Component

  switch (gameState?.stage) {
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
    <Themed>
      <GameContext.Provider value={gameContextValue}>
        <Subscribe>
          <PageTitle isInGame={gameState?.stage !== GameStage.PRE} />
          <GameName isShareable={gameState?.stage === GameStage.PRE} />
          <Component />
        </Subscribe>
      </GameContext.Provider>
    </Themed>
  )
}
