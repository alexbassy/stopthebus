declare module 'human-readable-ids' {
  function random(): string

  interface HRI {
    random: () => string
  }

  export var hri: HRI
}
