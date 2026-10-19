export interface QuizOption {
  id: string
  text: string
}

export interface QuestionVisual {
  type: 'line' | 'bar'
  title: string
  xLabel: string
  yLabel: string
  points: Array<{ label: string; value: number }>
}

export interface QuestionMediaData {
  imageUrl?: string | null
  imageAlt?: string | null
  imageCaption?: string | null
  visual?: QuestionVisual | null
}

export interface QuizQuestion extends QuestionMediaData {
  id: string
  body: string
  options: QuizOption[]
  difficulty: number
}

export interface SessionData {
  generation?: { source: 'AI_GENERATED' | 'CURATED'; promptVersion?: string; referenceIds?: string[] } | null
  sessionId: string
  topicId: string
  topicName: string
  subjectName: string
  vestibularName: string
  vestibularSlug: string
  questions: QuizQuestion[]
  answeredIds: string[]
  answeredResults: Array<AnswerResult & { questionId: string }>
}

export interface AnswerResult {
  isCorrect: boolean
  selectedOptionId: string
  correctOptionId: string
  explanation: string
  xpDelta: number
  heartsRemaining: number
  masteryLevel: number
}

export interface AchievementData {
  slug: string
  name: string
  description: string
  iconSlug: string
  xpBonus: number
}

export interface ReviewQuestion extends QuestionMediaData {
  id: string
  body: string
  options: Array<QuizOption & { isCorrect: boolean }>
  userAnswerId: string | null
  isCorrect: boolean
  explanation: string
}

export interface SessionSummary {
  sessionId: string
  topicName: string
  vestibularSlug: string
  xpEarned: number
  correct: number
  wrong: number
  skipped: number
  isPerfect: boolean
  accuracy: number
  newMasteryLevel: number
  performance?: {
    previousLevel: number
    newLevel: number
    evidenceCount: number
    pendingAnswers: number
    accuracy: number | null
    decision: 'advance' | 'reinforce' | 'maintain' | 'collect'
    reason: string
  } | null
  newAchievements: AchievementData[]
  levelUp: boolean
  newLevel: number
  questions: ReviewQuestion[]
}

export interface JobStatus {
  status: 'pending' | 'ready' | 'error'
  sessionId?: string
  message?: string
}

export interface GenerateResult {
  jobId: string
  sessionId: string
}
