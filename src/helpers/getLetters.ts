import { ENGLISH_LETTERS, ENGLISH_DISABLED_LETTERS } from '../constants/letters'

export default function getLetters() {
  return ENGLISH_LETTERS.filter(
    (letter) => !ENGLISH_DISABLED_LETTERS.includes(letter)
  ).join('')
}
