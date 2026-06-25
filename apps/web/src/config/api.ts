const LOCAL_API_URL = 'http://localhost:3333/api/v1'
const PRODUCTION_API_URL = 'https://kuaa-tcc-api.onrender.com/api/v1'

function normalizeBaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return null
  return trimmed.replace(/\/+$/, '')
}

function inferDefaultApiUrl(): string {
  if (typeof window === 'undefined') return LOCAL_API_URL

  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') return LOCAL_API_URL

  return PRODUCTION_API_URL
}

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL) ?? inferDefaultApiUrl()
