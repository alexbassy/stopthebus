import GameName from '@/components/GameName'
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

function getRequestPropertyOrReject(
  propertyName: keyof Handler['req']['body'],
  { req, res }: Handler
): [string, boolean] {
  const property = req.body[propertyName]
  if (!property) {
    res.status(400).json({ message: `${propertyName.toString()} required` })
    return ['', true]
  }
  return [property as string, false]
}

export function getGameId(handler: Handler): [string] | [string, boolean] {
  return getRequestPropertyOrReject('id', handler)
}

export function getGameOwner(handler: Handler): [string] | [string, boolean] {
  return getRequestPropertyOrReject('owner', handler)
}

export function getGamePlayer(handler: Handler): [string] | [string, boolean] {
  return getRequestPropertyOrReject('playerId', handler)
}
