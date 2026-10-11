export const range = (start = 0, end: number) =>
  new Array(end + 1 - start).fill(undefined).map((_, i) => i + start)
