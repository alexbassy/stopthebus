enum LOG_LEVEL {
  None,
  Errors,
  Debug,
}

const LOGGING_LEVEL =
  process.env.LOGGING_LEVEL === 'debug'
    ? 2
    : process.env.LOGGING_LEVEL === 'errors'
    ? 1
    : 0

const isDebugging = LOGGING_LEVEL === LOG_LEVEL.Debug
const isProd = LOGGING_LEVEL === LOG_LEVEL.Errors

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
