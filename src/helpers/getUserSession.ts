import { nanoid } from 'nanoid'
import { Player } from '@/typings/game'
import * as random from '../helpers/random'

const ID_LENGTH = 8
const LOCAL_STORAGE_KEY = 'session'

export function getUserSession(): Player {
  const persisted = localStorage.getItem(LOCAL_STORAGE_KEY)

  if (persisted) {
    const parsed = JSON.parse(persisted)

    // Switched to 'nanoid' package. If the local storage has
    // a long UUID, discard it.
    if (parsed.uuid.length === ID_LENGTH) {
      return parsed
    }
  }

  const user: Player = {
    uuid: nanoid(ID_LENGTH),
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
