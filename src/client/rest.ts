import { Game, IGame } from '@/typings/supabase'
import API_ROUTES from './api-routes'

const errorMessages = {
  [42703]: 'There’s no room by that name here.',
}

class RequestError extends Error {
  constructor(errorData: any) {
    super()
    this.errorData = errorData
  }
  errorData: any
}

class GameNotFoundError extends RequestError {
  message = 'There’s no room by that name here.'
}

class UnknownRequestError extends RequestError {
  message = `Something went wrong. Code ${this.errorData.code}.`
}

function refineError(errorData: any) {
  switch (errorData.code) {
    case '42703':
      return new GameNotFoundError(errorData)
    default:
      return new UnknownRequestError(errorData)
  }
}

async function httpRequest<T>(route: string, body: Record<any, any>): Promise<T> {
  const data = await fetch(route, {
    method: 'post',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
    },
  })
  const response = await data.json()
  if (!data.ok) {
    throw refineError(response)
  }
  return response
}

export function createGameWithID(id: string, owner: string) {
  return httpRequest(API_ROUTES.createGame, { id, owner })
}

export function joinGameWithID(id: string, playerId: string): Promise<IGame> {
  return httpRequest<IGame>(API_ROUTES.joinGame, { id, playerId })
}
