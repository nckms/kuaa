import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import type { RankingData } from '../types/ranking'

export function useRanking(vestibularSlug: string) {
  return useQuery({
    queryKey: ['ranking', vestibularSlug],
    queryFn: async () => {
      const res = await api.get<RankingData>(`/ranking/${vestibularSlug}`)
      return res.data
    },
    enabled: !!vestibularSlug,
  })
}
