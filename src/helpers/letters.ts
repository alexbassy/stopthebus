import { ENGLISH_LETTERS, ENGLISH_DISABLED_LETTERS } from '@/constants/letters'
import * as random from './random'

export function getLetters() {
  return ENGLISH_LETTERS.filter((letter) => !ENGLISH_DISABLED_LETTERS.includes(letter)).join('')
}

export function getNextLetterForGame(letters: string[], previouslyPlayedLetters: string[]): string {
  const availableLetters = letters.filter((letter) => !previouslyPlayedLetters.includes(letter))
  return random.getValue(availableLetters)
}
