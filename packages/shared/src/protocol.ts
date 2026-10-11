import { z } from 'zod'

import {
  AnswersSchema,
  GameConfigSchema,
  GameSchema,
  PlayerSchema,
  ScoreSchema,
  TextSchema,
} from './schemas'

const message = <T extends string, S extends z.ZodRawShape = {}>(type: T, shape?: S) =>
  z.object({ type: z.literal(type), ...shape } as { type: z.ZodLiteral<T> } & S)

// Sent by a browser over the game's socket. The socket is bound to the player
// ID it joined with, so messages that edit "my" data carry no player ID.
export const ClientMessageSchema = z.discriminatedUnion('type', [
  message('create', { player: PlayerSchema }),
  message('join', { player: PlayerSchema }),
  message('leave'),
  message('rename', { name: TextSchema.min(1) }),
  // Each field given replaces the current value as a whole
  message('updateConfig', {
    config: GameConfigSchema.pick({ letters: true, numRounds: true, alliteration: true })
      .partial()
      .strict(),
  }),
  // Adds the category if absent, removes it if present
  message('toggleCategory', { category: TextSchema.min(1) }),
  message('start'),
  message('cancelStart'),
  message('saveAnswer', { category: TextSchema.min(1), answer: TextSchema }),
  message('setProgress', { category: TextSchema.min(1) }),
  // Ends the round early; the sender becomes the stopper
  message('stop'),
  // Any player can change any player's score during review
  message('setScore', {
    playerId: TextSchema.min(1),
    category: TextSchema.min(1),
    score: ScoreSchema,
  }),
])
export type ClientMessage = z.infer<typeof ClientMessageSchema>

export const ErrorCodeSchema = z.enum(['notFound', 'invalid', 'forbidden', 'refused'])
export type ErrorCode = z.infer<typeof ErrorCodeSchema>

export const ServerMessageSchema = z.discriminatedUnion('type', [
  // Full game state, broadcast on every change. Other players' answers are
  // left out until review.
  message('state', { game: GameSchema }),
  // The receiving player's own saved answers, sent when they (re)join during an
  // active round so a reload restores their inputs
  message('answers', { answers: AnswersSchema }),
  message('error', { code: ErrorCodeSchema, message: z.string() }),
])
export type ServerMessage = z.infer<typeof ServerMessageSchema>
