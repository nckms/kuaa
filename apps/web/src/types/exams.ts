import type { SimuladoQuestion } from './simulado'

export interface ExamSummary {
  year: number
  day: number
  area: string
  questions: number
  durationSeconds: number
  attempts: number
  last: { id: string; finished: boolean; correct: number | null; total: number; startedAt: string } | null
}

export interface ExamQuestion extends Omit<SimuladoQuestion, 'subjectId'> {
  origin?: string | null
  explanationByAi?: boolean
  difficulty?: number | null
}

export interface ExamAttempt {
  id: string
  year: number
  day: number
  area: string
  language: string | null
  vestibularName: string
  startedAt: string
  finishedAt: string | null
  totalSeconds: number
  answers: Record<string, string>
  flagged: string[]
  correct: number | null
  wrong: number | null
  questions: ExamQuestion[]
}
