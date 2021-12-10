export const API_ROUTES = {
  createGame: '/api/game/create',
  joinGame: '/api/game/join',
  leaveGame: '/api/game/leave',
}

export const APP_ROUTES = {
  game: (id: string) => `/game/${id}`,
}

export default API_ROUTES
