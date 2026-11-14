import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { api } from '../../services/api'
import AuthShell from './AuthShell'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) {
      setError('Informe um e-mail válido')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await api.post<{ message: string }>('/auth/forgot-password', { email })
      setSent(res.data.message)
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.status === 429
        ? 'Muitos pedidos seguidos. Aguarde alguns minutos e tente de novo.'
        : 'Não foi possível enviar agora. Tente novamente em instantes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      asideTitle="Seu progresso continua salvo."
      asideText="Redefinir a senha não apaga sua trilha, seus simulados nem seu Índice."
      backTo="/entrar"
      backLabel="Voltar para entrar"
      title="Esqueci minha senha"
      subtitle="Informe o e-mail da sua conta. Enviaremos um link para criar uma nova senha."
    >
      {sent ? (
        <div className="auth-form">
          <div role="status" className="k-alert auth-success">{sent}</div>
          <p className="auth-field-hint">O link vale por 30 minutos e só pode ser usado uma vez. Se não chegar, peça de novo daqui a um minuto.</p>
          <Link to="/entrar" className="k-btn k-btn-primary is-lg is-block">Voltar para entrar</Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="k-field">
            <span>E-mail</span>
            <input className={`k-input${error ? ' is-error' : ''}`} name="email" type="email" autoComplete="email" placeholder="voce@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} aria-describedby={error ? 'forgot-error' : undefined} />
          </label>
          {error && <div id="forgot-error" role="alert" className="k-alert">{error}</div>}
          <button type="submit" disabled={loading} className="k-btn k-btn-primary is-lg is-block">
            {loading ? 'Enviando…' : 'Enviar link'} <i className="bi bi-arrow-right" aria-hidden="true" />
          </button>
        </form>
      )}
    </AuthShell>
  )
}
