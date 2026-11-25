import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { api } from '../services/api'
import { useAuthStore } from '../stores/auth.store'

/** LGPD: baixar uma cópia dos dados e excluir a conta. */
export default function AccountDataSection() {
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const [downloading, setDownloading] = useState(false)
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function download() {
    setDownloading(true); setError('')
    try {
      const res = await api.get<Blob>('/users/me/export', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `kuaa-meus-dados-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch { setError('Não foi possível gerar o arquivo agora. Tente de novo.') }
    finally { setDownloading(false) }
  }

  async function remove(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      await api.delete('/users/me', { data: { password, confirm: confirm.trim().toUpperCase() } })
      try { await logout() } catch { /* a sessão já não existe no servidor */ }
      navigate('/', { replace: true })
    } catch (err) {
      const code = axios.isAxiosError(err) ? (err.response?.data as { code?: string } | undefined)?.code : undefined
      setError(code === 'INVALID_PASSWORD' ? 'Senha incorreta.'
        : code === 'BILLING_CANCEL_FAILED' ? 'Não conseguimos cancelar sua assinatura agora, então nada foi apagado. Tente de novo em alguns minutos.'
          : 'Não foi possível excluir a conta. Nada foi apagado. Tente de novo.')
      setBusy(false)
    }
  }

  return <section className="k-card is-md st-section" style={{ borderColor: '#F1D5DF' }} aria-labelledby="st-data">
    <h2 id="st-data" className="st-h2">Seus dados</h2>
    <p className="k-muted" style={{ fontSize: 13, margin: '4px 0 12px' }}>
      Baixe uma cópia de tudo que o Kuaa guarda sobre você ou exclua sua conta. Veja a <Link to="/privacidade">Política de Privacidade</Link>.
    </p>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button type="button" className="k-btn k-btn-outline is-sm" disabled={downloading} onClick={() => void download()}>
        <i className="bi bi-download" aria-hidden="true" />{downloading ? 'Gerando…' : 'Baixar meus dados'}
      </button>
      {!open && <button type="button" className="k-btn k-btn-outline is-sm" style={{ color: 'var(--k-vinho)' }} onClick={() => setOpen(true)}>
        <i className="bi bi-trash3" aria-hidden="true" />Excluir conta
      </button>}
    </div>
    {open && <form onSubmit={(event) => void remove(event)} style={{ marginTop: 16, display: 'grid', gap: 10 }}>
      <p style={{ margin: 0 }}><strong>Isso apaga para sempre</strong> seu progresso, histórico, redações e conversas com o Sabiá. Se você tiver o Kuaa Plus, a assinatura é cancelada na hora, sem nova cobrança.</p>
      <label className="k-field"><span>Sua senha</span>
        <input className="k-input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <label className="k-field"><span>Digite EXCLUIR para confirmar</span>
        <input className="k-input" autoComplete="off" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="submit" className="k-btn k-btn-primary is-sm" style={{ background: 'var(--k-vinho)', borderColor: 'var(--k-vinho)' }}
          disabled={busy || !password || confirm.trim().toUpperCase() !== 'EXCLUIR'}>{busy ? 'Excluindo…' : 'Excluir minha conta'}</button>
        <button type="button" className="k-btn k-btn-outline is-sm" disabled={busy} onClick={() => { setOpen(false); setPassword(''); setConfirm(''); setError('') }}>Cancelar</button>
      </div>
    </form>}
    {error && <p role="alert" className="k-alert" style={{ marginTop: 12 }}>{error}</p>}
  </section>
}
