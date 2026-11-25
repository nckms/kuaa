// Instalação do Kuaa como app (PWA). O navegador decide quando oferece o
// prompt; guardamos o evento para o botão "Instalar o app" usar depois.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((fn) => fn())

export function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent)
}

export function canPromptInstall(): boolean { return deferred !== null }

export function onInstallChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable'
  const event = deferred
  deferred = null
  notify()
  await event.prompt()
  return (await event.userChoice).outcome
}

export function setupPwa(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferred = event as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => { deferred = null; notify() })
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* sem SW o site segue normal */ })
    })
  }
}

/** true quando dá para oferecer a instalação (prompt do navegador ou instruções do iOS). */
export function installAvailable(): boolean {
  return !isStandalone() && (canPromptInstall() || isIos())
}
