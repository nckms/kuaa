import axios from 'axios'
import { Link } from 'react-router-dom'

export interface QuotaInfo { message: string; upgrade?: string }

/** Lê a resposta 429 QUOTA_EXCEEDED da API (cota do plano esgotada). */
export function quotaInfo(error: unknown): QuotaInfo | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 429) return null
  const data = error.response.data as { code?: string; error?: string; upgrade?: string } | undefined
  if (data?.code !== 'QUOTA_EXCEEDED' || typeof data.error !== 'string') return null
  return { message: data.error, upgrade: data.upgrade }
}

/** Mensagem de erro que, se for cota esgotada, explica e aponta para os planos. */
export function QuotaNotice({ error, fallback, className = 'k-alert' }: { error: unknown; fallback: string; className?: string }) {
  const quota = quotaInfo(error)
  return (
    <p role="alert" className={className} style={{ margin: 0 }}>
      {quota ? quota.message : fallback}
      {quota?.upgrade && <> <Link to={quota.upgrade} style={{ fontWeight: 600, textDecoration: 'underline' }}>Conhecer o Kuaa Plus</Link></>}
    </p>
  )
}
