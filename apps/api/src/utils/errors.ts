interface AppError extends Error {
  statusCode: number
  code: string
}

export function makeError(message: string, statusCode: number, code = 'ERROR'): AppError {
  const err = new Error(message) as AppError
  err.statusCode = statusCode
  err.code = code
  return err
}
