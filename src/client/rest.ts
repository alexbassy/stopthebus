import httpStatuses from '@/constants/http-codes'
import { Game, Player } from '@/typings/game'
import API_ROUTES from './api-routes'

export class RequestError extends Error {
  constructor(errorData: any) {
    super()
    this.errorData = errorData
  }
  errorData: any
}

export class GameNotFoundError extends RequestError {
  message = 'There’s no room by that name here.'
}

export class GameAlreadyStartedError extends RequestError {
  message = 'The game has already started. Please create a new one.'
}

export class UnknownRequestError extends RequestError {
  message = `Something went wrong. Code ${this.errorData.code}.`
}

function refineError(errorData: Response) {
  switch (errorData.status) {
    case httpStatuses.NOT_FOUND:
      return new GameNotFoundError(errorData)
    case httpStatuses.FORBIDDEN:
      return new GameAlreadyStartedError(errorData)
    default:
      return new UnknownRequestError(errorData)
  }
}

async function httpRequest<T = any>(route: string, body: Record<any, any>): Promise<T> {
  const data = await fetch(route, {
    method: 'post',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
    },
  })

  if (!data.ok) {
    throw refineError(data)
  }

  if (!(data.headers.get('Content-Type') ?? '').includes('application/json')) {
    return data as unknown as T
  }

  const response = await data.json<T>()
  return response
}

export function createGameWithID(id: string, player: Player) {
  return httpRequest(API_ROUTES.createGame, { id, player })
}

export function joinGameWithID(id: string, player: Player): Promise<Game> {
  return httpRequest<Game>(API_ROUTES.joinGame, { id, player, isJoining: true })
}

// Fire and forget method to leave the game when closing the window or convoluted scenarios like app switching
// https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon#sending_analytics_at_the_end_of_a_session
export function leaveGameWithID(id: string, player: Player): boolean {
  const body = { id, player, isJoining: false }
  const blob = new Blob([JSON.stringify(body)], { type: 'application/json; charset=UTF-8' })
  return navigator.sendBeacon(API_ROUTES.joinGame, blob)
}

export function startGameWithID(id: string): Promise<void> {
  return httpRequest(API_ROUTES.startGame, { id })
}

export function cancelStartGameWithID(id: string): Promise<void> {
  return httpRequest(API_ROUTES.cancelStartGame, { id })
}

export function endRoundWithGameID(id: string, player: Player): Promise<void> {
  return httpRequest(API_ROUTES.endRound, { id, player })
}
