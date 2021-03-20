import { createContext } from 'react'
import { Room, RoundResults, OpponentProgress } from 'shared/typings/game'

interface GameContext extends Room {
  answers?: RoundResults
  opponentProgress?: OpponentProgress
}

const GameContext = createContext<GameContext | undefined>(undefined)

export default GameContext
