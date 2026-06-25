import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import type { GenerateResult, JobStatus, SessionData, AnswerResult, SessionSummary } from '../types/quiz'

export function useGenerateQuiz() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (data: { topicId: string; count?: number }) => {
      const res = await api.post<GenerateResult>('/quiz/generate', data)
      return res.data
    },
    onSuccess: (data) => {
      navigate(`/quiz/loading/${data.sessionId}?jobId=${data.jobId}`)
    },
  })
}

export function useJobStatus(jobId: string | null, sessionId: string | null) {
  return useQuery({
    queryKey: ['quizJob', jobId, sessionId],
    queryFn: async () => {
      const res = await api.get<JobStatus>(`/quiz/job/${jobId}?sessionId=${sessionId}`)
      return res.data
    },
    enabled: !!jobId && !!sessionId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data || data.status === 'pending') return 2000
      return false
    },
  })
}

export function useSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['quizSession', sessionId],
    queryFn: async () => {
      const res = await api.get<SessionData>(`/quiz/${sessionId}`)
      return res.data
    },
    enabled: !!sessionId,
    staleTime: Infinity,
    retry: false,
  })
}

export function useSessionSummary(sessionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['quizSummary', sessionId],
    queryFn: async () => {
      const res = await api.get<SessionSummary>(`/quiz/${sessionId}/summary`)
      return res.data
    },
    enabled: !!sessionId && enabled,
    retry: false,
  })
}

export function useAnswer(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { questionId: string; optionId: string; timeSpentMs: number }) => {
      const res = await api.post<AnswerResult>(`/quiz/${sessionId}/answer`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trail'] })
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export function useFinish(sessionId: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await api.post<SessionSummary>(`/quiz/${sessionId}/finish`)
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trail'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      queryClient.setQueryData(['quizSummary', sessionId], data)
      navigate(`/resultado/${sessionId}`, { state: data, replace: true })
    },
  })
}
