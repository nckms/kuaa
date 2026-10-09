import { describe, expect, it } from 'vitest'
import { buildFewShotContext, selectReferences, validateGeneratedQuestions } from '../modules/quiz/fewShot'
import type { GenerationJobData } from '../modules/quiz/quiz.types'

const data: GenerationJobData = {
  sessionId: 'session', userId: 'user', topicId: 'topic', topicName: 'Matematica',
  subjectName: 'Matematica', vestibularName: 'ENEM', vestibularSlug: 'enem',
  userMasteryLevel: 1, recentErrorTopics: [], questionCount: 1,
}
const question = {
  body: 'Uma caixa tem 2 bolas azuis e 3 vermelhas. Qual a probabilidade de retirar uma azul?',
  options: ['2/5', '3/5', '1/5', '4/5', '1'].map((text, index) => ({ id: 'ABCDE'[index], text, isCorrect: index === 0 })),
  explanation: 'Ha duas bolas azuis entre cinco bolas ao todo. A probabilidade e 2/5.', difficulty: 1,
}

describe('few-shot e validacao estrutural', () => {
  it.each(['enem', 'fuvest', 'unicamp'])('seleciona referencias rastreaveis de %s', (exam) => {
    const input = { ...data, vestibularSlug: exam }
    const selected = selectReferences(input)
    expect(selected.length).toBeGreaterThanOrEqual(2)
    expect(selected.every((ref) => ref.vestibularSlug === exam && ref.sourceUrl.startsWith('https://'))).toBe(true)
    const context = buildFewShotContext(input, selected)
    expect(context).toContain(selected[0].body)
    expect(context).toContain(selected[0].explanation)
  })
  it('aceita resposta valida com quantidade exata', () => {
    expect(validateGeneratedQuestions({ questions: [question] }, 1)).toHaveLength(1)
  })
  it('rejeita quantidade errada, alternativas duplicadas e gabaritos ambiguos', () => {
    expect(() => validateGeneratedQuestions({ questions: [question] }, 2)).toThrow()
    expect(() => validateGeneratedQuestions({ questions: [{ ...question, options: question.options.map((o) => ({ ...o, isCorrect: true })) }] }, 1)).toThrow()
    expect(() => validateGeneratedQuestions({ questions: [{ ...question, options: question.options.map((o) => ({ ...o, text: 'duplicada' })) }] }, 1)).toThrow()
  })
  it('rejeita copia literal, repeticao e quantidade errada de alternativas', () => {
    expect(() => validateGeneratedQuestions({ questions: [question, question] }, 2)).toThrow()
    expect(() => validateGeneratedQuestions({ questions: [question] }, 1, [], 4)).toThrow()
    const selected = selectReferences(data)
    expect(() => validateGeneratedQuestions({ questions: [{ ...question, body: selected[0].body }] }, 1, selected)).toThrow()
  })
})
