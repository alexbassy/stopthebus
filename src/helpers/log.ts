const log = {
  r: (name: string, ...rest: any) => console.log(`⬇️ [${name}]`, ...rest),
  s: (name: string, ...rest: any) => console.log(`⬆️ [${name}]`, ...rest),
}

export default log
