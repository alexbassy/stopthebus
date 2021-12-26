import { createContext } from 'react'
import { Room, RoundResults, OpponentProgress } from '@/typings/game'

interface IGameContext extends Room {
  id: string
  answers?: RoundResults
  opponentProgress?: OpponentProgress
}

const GameContext = createContext<IGameContext | undefined>(undefined)

export default GameContext
