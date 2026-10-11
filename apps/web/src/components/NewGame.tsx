import React from 'react'

import Dialog from '@/components/Dialog'
import { Grid } from '@/components/Grid'
import Alliteration from '@/components/new-game/Alliteration'
import CategoriesList from '@/components/new-game/CategoriesList'
import CurrentPlayer from '@/components/new-game/CurrentPlayer'
import Letters from '@/components/new-game/Letters'
import PlayerName from '@/components/new-game/PlayerName'
import Players from '@/components/new-game/Players'
import RaceRounds from '@/components/new-game/RaceRounds'
import Countdown from '@/components/overlay/Countdown'
import { Button, Spacing } from '@/components/visual'
import {
  manager,
  useGameConfigCategories,
  useGameRoundLetter,
  useGameRoundTimeStarted,
} from '@/hooks/database'
import usePlayer from '@/hooks/usePlayer'

export default function NewGame() {
  const [currentPlayer] = usePlayer()
  const gameConfigCategories = useGameConfigCategories()
  const gameRoundTimeStarted = useGameRoundTimeStarted()
  const gameRoundLetter = useGameRoundLetter()

  const handleStartGameClick = () => {
    if (!gameConfigCategories.length) {
      alert('Please choose some categories to play with first')
      return
    }
    manager.start()
  }

  const handleCancelStartGame = () => {
    manager.cancelStart()
  }

  if (!currentPlayer) return null

  return (
    <>
      <title>New Game - Stop The Bus</title>
      <Spacing y={1}>
        <CurrentPlayer />
      </Spacing>
      <PlayerName />
      <Grid columns={[2, 1]} stackOnMobile>
        <Letters />
        <Players />
      </Grid>

      <CategoriesList />

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
    </>
  )
}
