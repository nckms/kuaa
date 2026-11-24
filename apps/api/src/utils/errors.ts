export class AppError extends Error {
  constructor(message: string, public statusCode: number, public code: string) {
    super(message)
    this.name = 'AppError'
  }
}

export function makeError(message: string, statusCode: number, code = 'ERROR'): AppError {
  return new AppError(message, statusCode, code)
}
