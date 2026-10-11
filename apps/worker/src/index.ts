import { Router, listen } from 'worktop'
import * as CORS from 'worktop/cors'

import handleCreate from './routes/create'
import handleJoinOrLeave from './routes/join'
import handleStart from './routes/start'
import handleCancel from './routes/cancel'
import handleEndRound from './routes/end-round'

const API = new Router()

API.prepare = CORS.preflight({
  origin:
    /(192\.168\.2\.115:3000|localhost:3000|stopthebus\.xyz|(alexbass|stopthebus)\.vercel\.app$)/,
  headers: ['Cache-Control', 'Content-Type', 'X-Count'],
  methods: ['POST'],
})

API.add('POST', '/create', handleCreate)
API.add('POST', '/join', handleJoinOrLeave)
API.add('POST', '/start', handleStart)
API.add('POST', '/cancel', handleCancel)
API.add('POST', '/end-round', handleEndRound)

listen(API.run)
