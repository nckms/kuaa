import { describe, expect, it } from 'vitest'
import { QuestionMediaSchema, readQuestionMedia } from '../modules/quiz/questionMedia'
import { validateGeneratedQuestions } from '../modules/quiz/fewShot'
import { generateCuratedQuestions } from '../modules/quiz/curatedQuestions'

const visual = { type: 'bar' as const, title: 'Empréstimos', xLabel: 'Semana', yLabel: 'Livros',
  points: [{ label: '1', value: 20 }, { label: '2', value: 30 }] }

describe('question figures', () => {
  it('accepts hosted images and local figures, rejecting executable and insecure URLs', () => {
    for (const imageUrl of ['https://example.org/grafico.png', '/question-media/cadeia-alimentar.svg']) {
      expect(QuestionMediaSchema.parse({ imageUrl, imageAlt: 'Figura de teste' }).imageUrl).toBe(imageUrl)
    }
    for (const imageUrl of ['javascript:alert(1)', 'data:image/svg+xml,<svg/>', 'http://example.org/a.png', '//evil.org/a.png', '/question-media/../a.svg']) {
      expect(QuestionMediaSchema.safeParse({ imageUrl }).success).toBe(false)
    }
  })
  it('bounds graph payloads and keeps missing media backward compatible', () => {
    expect(QuestionMediaSchema.parse({ visual }).visual).toEqual(visual)
    expect(QuestionMediaSchema.safeParse({ visual: { ...visual, points: [{ label: '1', value: Infinity }] } }).success).toBe(false)
    expect(readQuestionMedia(null, null)).toEqual({ imageUrl: null })
  })
  it('keeps chart data during AI validation and authorial fallback selection', () => {
    const question = { body: 'Qual semana apresentou maior número de empréstimos?', explanation: 'A segunda semana apresenta trinta empréstimos, mais que os vinte da primeira.',
      options: ['1', '2', '3', '4', '5'].map((text, index) => ({ id: 'ABCDE'[index], text, isCorrect: index === 1 })), difficulty: 1, visual }
    expect(validateGeneratedQuestions({ questions: [question] }, 1)[0]?.visual).toEqual(visual)
    const fallback = generateCuratedQuestions({ topicName: 'Funções e Gráficos', questionCount: 15, userMasteryLevel: 1 })
    expect(fallback.some((item) => item.visual?.type === 'line')).toBe(true)
  })
})
