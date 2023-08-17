const API_BASE = 'https://stopthebus.abass.workers.dev'

export const API_ROUTES = {
  createGame: `${API_BASE}/create`,
  joinGame: `${API_BASE}/join`,
  startGame: `${API_BASE}/start`,
  cancelStartGame: `${API_BASE}/cancel`,
  endRound: `${API_BASE}/end-round`,
}

export const APP_ROUTES = {
  game: (id: string) => `/game/${id}`,
}

export default API_ROUTES
