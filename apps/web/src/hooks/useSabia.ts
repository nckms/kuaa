import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AskPayload {
  message: string
  history: ChatMessage[]
}

interface AskResponse {
  reply: string
}

export function useSabia() {
  return useMutation({
    mutationFn: async ({ message, history }: AskPayload) => {
      const res = await api.post<AskResponse>('/sabia/ask', { message, history })
      return res.data
    },
  })
}
