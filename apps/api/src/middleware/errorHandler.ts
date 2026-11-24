import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../utils/errors'

interface ApiError extends Error {
  statusCode?: number
  code?: string
}

interface ErrorResponse {
  error: string
  code: string
  statusCode: number
  details?: unknown
  requestId?: string
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

  const suppliedStatus = err.statusCode
  const statusCode = suppliedStatus && suppliedStatus >= 400 && suppliedStatus <= 599 ? suppliedStatus : 500
  const internal = statusCode >= 500
  const expected = err instanceof AppError
  const response: ErrorResponse = {
    error: expected ? err.message : (internal ? 'Erro interno do servidor. Tente novamente.' : 'Requisicao invalida'),
    code: expected ? err.code : (internal ? 'INTERNAL_ERROR' : 'INVALID_REQUEST'),
    statusCode,
    requestId: res.locals.requestId,
  }

  // Do not log exception messages/stacks: database/provider errors may contain user data.
  console.error(JSON.stringify({ event: 'request_error', requestId: res.locals.requestId, statusCode }))

  res.status(statusCode).json(response)
}
