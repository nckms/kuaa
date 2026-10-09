export interface UserPreferences {
  dailyStudyMinutes: number
  reducedMotion: boolean
  highContrast: boolean
}

export interface User {
  activeVestibularId?: string | null
  preferences?: UserPreferences
  id: string
  email: string
  name: string
  school?: string
  city?: string
  state?: string
  avatarUrl?: string
  plan: 'FREE'
  xp: number
  level: number
  streakDays: number
  longestStreak: number
  hearts: number
  emailVerified: boolean
  createdAt: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}
