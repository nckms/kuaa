// Origem do cadastro (primeiro toque): ?ref=, utm_* e o domínio que trouxe o
// aluno. Fica no navegador por 30 dias e vai junto no cadastro. Nada pessoal.
const KEY = 'kuaa_attribution'
const TTL_MS = 30 * 86_400_000
const SAFE = /^[a-z0-9_.-]{1,40}$/i

export interface Attribution { ref?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string; referrer?: string; invite?: string }

function clean(value: string | null, max = 40): string | undefined {
  const v = value?.trim().toLowerCase().slice(0, max)
  return v && (max === 40 ? SAFE.test(v) : /^[a-z0-9_.-]+$/.test(v)) ? v : undefined
}

function externalReferrer(): string | undefined {
  try {
    if (!document.referrer) return undefined
    const host = new URL(document.referrer).hostname.replace(/^www\./, '')
    if (!host || host === location.hostname) return undefined
    return /^[a-z0-9.-]{1,80}$/i.test(host) ? host : undefined
  } catch { return undefined }
}

export function captureAttribution(search = location.search): void {
  try {
    const params = new URLSearchParams(search)
    // Convite de amigo vale mesmo se já houver outra origem guardada (é o que dá o bônus).
    const invite = params.get('convite')?.trim().toLowerCase()
    if (invite && /^[a-z0-9]{6,12}$/.test(invite)) {
      const current = getAttribution() ?? {}
      localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), data: { ...current, invite } }))
      return
    }
    const found: Attribution = {
      ref: clean(params.get('ref')), utmSource: clean(params.get('utm_source')),
      utmMedium: clean(params.get('utm_medium')), utmCampaign: clean(params.get('utm_campaign'), 60),
      referrer: externalReferrer(),
    }
    const entries = Object.entries(found).filter(([, v]) => v)
    if (!entries.length) return
    const previous = localStorage.getItem(KEY)
    if (previous) {
      const { at } = JSON.parse(previous) as { at: number }
      // Primeiro toque vence, salvo se um link novo com ref/utm chegar depois de expirar.
      if (Date.now() - at < TTL_MS) return
    }
    localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), data: Object.fromEntries(entries) }))
  } catch { /* armazenamento indisponível: segue sem origem */ }
}

export function getAttribution(): Attribution | undefined {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return undefined
    const { at, data } = JSON.parse(raw) as { at: number; data: Attribution }
    return Date.now() - at < TTL_MS ? data : undefined
  } catch { return undefined }
}
