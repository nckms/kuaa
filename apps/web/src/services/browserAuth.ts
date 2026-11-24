import axios from 'axios'
import { API_BASE_URL } from '../config/api'

/*
 * Sessão do navegador: o refresh token fica só no cookie HttpOnly `kuaa_session`
 * (gravado pela API via proxy same-origin). Aqui guardamos apenas marcadores
 * não secretos no localStorage:
 *  - SESSION_HINT: "pode haver cookie"; evita chamar /auth/refresh para todo
 *    visitante anônimo (todos chegam pelo mesmo IP do proxy).
 *  - LOGOUT_PENDING: logout que falhou na rede; impede restaurar a sessão em silêncio.
 * As chaves `kuaa_token`/`kuaa_refresh_token` são legadas e são apagadas na
 * primeira renovação bem-sucedida.
 */
const client = axios.create({ baseURL: API_BASE_URL, withCredentials: true,
  headers: { 'X-Kuaa-Client': 'web', 'Content-Type': 'application/json' } })
const LOGOUT_PENDING = 'kuaa_logout_pending'
const SESSION_HINT = 'kuaa_session_hint'
const LEGACY_ACCESS = 'kuaa_token'
const LEGACY_REFRESH = 'kuaa_refresh_token'

function read(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function write(key: string, value: string | null) {
  try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value) } catch { /* armazenamento indisponível */ }
}

export class NoBrowserSession extends Error {
  constructor() { super('Sem sessão no navegador') }
}

export function clearLegacyTokens() {
  write(LEGACY_ACCESS, null)
  write(LEGACY_REFRESH, null)
}

function forgetSession() {
  clearLegacyTokens()
  write(SESSION_HINT, null)
}

let pending: Promise<string> | null = null

async function sessionLock<T>(action: () => Promise<T>): Promise<T> {
  // Serializa a renovação entre abas: com rotação de uso único, duas abas
  // renovando ao mesmo tempo derrubariam uma à outra.
  if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request('kuaa-session', action)
  return action()
}

export function refreshAccessToken(): Promise<string> {
  if (pending) return pending
  pending = sessionLock(async () => {
    if (read(LOGOUT_PENDING)) {
      await client.delete('/auth/logout')
      write(LOGOUT_PENDING, null)
      forgetSession()
      throw new NoBrowserSession()
    }
    const legacy = read(LEGACY_REFRESH)
    if (!legacy && !read(SESSION_HINT)) throw new NoBrowserSession()
    try {
      const res = await client.post<{ accessToken: string }>('/auth/refresh', legacy ? { refreshToken: legacy } : {})
      if (typeof res.data.accessToken !== 'string') throw new Error('Resposta de sessão inválida')
      clearLegacyTokens()
      write(SESSION_HINT, '1')
      return res.data.accessToken
    } catch (err) {
      if (axios.isAxiosError(err) && [400, 401].includes(err.response?.status ?? 0)) forgetSession()
      throw err
    }
  }).finally(() => { pending = null })
  return pending
}

export function acknowledgeLogin() {
  clearLegacyTokens()
  write(LOGOUT_PENDING, null)
  write(SESSION_HINT, '1')
}

export async function endBrowserSession() {
  write(LOGOUT_PENDING, '1')
  forgetSession()
  await sessionLock(async () => {
    await client.delete('/auth/logout')
    write(LOGOUT_PENDING, null)
  })
}
