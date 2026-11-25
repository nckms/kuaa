import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import type { ExamAttempt, ExamSummary } from '../types/exams'

export function useExams() {
  return useQuery({ queryKey: ['exams'], queryFn: async () => (await api.get<{ exams: ExamSummary[] }>('/exams/enem')).data.exams })
}

export function useStartExam() {
  return useMutation({
    mutationFn: async ({ year, day }: { year: number; day: number }) => (await api.post<{ id: string }>(`/exams/enem/${year}/${day}/start`)).data,
  })
}

export function useExamAttempt(id: string) {
  return useQuery({ queryKey: ['exam-attempt', id], enabled: Boolean(id), queryFn: async () => (await api.get<ExamAttempt>(`/exams/attempts/${id}`)).data })
}

export function useExamActions(id: string) {
  const qc = useQueryClient()
  return {
    answer: useMutation({ mutationFn: async (v: { questionId: string; optionId: string }) => { await api.patch(`/exams/attempts/${id}/answer`, v) } }),
    flag: useMutation({ mutationFn: async (questionId: string) => { await api.patch(`/exams/attempts/${id}/flag`, { questionId }) } }),
    finish: useMutation({
      mutationFn: async () => (await api.post(`/exams/attempts/${id}/finish`)).data,
      onSuccess: async () => { await Promise.all([qc.invalidateQueries({ queryKey: ['exam-attempt', id] }), qc.invalidateQueries({ queryKey: ['exams'] })]) },
    }),
  }
}

export async function fetchExamExplanation(id: string, questionId: string) {
  return (await api.get<{ explanation: string | null; explanationByAi: boolean }>(`/exams/attempts/${id}/questions/${questionId}/explanation`)).data
}
