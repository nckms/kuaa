import { z } from 'zod'

const ImageUrlSchema = z.string().max(2000).refine((value) => {
  if (/^\/question-media\/[a-zA-Z0-9_/-]+\.(png|jpe?g|webp|svg)$/.test(value)) return true
  try { return new URL(value).protocol === 'https:' } catch { return false }
}, 'A imagem deve usar HTTPS ou um arquivo em /question-media/')

export const QuestionMediaSchema = z.object({
  imageUrl: ImageUrlSchema.nullish(),
  imageAlt: z.string().trim().min(1).max(2000).nullish(),
  imageCaption: z.string().trim().max(2000).nullish(),
  visual: z.object({
    type: z.enum(['line', 'bar']),
    title: z.string().trim().min(1).max(300),
    xLabel: z.string().trim().min(1).max(120),
    yLabel: z.string().trim().min(1).max(120),
    points: z.array(z.object({
      label: z.string().trim().min(1).max(120),
      value: z.number().finite().min(-1e9).max(1e9),
    })).min(2).max(40),
  }).nullish(),
})

export type QuestionMediaData = z.infer<typeof QuestionMediaSchema>

/** Also handles records and attempts that predate stored media. */
export function readQuestionMedia(imageUrl: string | null | undefined, media: unknown): QuestionMediaData {
  const parsed = QuestionMediaSchema.safeParse({
    ...(typeof media === 'object' && media !== null ? media : {}), imageUrl,
  })
  return parsed.success ? parsed.data : {}
}

export function getQuestionMedia(question: QuestionMediaData): QuestionMediaData {
  return QuestionMediaSchema.parse({ imageUrl: question.imageUrl, imageAlt: question.imageAlt,
    imageCaption: question.imageCaption, visual: question.visual })
}
