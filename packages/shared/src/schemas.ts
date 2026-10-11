import { z } from 'zod'

// User-entered text, capped so one message can't bloat a game's storage
export const TextSchema = z.string().trim().max(100)

export const PlayerSchema = z.object({
  id: TextSchema.min(1),
  name: TextSchema.min(1),
  colour: TextSchema,
})
export type Player = z.infer<typeof PlayerSchema>

export const GameStageSchema = z.enum(['pre', 'active', 'review', 'finished'])
export type GameStage = z.infer<typeof GameStageSchema>
export const GameStage = GameStageSchema.enum

export const GameConfigSchema = z.object({
  categories: z.array(TextSchema.min(1)),
  numRounds: z.number().int().min(1).max(26),
  letters: z.string().regex(/^[a-z]*$/),
  alliteration: z.boolean(),
})
export type GameConfig = z.infer<typeof GameConfigSchema>

// One player's answers for a round, keyed by category
export const AnswersSchema = z.record(z.string(), z.string())
export type Answers = z.infer<typeof AnswersSchema>

// Every player's answers for a round, keyed by player ID
export const RoundAnswersSchema = z.record(z.string(), AnswersSchema)
export type RoundAnswers = z.infer<typeof RoundAnswersSchema>

export const ScoreSchema = z.number().int().min(0)
export type Score = z.infer<typeof ScoreSchema>

// Keyed by player ID, then category
export const ScoresSchema = z.record(z.string(), z.record(z.string(), ScoreSchema))
export type Scores = z.infer<typeof ScoresSchema>

// The category each player is on, keyed by player ID
export const OpponentProgressSchema = z.record(z.string(), z.string())
export type OpponentProgress = z.infer<typeof OpponentProgressSchema>

export const RoundSchema = z.object({
  index: z.number().int().min(0),
  letter: z.string().regex(/^[a-z]$/),
  timeStarted: z.number(),
  timeEnded: z.number().nullish(),
  stopperId: z.string().nullish(),
  opponentProgress: OpponentProgressSchema.nullable(),
  answers: RoundAnswersSchema,
  scores: ScoresSchema,
})
export type Round = z.infer<typeof RoundSchema>

// Total score per player ID
export const FinalScoresSchema = z.record(z.string(), z.number())
export type FinalScores = z.infer<typeof FinalScoresSchema>

export const GameStateSchema = z.object({
  stage: GameStageSchema,
  finalScores: FinalScoresSchema.optional(),
  nextGameId: z.string().optional(),
})
export type GameState = z.infer<typeof GameStateSchema>

export const GameSchema = z.object({
  id: z.string(),
  state: GameStateSchema,
  config: GameConfigSchema,
  currentRound: RoundSchema.nullable(),
  previousRounds: z.array(RoundSchema).nullable(),
  players: z.array(PlayerSchema),
})
export type Game = z.infer<typeof GameSchema>
