import React, {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  SyntheticEvent,
  useContext,
  useState,
} from 'react'
import Head from 'next/head'
import { ENGLISH_LETTERS } from '@/constants/letters'
import { getUserSessionID, updatePersistedUserName } from '@/helpers/getPersistedPlayer'
import { range } from '@/helpers/util'
import { GameConfig, GameMode, GameStage } from '@/typings/game'
import { ClientEvent } from '@/typings/socket-events'
import { Flex, Grid } from './Grid'
import {
  Button,
  Checkbox,
  H3,
  Input,
  Item,
  List,
  Spacing,
  Select,
  Lighter,
  Description,
} from './visual'
import FormControl from './FormControl'
import CategoriesList from './new-game/CategoriesList'
import Player from './Player'
import Dialog from './Dialog'
import Countdown from './Countdown'
import GameContext from '../contexts/GameContext'
import Letters from '@/components/new-game/Letters'
import Alliteration from './new-game/Alliteration'
import Players from './new-game/Players'
import PlayerName from './new-game/PlayerName'
import usePlayer from '@/hooks/usePlayer'
import CurrentPlayer from './new-game/CurrentPlayer'
import { useGameConfigCategories } from '@/hooks/supabase'
import RaceRounds from './new-game/RaceRounds'

interface NewGameProps {
  onChange: Dispatch<SetStateAction<GameConfig | null | undefined>>
}

export default function NewGame(props: NewGameProps) {
  const emit = (...args: any) => console.log(...args)
  const game = useContext(GameContext)

  if (!game) return null

  const handleModeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    props.onChange((gameConfig) => {
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
    props.onChange((gameConfig) => {
      if (!gameConfig) return gameConfig
      const newGameConfig = {
        ...gameConfig,
        time: value * 1000,
      }
      emit(ClientEvent.GAME_CONFIG, newGameConfig)
      return newGameConfig
    })
  }

  const handleStartGameClick = (event: SyntheticEvent<HTMLButtonElement>) => {
    if (!game.config.categories.length) {
      alert('Please choose some categories to play with first')
      return
    }
    emit(ClientEvent.START_ROUND)
  }

  const handleCancelStartGame = () => {
    emit(ClientEvent.CANCEL_START_ROUND)
  }

  const { config, players, state } = game
  const currentPlayer = players ? players.find((player) => player.id === getUserSessionID()) : null

  if (!currentPlayer) return null

  return (
    <div>
      <Head>
        <title>New Game - Stop The Bus</title>
      </Head>
      <Spacing y={1}>
        <CurrentPlayer />
      </Spacing>
      <PlayerName />
      <Grid columns={[2, 1]} stackOnMobile>
        <Letters />
        <Players />
      </Grid>

      <CategoriesList />

      <section>
        {/* <H3>Mode</H3>
        <p>You can race against each other, or with a time limit</p>
        <div aria-hidden style={{ display: 'none' }}>
          <label>
            Play mode{' '}
            <Select value={config?.mode} onBlur={handleModeChange} onChange={handleModeChange}>
              <option value={GameMode.RACE}>Race</option>
              <option value={GameMode.TIMER}>Timer</option>
            </Select>
          </label>
        </div>
        <div id='mode-timer'>
          {config?.mode === GameMode.TIMER && (
            <label>
              Time (seconds){' '}
              <Input
                type='number'
                value={Math.round(config.time ? config.time / 1000 : 60)}
                onChange={handleTimeChange}
              />
            </label>
          )}
        </div> */}
        <Spacing b={2} />
        <RaceRounds />
        <Spacing b={2} />
        <Alliteration />
      </section>
      <Spacing b={2} />

      <Button large onClick={handleStartGameClick}>
        Start game
      </Button>

      <Dialog>
        {state.stage === GameStage.STARTING && (
          <Countdown
            from={3}
            onCancel={handleCancelStartGame}
            showAfter={state.nextLetter?.toUpperCase()}
            // In reality it should be displayed for 1.5s, but instruct the
            // component to display it for longer to account for transport latency
            afterMessageDuration={3000}
          />
        )}
      </Dialog>
    </div>
  )
}
