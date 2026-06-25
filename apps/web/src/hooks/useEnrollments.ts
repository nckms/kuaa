import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import type { Vestibular } from '../types/trail'
import { useAuthStore } from '../stores/auth.store'

export interface EnrollmentItem {
  enrollment: { id: string; vestibularId: string; enrolledAt: string }
  vestibular: Vestibular
  progress: { totalTopics: number; completedTopics: number; progressPercent: number }
}

export interface EnrollResult {
  enrollment: { id: string; vestibularId: string; enrolledAt: string }
  vestibular: Vestibular
}

export function useMyEnrollments() {
  return useQuery({
    queryKey: ['enrollments', 'me'],
    queryFn: async () => {
      const res = await api.get<EnrollmentItem[]>('/enrollments/me')
      return res.data
    },
  })
}

export function useEnroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vestibularId: string) => {
      const res = await api.post<EnrollResult>('/enrollments', { vestibularId })
      return res.data
    },
    onSuccess: (data) => {
      const current = useAuthStore.getState().enrollments
      const nextEnrollment = {
        id: data.enrollment.id,
        vestibularId: data.enrollment.vestibularId,
        vestibular: { slug: data.vestibular.slug, name: data.vestibular.name },
      }
      const exists = current.some((item) => item.vestibularId === nextEnrollment.vestibularId)
      const enrollments = exists
        ? current.map((item) => (item.vestibularId === nextEnrollment.vestibularId ? nextEnrollment : item))
        : [...current, nextEnrollment]

      useAuthStore.setState({
        enrollments,
        firstVestibularSlug: enrollments[0]?.vestibular.slug ?? null,
      })
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['trail'] })
    },
  })
}

export function useUnenroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      await api.delete(`/enrollments/${enrollmentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['trail'] })
    },
  })
}
