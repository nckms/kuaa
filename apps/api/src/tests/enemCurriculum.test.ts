import { describe, expect, it } from 'vitest'
import { ENEM_SUBJECTS } from '../data/enem-curriculum'
import { getCuratedQuestions } from '../modules/quiz/curatedQuestions'

describe('ENEM study coverage', () => {
  it('provides all components with unique persistence keys and an authorial reserve', () => {
    expect(ENEM_SUBJECTS.map((subject) => subject.slug)).toEqual(expect.arrayContaining([
      'linguagens', 'matematica', 'fisica', 'quimica', 'biologia', 'historia', 'geografia',
      'filosofia', 'sociologia', 'ingles', 'espanhol', 'artes', 'educacao-fisica', 'redacao',
    ]))
    expect(new Set(ENEM_SUBJECTS.map((subject) => subject.slug)).size).toBe(ENEM_SUBJECTS.length)
    expect(new Set(ENEM_SUBJECTS.map((subject) => subject.order)).size).toBe(ENEM_SUBJECTS.length)
    expect(ENEM_SUBJECTS.reduce((sum, subject) => sum + subject.weight, 0)).toBeCloseTo(1)
    for (const subject of ENEM_SUBJECTS) {
      expect(new Set(subject.topics.map((topic) => topic.order)).size).toBe(subject.topics.length)
      for (const topic of subject.topics) {
        expect(getCuratedQuestions(topic.name).length, topic.name).toBeGreaterThanOrEqual(3)
      }
    }
  })
  it('preserves the names and order used by existing learner progress', () => {
    const legacy = [
      ['linguagens', ['Interpretação de Texto', 'Literatura Brasileira', 'Gramática e Norma Culta', 'Produção Textual']],
      ['matematica', ['Funções e Gráficos', 'Geometria Plana e Espacial', 'Probabilidade e Estatística', 'Progressões e Sequências']],
      ['ciencias-natureza', ['Cinemática e Dinâmica', 'Termologia e Óptica', 'Química Orgânica', 'Biologia Celular e Genética']],
      ['ciencias-humanas', ['História do Brasil República', 'Geopolítica Mundial', 'Filosofia e Sociologia', 'Geografia Física e Humana']],
    ] as const
    for (const [slug, names] of legacy) {
      expect(ENEM_SUBJECTS.find((subject) => subject.slug === slug)?.topics.slice(0, 4).map((topic) => topic.name)).toEqual(names)
    }
  })
})
