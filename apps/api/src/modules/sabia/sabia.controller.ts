import type { Request, Response, NextFunction } from 'express'
import { makeError } from '../../utils/errors'
import { askSabia } from './sabia.service'
import type { ChatMessage } from './sabia.service'

interface AskBody {
  message?: unknown
  history?: unknown
}

function isValidRole(role: unknown): role is 'user' | 'assistant' {
  return role === 'user' || role === 'assistant'
}

export async function ask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message, history } = req.body as AskBody

    if (typeof message !== 'string' || !message.trim()) {
      throw makeError('O campo message é obrigatório e deve ser uma string não vazia.', 400, 'INVALID_INPUT')
    }
    if (message.trim().length > 2000) {
      throw makeError('Mensagem muito longa (máximo 2000 caracteres).', 400, 'MESSAGE_TOO_LONG')
    }

    // Valida e sanitiza o histórico
    const validatedHistory: ChatMessage[] = []
    if (Array.isArray(history)) {
      for (const item of history) {
        if (item !== null && typeof item === 'object') {
          const entry = item as Record<string, unknown>
          if (isValidRole(entry.role) && typeof entry.content === 'string' && entry.content.trim()) {
            validatedHistory.push({
              role: entry.role,
              content: String(entry.content).slice(0, 2000),
            })
          }
        }
      }
    }
    // Limita histórico a últimas 20 mensagens para não estourar contexto
    const trimmedHistory = validatedHistory.slice(-20)

    const reply = await askSabia(message.trim(), trimmedHistory)
    res.json({ reply })
  } catch (err) {
    next(err)
  }
}
