import { useRef, useEffect, useCallback } from 'react'
import io from 'socket.io-client'
import { ClientEvent, ServerEvent, Payload } from '../typings/socket-events'
import { getUserSession } from '../helpers/getUserSession'
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
const session = getUserSession()

export default function useSocket({
  callbacks,
  getPayload,
}: SocketHooksArgs): SocketHook {
  const socketRef = useRef<SocketIOClient.Socket>()
  const socket = socketRef.current

  useEffect(() => {
    if (!socketRef.current) {
      console.log('[useSocket] initialising')
      const soc = io({ query: { sessionID: session.uuid } })
      socketRef.current = soc
    }

    if (!socketRef.current) {
      console.log('[useSocket] no socket, not adding listeners')
      return
    }

    const socket = socketRef.current

    socket.on(ClientEvent.DISCONNECT, (reason: string) => {
      if (reason === 'io server disconnect') {
        // The disconnection was initiated by the server, need to reconnect manually
        socket.connect()
      }
    })

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
      boundCallbacks.forEach(([name, callback]: [string, Function]) => {
        socketRef.current?.off(name, callback)
      })
    }
  }, [socket, callbacks, getPayload])

  const sendEvent = useCallback(
    (name: string, payload: any) => {
      if (!socket?.emit) return
      if (logEvents) log.s(name, payload)
      return socket.emit(name, getPayload(payload))
    },
    [socket, getPayload]
  )

  return {
    socket,
    emit: sendEvent,
    isInitialised: Boolean(socket),
  }
}
