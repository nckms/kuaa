import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

interface ApiError extends Error {
  statusCode?: number
  code?: string
}

interface ErrorResponse {
  error: string
  code: string
  statusCode: number
  details?: unknown
}

export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const response: ErrorResponse = {
      error: 'Dados inválidos',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: err.flatten().fieldErrors,
    }
    res.status(400).json(response)
    return
  }

  const statusCode = err.statusCode ?? 500
  const response: ErrorResponse = {
    error: err.message || 'Erro interno do servidor',
    code: err.code ?? 'INTERNAL_ERROR',
    statusCode,
  }

  console.error('[Error]', err.message, err.stack)

  res.status(statusCode).json(response)
}
