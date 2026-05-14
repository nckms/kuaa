export interface TopicProgress {
  masteryLevel: number
  unlocked: boolean
  completed: boolean
  sessionsCount: number
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
    completedTopics: number
    totalXpEarned: number
  }
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
