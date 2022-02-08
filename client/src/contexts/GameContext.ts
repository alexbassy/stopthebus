import { createContext } from 'react'
import { Game, RoundResults, OpponentProgress } from '@/typings/game'

interface IGameContext extends Game {
  id: string
  answers?: RoundResults
  opponentProgress?: OpponentProgress
}

const GameContext = createContext<IGameContext | undefined>(undefined)

export default GameContext
