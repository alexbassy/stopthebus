import * as faunadb from 'faunadb'

if (!process.env.NEXT_PUBLIC_FAUNA_KEY) {
  throw new Error(`Missing "NEXT_PUBLIC_FAUNA_KEY" environment variable`)
}

export const browserClient = new faunadb.Client({
  secret: process.env.NEXT_PUBLIC_FAUNA_KEY as string,
  domain: 'db.eu.fauna.com',
  port: 443,
  scheme: 'https',
})

export const serverClient = new faunadb.Client({
  secret: process.env.FAUNA_SECRET as string,
  domain: 'db.eu.fauna.com',
  port: 443,
  scheme: 'https',
})

export const q = faunadb.query
