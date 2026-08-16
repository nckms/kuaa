export interface SimuladoOption {
  id: string
  text: string
}

export interface SimuladoQuestion {
  id: string
  order: number
  subjectId: string
  subjectName: string
  subjectSlug: string
  body: string
  options: SimuladoOption[]
}

export interface SimuladoAttempt {
  id: string
  vestibularName: string
  weekStart: string
  startedAt: string
  finishedAt: string | null
  questions: SimuladoQuestion[]
  answers: Record<string, string>
  flagged: string[]
  score: number | null
  correct: number | null
  wrong: number | null
  totalSeconds: number
  nextWeekStart: string
}

export interface FinishResult {
  score: number
  correct: number
  wrong: number
  total: number
  finishedAt: string
}
