import type { User } from '@prisma/client'

export type SafeUser = Omit<User, 'passwordHash'>
export type PublicUser = Omit<User, 'passwordHash' | 'stripeCustomerId' | 'signupSource' | 'referredById'>
