import { v4 } from 'uuid'
import { Player } from '../typings/game'
import { hri } from 'human-readable-ids'

const LOCAL_STORAGE_KEY = 'session'

const getInitialName = () => {
  const id = hri.random()
  return id.split('-')[1]
}

export function getUserSession(): Player {
  const persisted = localStorage.getItem(LOCAL_STORAGE_KEY)

  if (persisted) {
    return JSON.parse(persisted)
  }

  const user: Player = {
    uuid: v4(),
    name: getInitialName(),
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
