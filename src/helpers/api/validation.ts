import GameName from '@/components/GameName'
import { Player } from '@/typings/game'
import { NextApiRequest, NextApiResponse } from 'next'

interface Handler {
  req: NextApiRequest
  res: NextApiResponse
}

export function assertMethod(method: 'GET' | 'POST', { req, res }: Handler): boolean {
  if (req.method !== method) {
    res.status(405).end()
    return false
  }
  return true
}

export function getRequestPropertyOrReject<T>(
  propertyName: keyof Handler['req']['body'],
  { req, res }: Handler
): [T] | [T, boolean] {
  const property = req.body[propertyName]

  if (typeof property === 'undefined' || property == null) {
    res.status(400).json({ message: `${propertyName.toString()} required` })
    return [null as unknown as T, true]
  }

  return [property as T, false]
}

export function getGameId(handler: Handler) {
  return getRequestPropertyOrReject<string>('id', handler)
}

export function getGameOwner(handler: Handler) {
  return getRequestPropertyOrReject<string>('owner', handler)
}

export function getGamePlayer(handler: Handler) {
  return getRequestPropertyOrReject<Player>('player', handler)
}

export function getIsJoining(handler: Handler) {
  return getRequestPropertyOrReject<boolean>('isJoining', handler)
}