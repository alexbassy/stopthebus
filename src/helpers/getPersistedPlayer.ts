import { nanoid } from 'nanoid'
import { Player } from '@/typings/game'
import * as random from './random'

const ID_LENGTH = 8
const LEGACY_KEY = 'session'
const LOCAL_STORAGE_KEY = 'player'

export function getUserSession(): Player {
  // Clear old version of player payload
  localStorage.removeItem(LEGACY_KEY)

  const persisted = localStorage.getItem(LOCAL_STORAGE_KEY)

  if (persisted) {
    const parsed = JSON.parse(persisted) as Player

    // Switched to 'nanoid' package. If the local storage has
    // a long UUID, discard it.
    if (parsed.id.length === ID_LENGTH) {
      return parsed
    }
  }

  const user: Player = {
    id: nanoid(ID_LENGTH),
    name: random.getPlayerName(),
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user))

  return user
}

export function getUserSessionID(): string {
  return getUserSession().id
}

export function updatePersistedUserName(name: string): void {
  const userSession = getUserSession()
  userSession.name = name
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userSession))
}
