export const API_ROUTES = {
  createGame: '/api/game/create',
  joinGame: '/api/game/join',
  startGame: '/api/game/start',
  cancelStartGame: '/api/game/cancel',
  endRound: '/api/game/end-round',
}

export const APP_ROUTES = {
  game: (id: string) => `/game/${id}`,
}

export default API_ROUTES
