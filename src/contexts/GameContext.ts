import { createContext } from 'react'
import { Room, RoundResults } from '../typings/game'

interface GameContext extends Room {
  answers?: RoundResults
}

const GameContext = createContext<GameContext | undefined>(undefined)

export default GameContext
