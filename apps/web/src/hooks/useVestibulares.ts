import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import type { Vestibular } from '../types/trail'

export function useVestibulares() {
  return useQuery({
    queryKey: ['vestibulares'],
    queryFn: async () => {
      const res = await api.get<Vestibular[]>('/vestibulares')
      return res.data
    },
  })
}

export function useVestibular(slug: string) {
  return useQuery({
    queryKey: ['vestibulares', slug],
    queryFn: async () => {
      const res = await api.get<Vestibular>(`/vestibulares/${slug}`)
      return res.data
    },
    enabled: !!slug,
  })
}
