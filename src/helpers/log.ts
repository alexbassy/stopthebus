// Logging functions for "received", "sending", "error", and "debug"
const r = (name: string, ...rest: any) => console.log(`⬇️ [${name}]`, ...rest)
const s = (name: string, ...rest: any) => console.log(`⬆️ [${name}]`, ...rest)
const e = (...rest: any) => console.log(`🛑 Error:`, ...rest)
const d = (...rest: any) => console.log(`ℹ️`, ...rest)

// Namespaced logging functions
const n = (name: string) => ({
  r: (...rest: any) => r(name, ...rest),
  s: (...rest: any) => s(name, ...rest),
  e: (...rest: any) => e(`[${name}]`, ...rest),
  d: (...rest: any) => d(`[${name}]`, ...rest),
})

export default { s, n, e, r, d }
