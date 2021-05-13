import * as dotenv from 'dotenv'

dotenv.config()

const LOGGING_ENV =
  process.env.REACT_APP_LOGGING_LEVEL || process.env.LOGGING_LEVEL

const LOGGING_LEVEL =
  LOGGING_ENV === 'debug' ? 2 : LOGGING_ENV === 'errors' ? 1 : 0

const isDebugging = LOGGING_LEVEL === 2
const isProd = LOGGING_LEVEL === 1

// Logging functions for "received", "sending", "error", and "debug"
const r = (name: string, ...rest: any) => {
  if (isDebugging) console.log(`⬇️ [${name}]`, ...rest)
}

const s = (name: string, ...rest: any) => {
  if (isDebugging) console.log(`⬆️ [${name}]`, ...rest)
}

const e = (...rest: any) => {
  if (isDebugging || isProd) console.log(`🛑 Error:`, ...rest)
}

const d = (...rest: any) => {
  if (isDebugging) console.log(`ℹ️`, ...rest)
}

// Namespaced logging functions
const n = (name: string) => ({
  r: (...rest: any) => r(name, ...rest),
  s: (...rest: any) => s(name, ...rest),
  e: (...rest: any) => e(`[${name}]`, ...rest),
  d: (...rest: any) => d(`[${name}]`, ...rest),
})

export default { s, n, e, r, d }
