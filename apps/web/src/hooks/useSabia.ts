import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { useAuthStore } from '../stores/auth.store'

export interface ChatMessage {
  id: string
  createdAt: string
  role: 'user' | 'assistant'
  content: string
}

interface AskPayload {
  message: string
  conversationId: string | null
}

interface AskResponse {
  conversationId: string
  reply: string
  messages: ChatMessage[]
}

export interface SabiaConversation {
  id: string
  title: string
  updatedAt: string
  _count: { messages: number }
}

export function useSabia(conversationId: string | null) {
  const userId = useAuthStore((state) => state.user?.id)
  const client = useQueryClient()
  const queryKey = ['sabia', userId, 'messages', conversationId]
  const conversationsKey = ['sabia', userId, 'conversations']
  const conversations = useQuery({
    queryKey: conversationsKey,
    enabled: !!userId,
    queryFn: async ({ signal }) => (await api.get<{ conversations: SabiaConversation[] }>('/sabia/conversations', { signal })).data.conversations,
  })
  const history = useQuery({
    queryKey,
    enabled: !!userId,
    queryFn: async ({ signal }) => conversationId
      ? (await api.get<{ messages: ChatMessage[] }>('/sabia/history', { signal, params: { conversationId } })).data.messages
      : [],
  })
  const mutation = useMutation({
    retry: false,
    mutationFn: async ({ message, conversationId: targetId }: AskPayload) => {
      await client.cancelQueries({ queryKey })
      const res = await api.post<AskResponse>('/sabia/ask', { message, conversationId: targetId }, { timeout: 65_000 })
      return res.data
    },
    onSuccess: (data) => {
      if (useAuthStore.getState().user?.id !== userId) return
      const savedKey = ['sabia', userId, 'messages', data.conversationId]
      client.setQueryData<ChatMessage[]>(savedKey, (previous = []) => [
        ...previous.filter((item) => !data.messages.some((saved) => saved.id === item.id)),
        ...data.messages,
      ])
      void client.invalidateQueries({ queryKey: savedKey })
      void client.invalidateQueries({ queryKey: conversationsKey })
    },
  })
  return { ...mutation, history, conversations }
}
