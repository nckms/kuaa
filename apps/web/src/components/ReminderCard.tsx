import { useEffect, useState } from 'react'
import { disablePush, enablePush, pushState, type PushState } from '../lib/push'
import './InstallAppCard.css'

const DISMISS_KEY = 'kuaa_reminder_dismissed_at'

function friendly(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  return /indispon/i.test(message) ? message : 'Não foi possível ativar os lembretes neste navegador. Tente pelo app instalado ou pelo Chrome.'
}

function dismissedRecently(): boolean {
  try { return Date.now() - Number(localStorage.getItem(DISMISS_KEY) ?? 0) < 10 * 86_400_000 } catch { return false }
}

export function usePushState(): [PushState | null, (s: PushState) => void] {
  const [state, setState] = useState<PushState | null>(null)
  useEffect(() => { let alive = true; void pushState().then((s) => { if (alive) setState(s) }); return () => { alive = false } }, [])
  return [state, setState]
}

/** Convite no painel para ativar o lembrete diário. */
export default function ReminderCard() {
  const [state, setState] = usePushState()
  const [hidden, setHidden] = useState(dismissedRecently)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (hidden || state !== 'off') return null

  const enable = async () => {
    setBusy(true); setError('')
    try { setState(await enablePush()) } catch (e) { setError(friendly(e)) } finally { setBusy(false) }
  }
  const dismiss = () => { try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* ok */ } setHidden(true) }

  return <section className="install-card" aria-label="Lembrete diário">
    <i className="bi bi-bell" aria-hidden="true" style={{ fontSize: 28, color: 'var(--k-roxo, #35143E)' }} />
    <div className="install-text">
      <strong>Lembrete às 19h</strong>
      <span>Um aviso por dia, só se você ainda não estudou. Dá para desligar quando quiser.</span>
      {error && <span role="alert">{error}</span>}
    </div>
    <div className="install-actions">
      <button type="button" className="k-btn k-btn-primary is-sm" disabled={busy} onClick={() => void enable()}>{busy ? 'Ativando…' : 'Ativar'}</button>
      <button type="button" className="install-close" onClick={dismiss} aria-label="Agora não"><i className="bi bi-x-lg" aria-hidden="true" /></button>
    </div>
  </section>
}

/** Interruptor em Configurações. */
export function ReminderSetting() {
  const [state, setState] = usePushState()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (state === null || state === 'unsupported') return null
  const toggle = async () => {
    setBusy(true); setError('')
    try { setState(state === 'on' ? await disablePush() : await enablePush()) } catch (e) { setError(friendly(e)) } finally { setBusy(false) }
  }
  return <section className="k-card is-md st-row st-section-row">
    <div>
      <h2 className="st-h2">Lembrete diário (19h)</h2>
      <div className="k-muted" style={{ fontSize: 13, marginTop: 4 }}>
        {state === 'needs-install' ? 'No iPhone, instale o Kuaa na tela inicial para receber lembretes.'
          : state === 'denied' ? 'As notificações estão bloqueadas para o Kuaa nas configurações do navegador.'
            : 'Um aviso por dia, só se você ainda não estudou.'}
      </div>
      {error && <div role="alert" className="k-muted" style={{ fontSize: 13, color: 'var(--k-vinho)' }}>{error}</div>}
    </div>
    {(state === 'on' || state === 'off') && <button type="button" className={`k-btn is-sm ${state === 'on' ? 'k-btn-outline' : 'k-btn-primary'}`} disabled={busy} onClick={() => void toggle()}>
      {busy ? '…' : state === 'on' ? 'Desligar' : 'Ativar'}
    </button>}
  </section>
}
