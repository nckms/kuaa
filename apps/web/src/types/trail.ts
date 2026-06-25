export interface TopicProgress {
  masteryLevel: number
  unlocked: boolean
  completed: boolean
  sessionsCount: number
  answeredQuestionsCount: number
  correctAnswersCount: number
  wrongAnswersCount: number
  accuracy: number | null
  lastSeenAt: string | null
}

export interface TrailTopic {
  id: string
  name: string
  description: string
  order: number
  xpReward: number
  progress: TopicProgress
}

export interface TrailSubject {
  id: string
  name: string
  slug: string
  iconSlug: string
  order: number
  topics: TrailTopic[]
}

export interface TrailData {
  vestibular: { id: string; slug: string; name: string; institution: string }
  subjects: TrailSubject[]
  summary: {
    totalTopics: number
    unlockedTopics: number
    answeredTopics: number
    inProgressTopics: number
    completedTopics: number
    totalSessions: number
    finishedSessions: number
    answeredQuestions: number
    correctAnswers: number
    wrongAnswers: number
    accuracy: number | null
    studyTimeMs: number
    weeklyAnsweredQuestions: number[]
    totalXpEarned: number
    knowledgeGaps: KnowledgeGap[]
  }
}

export interface KnowledgeGap {
  topicId: string
  topicName: string
  subjectName: string
  wrongAnswers: number
  totalAnswers: number
  accuracy: number
  lastAnsweredAt: string | null
}

export interface Vestibular {
  id: string
  slug: string
  name: string
  institution: string
  state: string
  description: string
  logoUrl: string | null
  year: number
  active: boolean
}
