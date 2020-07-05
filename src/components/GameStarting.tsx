import React, { useState, useEffect, SyntheticEvent } from 'react'
import { Button } from './visual'
import { TIME_BEFORE_GAME_START } from '../constants/game'

interface GameStartingProps {
  onCancel: (event: SyntheticEvent<HTMLButtonElement>) => void
}

export default function GameStarting(props: GameStartingProps) {
  const [timeLeft, setTimeLeft] = useState<number>(
    TIME_BEFORE_GAME_START / 1000
  )

  useEffect(() => {
    const interval = setTimeout(() => {
      if (timeLeft > 0) setTimeLeft((current) => current - 1)
    }, 1000)

    return () => {
      clearTimeout(interval)
    }
  }, [timeLeft])

  return (
    <div>
      <h1>Game starting...</h1>
      <p>The game is starting in {timeLeft} seconds…</p>
      <Button onClick={props.onCancel}>Cancel</Button>
    </div>
  )
}
