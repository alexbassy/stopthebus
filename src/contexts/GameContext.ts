import { createContext } from 'react'
import { Room, RoundResults, OpponentProgress } from 'shared/typings/game'

interface IGameContext extends Room {
  answers?: RoundResults
  opponentProgress?: OpponentProgress
}

const GameContext = createContext<IGameContext | undefined>(undefined)

export default GameContext
