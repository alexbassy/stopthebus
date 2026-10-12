import { Answers } from '@stopthebus/shared'

const STORAGE_KEY = 'roundAnswers'

interface Backup {
  roundKey: string
  answers: Answers
}

// The browser keeps a copy of a player's answers as they type, so a reload
// mid-round doesn't lose them while the server only hears at Stop. Only the
// latest round is kept. Storage can be blocked or full, and the game works
// without it, so every access is guarded.
export function loadAnswerBackup(roundKey: string): Answers {
  try {
    const backup: Backup | null = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    return backup?.roundKey === roundKey ? backup.answers : {}
  } catch {
    return {}
  }
}

export function saveAnswerBackup(roundKey: string, answers: Answers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ roundKey, answers } satisfies Backup))
  } catch {
    // Not worth interrupting the game for
  }
}

export function clearAnswerBackup() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Not worth interrupting the game for
  }
}
