import { z } from 'zod'

export const evaluationSchema = z.object({
  answers: z.array(z.number().int().min(1).max(5)).length(10),
  feedback: z.string().max(2000).trim().optional(),
  consent: z.literal(true),
}).strict()

export type EvaluationInput = z.infer<typeof evaluationSchema>

export function calculateSusScore(answers: number[]): number {
  const validated = evaluationSchema.shape.answers.parse(answers)
  return validated.reduce((sum, answer, index) =>
    sum + (index % 2 === 0 ? answer - 1 : 5 - answer), 0) * 2.5
}
