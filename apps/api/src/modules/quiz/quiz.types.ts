export interface QuestionOption {
  id: string       // "A" | "B" | "C" | "D" | "E"
  text: string
  isCorrect: boolean
}

export interface GeneratedQuestion {
  body: string
  options: QuestionOption[]
  explanation: string
  difficulty: number  // 1-5
}

export interface GenerationJobData {
  sessionId: string
  userId: string
  topicId: string
  topicName: string
  subjectName: string
  vestibularName: string
  userMasteryLevel: number
  recentErrorTopics: string[]
  questionCount: number
}

export interface AnswerResult {
  isCorrect: boolean
  correctOptionId: string
  explanation: string
  xpDelta: number
  heartsRemaining: number
  masteryLevel: number
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

export interface ReviewQuestion {
  id: string
  body: string
  options: QuestionOption[]
  userAnswerId: string
  isCorrect: boolean
  explanation: string
}

export interface AchievementData {
  slug: string
  name: string
  description: string
  iconSlug: string
  xpBonus: number
}
