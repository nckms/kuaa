import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { useAuthStore } from '../stores/auth.store'

/** "Me avise quando o Plus abrir" — mede intenção de compra antes da venda. */
export default function InterestButton({ source, compact = false }: { source: string; compact?: boolean }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const queryClient = useQueryClient()
  const interest = useQuery({
    queryKey: ['plus-interest'], enabled: isAuthenticated, staleTime: 5 * 60_000,
    queryFn: async () => (await api.get<{ registered: boolean }>('/billing/interest')).data,
  })
  const register = useMutation({
    mutationFn: async () => (await api.post('/billing/interest', { source })).data,
    onSuccess: () => queryClient.setQueryData(['plus-interest'], { registered: true }),
  })
  if (!isAuthenticated) return null
  if (interest.data?.registered) return <span className="k-muted" style={{ fontSize: compact ? 13 : 14 }} role="status"><i className="bi bi-check2-circle" aria-hidden="true" /> Você será avisado quando o Plus abrir.</span>
  return <button type="button" className={`k-btn k-btn-outline ${compact ? 'is-sm' : ''}`} disabled={register.isPending || interest.isLoading} onClick={() => register.mutate()}>
    <i className="bi bi-bell" aria-hidden="true" />{register.isPending ? 'Salvando…' : 'Me avise quando abrir'}
  </button>
}
