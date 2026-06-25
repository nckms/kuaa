export interface QuizOption {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  body: string
  imageUrl?: string
  options: QuizOption[]
  difficulty: number
}

export interface SessionData {
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

export interface ReviewQuestion {
  id: string
  body: string
  options: Array<QuizOption & { isCorrect: boolean }>
  userAnswerId: string
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
