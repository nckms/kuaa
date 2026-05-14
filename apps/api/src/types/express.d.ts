import type { SafeUser } from './index'

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser
      userId?: string
    }
  }
}
