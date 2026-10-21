import type { PerformanceSummary } from '../../services/adaptive/PerformanceEngine'
import type { QuestionMediaData } from './questionMedia'
import type { Prisma } from '@prisma/client'

export interface QuestionOption {
  id: string       // "A" | "B" | "C" | "D" | "E"
  text: string
  isCorrect: boolean
}

export interface GeneratedQuestion extends QuestionMediaData {
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
  vestibularSlug?: string
  targetDifficulty?: number
  userMasteryLevel: number
  recentErrorTopics: string[]
  recentQuestionBodies?: string[]
  questionCount: number
  remediation?: {
    sourceQuestionId: string
    questionBody: string
    selectedOptionText: string
    correctOptionText: string
    explanation: string
  }
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

export interface SessionSummary {
  generation: Prisma.JsonValue | null
  sessionId: string
  topicId: string
  topicName: string
  guideAvailable: boolean
  vestibularSlug: string
  xpEarned: number
  correct: number
  wrong: number
  skipped: number
  isPerfect: boolean
  accuracy: number
  newMasteryLevel: number
  performance: PerformanceSummary | null
  newAchievements: AchievementData[]
  levelUp: boolean
  newLevel: number
  questions: ReviewQuestion[]
}

export interface ReviewQuestion extends QuestionMediaData {
  id: string
  body: string
  options: QuestionOption[]
  userAnswerId: string | null
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
