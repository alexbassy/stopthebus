import { createContext } from 'react'
import { Room } from '../typings/game'

const GameContext = createContext<Room | undefined>(undefined)

export default GameContext
