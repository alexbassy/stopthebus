import API_ROUTES from './api-routes'

export async function createGameWithID(name: string, owner: string) {
  const response = await fetch(API_ROUTES.createGame, {
    method: 'post',
    body: JSON.stringify({ name, owner }),
    headers: {
      'content-type': 'application/json',
    },
  })
  const body = await response.json()
  if (!response.ok) {
    throw body
  }
  return body
}

export async function joinGameWithID(name: string, playerID: string) {
  const response = await fetch(API_ROUTES.joinGame, {
    method: 'post',
    body: JSON.stringify({ name }),
    headers: {
      'content-type': 'application/json',
    },
  })
  const body = await response.json()
  if (!response.ok) {
    throw body
  }
  return body
}
