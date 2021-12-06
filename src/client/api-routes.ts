export const API_ROUTES = {
  createGame: '/api/game/create',
  getGame: '/api/game/get',
}

export const APP_ROUTES = {
  game: (id: string) => `/game/${id}`,
}

export default API_ROUTES
