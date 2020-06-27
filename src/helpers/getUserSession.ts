import { v4 } from 'uuid'

export interface User {
  uuid: string
}

export function getUserSession(): User {
  const persisted = localStorage.getItem('session')

  if (persisted) {
    return JSON.parse(persisted)
  }

  const user: User = {
    uuid: v4(),
  }

  localStorage.setItem('session', JSON.stringify(user))

  return user
}

export function getUserSessionID(): string {
  return getUserSession().uuid
}
