import * as random from './random'
import { ENGLISH_LETTERS, ENGLISH_DISABLED_LETTERS } from '../constants/letters'
import { GameConfig, GameState } from '../typings/game'

export function getLetters() {
  return ENGLISH_LETTERS.filter(
    (letter) => !ENGLISH_DISABLED_LETTERS.includes(letter)
  ).join('')
}

export function getNextLetterForGame(
  config: GameConfig,
  state: GameState
): string {
  if (state.nextLetter) {
    // A letter has already been chosen for the game, probably before it started.
    // Now let’s just return it
    return state.nextLetter
  }

  // Count up the previously played letters and pick a new
  // letter for the next round.
  const previouslyPlayedLetters = state.rounds.length
    ? state.rounds.map((round) => round.letter || '')
    : []
  const availableLetters = config.letters
    .split('')
    .filter((letter) => !previouslyPlayedLetters.includes(letter))
  const letterForNextRound = random.getValue(availableLetters)

  return letterForNextRound
}
