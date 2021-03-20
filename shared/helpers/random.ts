/// <reference path="../module.d.ts" />

import { hri } from 'human-readable-ids'

export const getValue = (list: any[]) =>
  list[Math.floor(Math.random() * list.length)]

export const getGameName = () => {
  return hri.random()
}

export const getPlayerName = () => {
  const id = hri.random()
  return id.split('-')[1]
}
