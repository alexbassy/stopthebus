import { v4 } from 'uuid'
import { Player } from '../typings/game'
import * as random from '../helpers/random'

const LOCAL_STORAGE_KEY = 'session'

export function getUserSession(): Player {
  const persisted = localStorage.getItem(LOCAL_STORAGE_KEY)

  if (persisted) {
    return JSON.parse(persisted)
  }

  const user: Player = {
    uuid: v4(),
    name: random.getPlayerName(),
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user))

  return user
}

export function getUserSessionID(): string {
  return getUserSession().uuid
}

export function updatePersistedUserName(name: string): void {
  const userSession = getUserSession()
  userSession.name = name
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userSession))
}
