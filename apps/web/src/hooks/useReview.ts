import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export interface ReviewTopic { topicId: string; topicName: string; subjectName: string; due: number; open: number }
export interface ReviewItemSummary {
  id: string; topicId: string; topicName: string; subjectName: string; preview: string; origin: string | null
  dueAt: string; lastWrongAt: string; timesWrong: number; correctStreak: number
}
export interface ReviewOverview { due: number; open: number; resolved: number; topics: ReviewTopic[]; items: ReviewItemSummary[] }

export function useReviewOverview() {
  return useQuery({ queryKey: ['review'], queryFn: async () => (await api.get<ReviewOverview>('/review')).data, staleTime: 30_000 })
}

export function useStartReview() {
  return useMutation({ mutationFn: async (topicId: string) => (await api.post<{ sessionId: string }>(`/review/${topicId}/start`)).data })
}
