import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth.store'
import { api } from '../../services/api'
import type { AuthResponse } from '../../types/user'
import AuthShell from './AuthShell'

interface FormState {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!form.email.includes('@')) errors.email = 'Informe um e-mail válido'
  if (form.password.length < 8) errors.password = 'A senha deve ter pelo menos 8 caracteres'
  return errors
}

export default function Login() {
  const navigate = useNavigate()
  const { setAuth, loadEnrollments } = useAuthStore()
  const [form, setForm] = useState<FormState>({ email: '', password: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const canSubmit = form.email.includes('@') && form.password.length >= 8 && !loading

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      const res = await api.post<AuthResponse>('/auth/login', form)
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
      try {
        await loadEnrollments()
        const firstSlug = useAuthStore.getState().firstVestibularSlug
        navigate(firstSlug ? `/trilha/${firstSlug}` : '/onboarding')
      } catch {
        navigate('/trilha')
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setErrors({ general: 'E-mail ou senha incorretos' })
      } else {
        setErrors({ general: 'Erro ao conectar. Tente novamente' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      asideTitle="Sua trilha está te esperando."
      asideText="Entre para continuar de onde parou. Sua sequência e seu Índice estão salvos."
      topRight={<Link to="/cadastro" className="auth-switch">Criar conta</Link>}
      title="Bem-vindo de volta"
      subtitle="Continue de onde parou."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="k-field">
          <span>E-mail</span>
          <input className={`k-input${errors.email ? ' is-error' : ''}`} id="email" name="email" type="email" autoComplete="email" placeholder="voce@email.com"
            value={form.email} onChange={handleChange} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} />
          {errors.email && <span id="email-error" className="auth-field-msg">{errors.email}</span>}
        </label>
        <label className="k-field">
          <span>Senha</span>
          <input className={`k-input${errors.password ? ' is-error' : ''}`} id="password" name="password" type="password" autoComplete="current-password" placeholder="Mínimo 8 caracteres"
            value={form.password} onChange={handleChange} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} />
          {errors.password && <span id="password-error" className="auth-field-msg">{errors.password}</span>}
        </label>
        {errors.general && <div role="alert" className="k-alert">{errors.general}</div>}
        <button type="submit" disabled={loading} className={`k-btn is-lg is-block ${canSubmit ? 'k-btn-primary' : 'k-btn-outline'}`} style={{ marginTop: 12 }}>
          {loading ? 'Entrando…' : 'Entrar'} <i className="bi bi-arrow-right" aria-hidden="true" />
        </button>
      </form>
      <p className="auth-foot">Ainda não tem conta? <Link to="/cadastro">Criar conta grátis</Link></p>
    </AuthShell>
  )
}
