import { COLOUR_VALUES } from 'shared/constants/colours'

export const getColour = (exclude: string[]): string => {
  return COLOUR_VALUES.filter((colourCode) => !exclude.includes(colourCode))[0]
}
