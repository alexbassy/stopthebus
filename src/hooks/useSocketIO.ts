import { useRef, useEffect } from 'react'
import io from 'socket.io-client'
import { ClientEvent, ServerEvent, Payload } from '../typings/socket-events'
import { getUserSessionID } from '../helpers/getUserSession'
import log from '../helpers/log'

export type SocketCallback = {
  (socket: SocketIOClient.Socket, ...args: any): void
}

export type SocketCallbacks = {
  [key in ClientEvent | ServerEvent]?: SocketCallback
}

interface SocketHooksArgs {
  callbacks: SocketCallbacks
  getPayload: (payload?: any) => Payload
}

export type SocketEmitter = {
  (name: ClientEvent, payload?: any): SocketIOClient.Socket | undefined
}

interface SocketHook {
  socket: SocketIOClient.Socket | undefined
  isInitialised: boolean
  emit: SocketEmitter
}

const logEvents = true
const sessionID = getUserSessionID()

export default function useSocket({
  callbacks,
  getPayload,
}: SocketHooksArgs): SocketHook {
  const socketRef = useRef<SocketIOClient.Socket>()
  const socket = socketRef.current

  useEffect(() => {
    if (!socketRef.current) {
      console.log('[useSocket] initialising')
      const soc = io({ query: { sessionID } })
      socketRef.current = soc
    }

    if (!socketRef.current) {
      console.log('[useSocket] no socket, not adding listeners')
      return
    }

    const socket = socketRef.current

    console.log('[useSocket] adding listeners')
    const boundCallbacks: [string, Function][] = Object.entries(callbacks).map(
      ([name, callback]) => {
        if (!callback) return [name, () => {}]

        const cb = (...args: any) => {
          if (logEvents) log.r(name, ...args)
          return callback(socket, ...args)
        }

        socket.on(name, cb)

        return [name, cb]
      }
    )

    return () => {
      if (!socketRef.current?.connected) {
        console.log('[useSocket] removing listeners')
        boundCallbacks.forEach(([name, callback]: [string, Function]) => {
          socketRef.current?.off(name, callback)
        })
      }
    }
  }, [socket, callbacks])

  return {
    socket,
    isInitialised: Boolean(socket),
    emit: (name, payload) => socket?.emit(name, getPayload(payload)),
  }
}
