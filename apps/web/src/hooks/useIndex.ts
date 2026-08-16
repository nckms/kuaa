import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import type { IndexData } from '../types/index'

export function useIndex(vestibularSlug: string) {
  return useQuery({
    queryKey: ['index', vestibularSlug],
    queryFn: async () => {
      const res = await api.get<IndexData>(`/index/${vestibularSlug}`)
      return res.data
    },
    enabled: !!vestibularSlug,
  })
}
