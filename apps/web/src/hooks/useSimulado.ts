import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import type { SimuladoAttempt, FinishResult } from '../types/simulado'

function currentKey(slug: string) {
  return ['simulado', 'current', slug] as const
}

export function useCurrentSimulado(vestibularSlug: string) {
  return useQuery({
    queryKey: currentKey(vestibularSlug),
    queryFn: async () => {
      const res = await api.get<SimuladoAttempt | null>(`/simulado/${vestibularSlug}/current`)
      return res.data
    },
    enabled: !!vestibularSlug,
  })
}

export function useStartSimulado(vestibularSlug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<SimuladoAttempt>(`/simulado/${vestibularSlug}/start`)
      return res.data
    },
    onSuccess: (data) => {
      qc.setQueryData(currentKey(vestibularSlug), data)
    },
  })
}

export function useSaveAnswer() {
  return useMutation({
    mutationFn: async ({
      attemptId,
      questionId,
      optionId,
    }: {
      attemptId: string
      questionId: string
      optionId: string
    }) => {
      await api.patch(`/simulado/attempt/${attemptId}/answer`, { questionId, optionId })
    },
  })
}

export function useToggleFlag() {
  return useMutation({
    mutationFn: async ({ attemptId, questionId }: { attemptId: string; questionId: string }) => {
      await api.patch(`/simulado/attempt/${attemptId}/flag`, { questionId })
    },
  })
}

export function useFinishSimulado() {
  return useMutation({
    mutationFn: async (attemptId: string) => {
      const res = await api.post<FinishResult>(`/simulado/attempt/${attemptId}/finish`)
      return res.data
    },
  })
}
