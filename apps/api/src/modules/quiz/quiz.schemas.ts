import { z } from 'zod'

export const GenerateSchema = z.object({
  topicId: z.string().cuid(),
  count: z.number().int().min(3).max(15).default(5),
})

export const AnswerSchema = z.object({
  questionId: z.string().cuid(),
  optionId: z.string().length(1).regex(/^[A-E]$/),
  timeSpentMs: z.number().int().min(0).max(300000),
})

export type GenerateInput = z.infer<typeof GenerateSchema>
export type AnswerInput = z.infer<typeof AnswerSchema>
