import axios from 'axios'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import InterestButton from './InterestButton'

export interface QuotaInfo { message: string; upgrade?: string; quota?: string }

/** Lê a resposta 429 QUOTA_EXCEEDED da API (cota do plano esgotada). */
export function quotaInfo(error: unknown): QuotaInfo | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 429) return null
  const data = error.response.data as { code?: string; error?: string; upgrade?: string; quota?: string } | undefined
  if (data?.code !== 'QUOTA_EXCEEDED' || typeof data.error !== 'string') return null
  return { message: data.error, upgrade: data.upgrade, quota: data.quota }
}

/** Caminhos depois de esgotar a cota do gratuito: assinar (se a venda estiver aberta) ou pedir aviso, e o convite. */
export function QuotaActions({ quota }: { quota: QuotaInfo }) {
  const config = useQuery({
    queryKey: ['billing-config'], staleTime: 10 * 60_000,
    queryFn: async () => (await api.get<{ enabled: boolean }>('/billing/config')).data,
  })
  if (!quota.upgrade) return null
  return <div style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
    {config.data?.enabled
      ? <Link to={quota.upgrade} style={{ fontWeight: 600, textDecoration: 'underline' }}>Conhecer o Kuaa Plus</Link>
      : <InterestButton source={quota.quota ? `cota-${quota.quota}` : 'cota'} compact />}
    <Link to="/dashboard#convite" style={{ fontSize: 14, textDecoration: 'underline' }}>Ou ganhe 7 dias de Plus convidando um amigo</Link>
  </div>
}

/** Mensagem de erro que, se for cota esgotada, explica e aponta os caminhos. */
export function QuotaNotice({ error, fallback, className = 'k-alert' }: { error: unknown; fallback: string; className?: string }) {
  const quota = quotaInfo(error)
  if (!quota?.upgrade) {
    return <p role="alert" className={className} style={{ margin: 0 }}>{quota ? quota.message : fallback}</p>
  }
  return (
    <div role="alert" className={className} style={{ margin: 0, display: 'grid', gap: 8 }}>
      <span>{quota.message}</span>
      <QuotaActions quota={quota} />
    </div>
  )
}
