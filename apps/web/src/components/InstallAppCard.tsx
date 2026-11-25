import { useEffect, useState } from 'react'
import { installAvailable, isIos, onInstallChange, promptInstall } from '../lib/pwa'
import './InstallAppCard.css'

const DISMISS_KEY = 'kuaa_install_dismissed_at'
const DISMISS_MS = 14 * 86_400_000

function dismissedRecently(): boolean {
  try { return Date.now() - Number(localStorage.getItem(DISMISS_KEY) ?? 0) < DISMISS_MS } catch { return false }
}

/** Cartão "Instalar o app". `compact` = só o botão (rodapé, configurações). */
/** Re-renderiza quando a instalação fica (in)disponível. */
export function useInstallAvailable(): boolean {
  const [, rerender] = useState(0)
  useEffect(() => onInstallChange(() => rerender((n) => n + 1)), [])
  return installAvailable()
}

export default function InstallAppCard({ compact = false }: { compact?: boolean }) {
  const [, rerender] = useState(0)
  const [hidden, setHidden] = useState(() => !compact && dismissedRecently())
  const [showIosHelp, setShowIosHelp] = useState(false)
  useEffect(() => onInstallChange(() => rerender((n) => n + 1)), [])

  if (hidden || !installAvailable()) return null
  const ios = isIos()

  const install = async () => {
    if (ios) { setShowIosHelp((v) => !v); return }
    await promptInstall()
  }
  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* ok */ }
    setHidden(true)
  }

  const help = showIosHelp && <p className="install-help" role="status">
    No Safari, toque em <i className="bi bi-box-arrow-up" aria-label="Compartilhar" /> <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.
  </p>

  if (compact) return <div className="install-compact">
    <button type="button" className="k-btn k-btn-outline is-sm" onClick={() => void install()}><i className="bi bi-phone" aria-hidden="true" /> Instalar o app</button>
    {help}
  </div>

  return <section className="install-card" aria-label="Instalar o Kuaa">
    <img src="/icons/icon-192.png" alt="" width={48} height={48} />
    <div className="install-text">
      <strong>Kuaa na tela inicial</strong>
      <span>Abra em um toque, em tela cheia, como um app.</span>
      {help}
    </div>
    <div className="install-actions">
      <button type="button" className="k-btn k-btn-primary is-sm" onClick={() => void install()}>Instalar</button>
      <button type="button" className="install-close" onClick={dismiss} aria-label="Agora não"><i className="bi bi-x-lg" aria-hidden="true" /></button>
    </div>
  </section>
}
