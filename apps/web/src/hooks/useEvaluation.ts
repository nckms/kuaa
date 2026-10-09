import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { useAuthStore } from '../stores/auth.store'

export interface Evaluation {
  id: string
  answers: number[]
  score: number
  feedback: string | null
  createdAt: string
  updatedAt: string
}

export interface EvaluationInput {
  answers: number[]
  feedback?: string
  consent: true
}

export function useEvaluation() {
  const userId = useAuthStore((state) => state.user?.id)
  const client = useQueryClient()
  const queryKey = ['evaluation', 'me', userId] as const
  const query = useQuery({
    queryKey,
    enabled: !!userId,
    queryFn: async ({ signal }) => (await api.get<Evaluation | null>('/evaluation/me', { signal })).data,
  })
  const save = useMutation({
    mutationFn: async (input: EvaluationInput) => {
      if (!userId || useAuthStore.getState().user?.id !== userId) throw new Error('Sessao alterada')
      return (await api.post<Evaluation>('/evaluation/me', input)).data
    },
    onSuccess: (data) => {
      if (useAuthStore.getState().user?.id === userId) client.setQueryData(queryKey, data)
    },
  })
  return { query, save }
}
