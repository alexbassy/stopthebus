const r = (name: string, ...rest: any) => console.log(`⬇️ [${name}]`, ...rest)
const s = (name: string, ...rest: any) => console.log(`⬆️ [${name}]`, ...rest)
const e = (...rest: any) => console.log(`🛑 Error:`, ...rest)

export default { r, s, e }
