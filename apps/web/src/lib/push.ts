// Lembretes por notificação. Só pede permissão quando o aluno toca em "Ativar".
import { api } from '../services/api'

export type PushState = 'unsupported' | 'needs-install' | 'denied' | 'off' | 'on'

export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

function isIosBrowserTab(): boolean {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return ios && !standalone
}

function toKey(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(padded)
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

async function registration(): Promise<ServiceWorkerRegistration | null> {
  try { return (await navigator.serviceWorker.getRegistration()) ?? null } catch { return null }
}

export async function pushState(): Promise<PushState> {
  if (isIosBrowserTab()) return 'needs-install'
  if (!pushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  const reg = await registration()
  const sub = reg ? await reg.pushManager.getSubscription() : null
  return sub && Notification.permission === 'granted' ? 'on' : 'off'
}

export async function enablePush(): Promise<PushState> {
  const { data: config } = await api.get<{ enabled: boolean; publicKey: string | null }>('/push/config')
  if (!config.enabled || !config.publicKey) throw new Error('Lembretes indisponíveis no momento.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off'
  const reg = (await registration()) ?? await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription())
    ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(config.publicKey) })
  await api.post('/push/subscribe', sub.toJSON())
  await api.patch('/users/me', { preferences: { pushReminders: true } })
  return 'on'
}

export async function disablePush(): Promise<PushState> {
  const reg = await registration()
  const sub = reg ? await reg.pushManager.getSubscription() : null
  if (sub) {
    await api.delete('/push/subscribe', { data: { endpoint: sub.endpoint } }).catch(() => undefined)
    await sub.unsubscribe().catch(() => undefined)
  }
  await api.patch('/users/me', { preferences: { pushReminders: false } }).catch(() => undefined)
  return 'off'
}
