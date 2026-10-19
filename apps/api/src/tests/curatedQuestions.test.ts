import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { curatedQuestions, getCuratedQuestions, generateCuratedQuestions } from '../modules/quiz/curatedQuestions'
import { ENEM_SUBJECTS } from '../data/enem-curriculum'

describe('banco autoral de reserva', () => {
  it('prioriza questoes ainda nao vistas', () => {
    const topicName = 'Interpretação de Texto'
    const bank = getCuratedQuestions(topicName)
    const unseen = bank[2]!
    const selected = generateCuratedQuestions({ topicName, userMasteryLevel: 1, questionCount: 1,
      recentQuestionBodies: bank.slice(0, 2).map((question) => question.body) })
    expect(selected[0]!.body).toBe(unseen.body)
  })
  it('inclui figura pertinente ainda nao vista sem duplicar questoes', () => {
    const selected = generateCuratedQuestions({ topicName: 'Mecânica, Trabalho e Energia', userMasteryLevel: 1, questionCount: 3 })
    expect(selected.some((question) => question.visual)).toBe(true)
    expect(new Set(selected.map((question) => question.body)).size).toBe(selected.length)
  })
  it('cobre todos os topicos publicados pelo seed', () => {
    const seed = readFileSync('prisma/seed.ts', 'utf8')
    const topics = [...ENEM_SUBJECTS.flatMap((subject) => subject.topics.map((topic) => topic.name)),
      ...[...seed.matchAll(/\{ name: '([^']+)', description:/g)].map((match) => match[1]!)]
    expect(topics.length).toBeGreaterThan(37)
    for (const topic of topics) expect(getCuratedQuestions(topic).length, topic).toBeGreaterThan(0)
  })
  it('possui identificadores e enunciados unicos, com um gabarito por questao', () => {
    expect(new Set(curatedQuestions.map((q) => q.id)).size).toBe(curatedQuestions.length)
    expect(new Set(curatedQuestions.map((q) => q.body)).size).toBe(curatedQuestions.length)
    for (const q of curatedQuestions) {
      expect(q.options).toHaveLength(5)
      expect(new Set(q.options.map((o) => o.id)).size).toBe(5)
      expect(new Set(q.options.map((o) => o.text)).size).toBe(5)
      expect(q.options.filter((o) => o.isCorrect)).toHaveLength(1)
      expect(q.explanation.length).toBeGreaterThan(30)
      expect(q.difficulty).toBeGreaterThanOrEqual(1)
      expect(q.difficulty).toBeLessThanOrEqual(5)
    }
  })
  it('nao preenche sessoes curtas com questoes repetidas', () => {
    const questions = generateCuratedQuestions({ topicName: 'Interpretação de Texto', userMasteryLevel: 1, questionCount: 10 })
    expect(questions).toHaveLength(3)
    expect(new Set(questions.map((q) => q.body)).size).toBe(questions.length)
  })
})
