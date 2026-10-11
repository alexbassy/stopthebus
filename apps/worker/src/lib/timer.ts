// Minimal Server-Timing helper (replaces `servertime`, whose on-headers dep needs Node's http).
export function createTimer() {
  const open = new Map<string, { desc: string; t0: number }>()
  const done: string[] = []
  return {
    start(name: string, desc: string) {
      open.set(name, { desc, t0: Date.now() })
    },
    end(name: string) {
      const s = open.get(name)
      if (s) done.push(`${name};dur=${Date.now() - s.t0};desc="${s.desc}"`)
    },
    getHeader: () => done.join(', '),
  }
}
