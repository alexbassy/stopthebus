import * as faunadb from 'faunadb'

export const workerClient = new faunadb.Client({
  secret: WORKER_FAUNA_KEY as string,
  domain: 'db.eu.fauna.com',
  port: 443,
  scheme: 'https',
})

export const q = faunadb.query
