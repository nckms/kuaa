import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import type { TrailData } from '../types/trail'

export function useTrail(vestibularSlug: string) {
  return useQuery({
    queryKey: ['trail', vestibularSlug],
    queryFn: async () => {
      const res = await api.get<TrailData>(`/trail/${vestibularSlug}`)
      return res.data
    },
    enabled: !!vestibularSlug,
  })
}
