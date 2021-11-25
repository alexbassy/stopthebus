import { createContext } from 'react'
import { SocketEmitter } from '../hooks/useSocketIO'

const EmitterContext = createContext<SocketEmitter | undefined>(undefined)

export default EmitterContext
