import { Hono } from 'hono'
import { Game } from './game-object'

export { Game }

const app = new Hono<{ Bindings: { GAME: DurableObjectNamespace<Game> } }>()

app.get('/ws/:gameId', (c) => {
  const name = c.req.param('gameId').toLowerCase()
  if (!/^[a-z0-9-]{1,64}$/.test(name)) return new Response('Invalid game ID', { status: 400 })
  return c.env.GAME.get(c.env.GAME.idFromName(name)).fetch(c.req.raw)
})

export default app
