import React from 'react'
import Head from 'next/head'
import { Grid } from './Grid'
import { Button, Spacing } from './visual'
import CategoriesList from './new-game/CategoriesList'
import Dialog from './Dialog'
import Countdown from './Countdown'
import Letters from '@/components/new-game/Letters'
import Alliteration from './new-game/Alliteration'
import Players from './new-game/Players'
import PlayerName from './new-game/PlayerName'
import CurrentPlayer from './new-game/CurrentPlayer'
import {
  useGameConfigCategories,
  useGameRoundLetter,
  useGameRoundTimeStarted,
} from '@/hooks/supabase'
import RaceRounds from './new-game/RaceRounds'
import { cancelStartGameWithID, startGameWithID } from '@/client/rest'
import useGameIdFromRoute from '@/hooks/useGameIdFromRoute'
import usePlayer from '@/hooks/usePlayer'

export default function NewGame() {
  const gameId = useGameIdFromRoute()
  const currentPlayer = usePlayer()
  const gameConfigCategories = useGameConfigCategories()
  const gameRoundTimeStarted = useGameRoundTimeStarted()
  const gameRoundLetter = useGameRoundLetter()

  const handleStartGameClick = () => {
    if (!gameConfigCategories.length) {
      alert('Please choose some categories to play with first')
      return
    }
    startGameWithID(gameId)
  }

  const handleCancelStartGame = () => {
    cancelStartGameWithID(gameId)
  }

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
      <Spacing b={2} />

      <Button large onClick={handleStartGameClick}>
        Start game
      </Button>

      <Dialog>
        {(gameRoundTimeStarted || 0) > Date.now() && (
          <Countdown
            from={3}
            onCancel={handleCancelStartGame}
            showAfter={gameRoundLetter?.toUpperCase()}
            // In reality it should be displayed for 1.5s, but instruct the
            // component to display it for longer to account for transport latency
            afterMessageDuration={3000}
          />
        )}
      </Dialog>
    </div>
  )
}
