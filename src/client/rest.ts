import API_ROUTES from './api-routes'

export async function createGameWithID(name: string, owner: string) {
  const response = await fetch(API_ROUTES.createGame, {
    method: 'post',
    body: JSON.stringify({ name, owner }),
  })
  const body = await response.json()
  if (!response.ok) {
    throw body
  }
  return body
}
