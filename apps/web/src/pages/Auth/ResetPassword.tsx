import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { api } from '../../services/api'
import AuthShell from './AuthShell'

/**
 * Lê o token do fragmento (#token=…). Função pura: o React pode chamar o
 * inicializador do useState mais de uma vez (StrictMode), então a remoção do
 * token da barra de endereço acontece num efeito, depois da leitura.
 */
function readTokenFromHash(): string {
  return new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token') ?? ''
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [token] = useState(readTokenFromHash)

  useEffect(() => {
    if (token && window.location.hash) window.history.replaceState(null, '', window.location.pathname)
  }, [token])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!done) return
    const timer = setTimeout(() => navigate('/entrar'), 2500)
    return () => clearTimeout(timer)
  }, [done, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) return setError('A nova senha deve ter pelo menos 8 caracteres')
    if (password !== confirm) return setError('As senhas não coincidem')
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      setDone(true)
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.status === 400
        ? 'Este link é inválido, expirou ou já foi usado. Peça um novo link.'
        : axios.isAxiosError(err) && err.response?.status === 429
          ? 'Muitas tentativas. Aguarde alguns minutos.'
          : 'Não foi possível redefinir agora. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const shell = { asideTitle: 'Quase lá.', asideText: 'Crie uma nova senha e volte direto para a sua trilha.',
    backTo: '/entrar', backLabel: 'Voltar para entrar', title: 'Criar nova senha' }

  if (!token) {
    return (
      <AuthShell {...shell} subtitle="Este link está incompleto.">
        <div className="auth-form">
          <div role="alert" className="k-alert">Abra o link exatamente como chegou no e-mail ou peça um novo.</div>
          <Link to="/esqueci-senha" className="k-btn k-btn-primary is-lg is-block">Pedir novo link</Link>
        </div>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell {...shell} subtitle="Senha atualizada.">
        <div className="auth-form">
          <div role="status" className="k-alert auth-success">Pronto! Entre com a nova senha. Por segurança, encerramos as sessões abertas em outros aparelhos.</div>
          <Link to="/entrar" className="k-btn k-btn-primary is-lg is-block">Entrar</Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell {...shell} subtitle="Use pelo menos 8 caracteres.">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="k-field">
          <span>Nova senha</span>
          <input className="k-input" name="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label className="k-field">
          <span>Confirmar nova senha</span>
          <input className="k-input" name="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
        {error && (
          <div role="alert" className="k-alert">
            {error} {error.includes('novo link') && <Link to="/esqueci-senha">Pedir novo link</Link>}
          </div>
        )}
        <button type="submit" disabled={loading} className="k-btn k-btn-primary is-lg is-block">
          {loading ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
    </AuthShell>
  )
}
