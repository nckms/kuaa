import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth.store'
import { api } from '../../services/api'
import type { AuthResponse } from '../../types/user'
import AuthShell from './AuthShell'

const BR_STATES = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA',
  'MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN',
  'RO','RR','RS','SC','SE','SP','TO',
]

interface FormState {
  name: string
  email: string
  password: string
  school: string
  city: string
  state: string
}

interface FormErrors {
  name?: string
  email?: string
  password?: string
  general?: string
  validation?: string[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  if (form.name.trim().length < 2) errors.name = 'Nome deve ter pelo menos 2 caracteres'
  if (!form.email.includes('@')) errors.email = 'Informe um e-mail válido'
  if (form.password.length < 8) errors.password = 'A senha deve ter pelo menos 8 caracteres'
  return errors
}

export default function Register() {
  const navigate = useNavigate()
  const { setAuth, loadEnrollments } = useAuthStore()
  const [form, setForm] = useState<FormState>({
    name: '', email: '', password: '', school: '', city: '', state: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  const emailOk = EMAIL_RE.test(form.email)
  const emailBad = form.email.length > 3 && !emailOk
  const pass = form.password
  const strength = [pass.length >= 8, /[A-Z]/.test(pass), /[0-9]/.test(pass), /[^A-Za-z0-9]/.test(pass)].filter(Boolean).length
  const strengthColor = strength < 2 ? '#840033' : strength < 3 ? '#D99A1E' : '#28765B'
  const canSubmit = emailOk && pass.length >= 8 && form.name.trim().length > 1 && !loading

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
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

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      ...(form.school && { school: form.school }),
      ...(form.city && { city: form.city }),
      ...(form.state && { state: form.state }),
    }

    try {
      const res = await api.post<AuthResponse>('/auth/register', payload)
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
      try {
        const enrollments = await loadEnrollments()
        const firstSlug = enrollments[0]?.vestibular.slug
        navigate(firstSlug ? `/trilha/${firstSlug}` : '/onboarding')
      } catch {
        navigate('/trilha')
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          setErrors({ general: 'Este e-mail já está cadastrado' })
        } else if (err.response?.status === 400 || err.response?.status === 422) {
          const details = err.response.data?.details
          if (details) {
            const msgs = Object.values(details).flat() as string[]
            setErrors({ validation: msgs })
          } else {
            setErrors({ general: err.response.data?.error ?? 'Dados inválidos' })
          }
        } else {
          setErrors({ general: 'Erro ao conectar. Tente novamente' })
        }
      } else {
        setErrors({ general: 'Erro ao conectar. Tente novamente' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      asideTitle="Seu plano de estudos começa com um diagnóstico rápido."
      asideText="A gente descobre o que você já sabe e o que falta — e monta um caminho só seu até a prova."
      topRight={<Link to="/entrar" className="auth-switch">Já tenho conta</Link>}
      step={0}
      title="Crie sua conta"
      subtitle="Leva menos de um minuto."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="k-field">
          <span>Como quer ser chamado?</span>
          <input className={`k-input${errors.name ? ' is-error' : ''}`} id="name" name="name" type="text" autoComplete="name" placeholder="Seu nome"
            value={form.name} onChange={handleChange} aria-invalid={!!errors.name} />
          {errors.name && <span className="auth-field-msg">{errors.name}</span>}
        </label>
        <label className="k-field">
          <span>E-mail</span>
          <span className="auth-input-wrap">
            <input className={`k-input${emailBad || errors.email ? ' is-error' : emailOk ? ' is-ok' : ''}`} id="email" name="email" type="email" autoComplete="email" placeholder="voce@email.com"
              value={form.email} onChange={handleChange} aria-invalid={emailBad || !!errors.email} />
            <i className={`bi ${emailOk ? 'bi-check-lg' : emailBad ? 'bi-exclamation-circle' : 'bi-envelope'}`} style={{ color: emailOk ? '#28765B' : emailBad ? '#840033' : '#B0A6B3' }} aria-hidden="true" />
          </span>
          <span className="auth-field-msg">{errors.email ?? (emailBad ? 'Confere o e-mail — parece faltar algo.' : '')}</span>
        </label>
        <label className="k-field">
          <span>Senha</span>
          <input className={`k-input${errors.password ? ' is-error' : ''}`} id="password" name="password" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres"
            value={form.password} onChange={handleChange} aria-invalid={!!errors.password} aria-describedby="password-hint" />
          <span className="auth-strength" aria-hidden="true">{[0, 1, 2, 3].map((index) => <span key={index} style={index < strength ? { background: strengthColor } : undefined} />)}</span>
          <span id="password-hint" className={errors.password ? 'auth-field-msg' : 'auth-field-hint'}>{errors.password ?? (pass.length === 0 ? 'Use 8+ caracteres, com número e maiúscula.' : ['Muito fraca', 'Fraca', 'Ok', 'Boa', 'Forte'][strength])}</span>
        </label>

        <details className="auth-optional">
          <summary>Escola e cidade (opcional)</summary>
          <div className="auth-optional-grid">
            <label className="k-field"><span>Escola</span><input className="k-input" id="school" name="school" type="text" value={form.school} onChange={handleChange} /></label>
            <label className="k-field"><span>Cidade</span><input className="k-input" id="city" name="city" type="text" value={form.city} onChange={handleChange} /></label>
            <label className="k-field"><span>UF</span>
              <select className="k-input" id="state" name="state" value={form.state} onChange={handleChange}>
                <option value="">—</option>
                {BR_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
        </details>

        {errors.general && <div role="alert" className="k-alert">{errors.general}</div>}
        {errors.validation && errors.validation.length > 0 && (
          <ul role="alert" className="k-alert" style={{ paddingLeft: 32, margin: 0 }}>
            {errors.validation.map((msg, i) => <li key={i}>{msg}</li>)}
          </ul>
        )}

        <button type="submit" disabled={loading} className={`k-btn is-lg is-block ${canSubmit ? 'k-btn-primary' : 'k-btn-outline'}`} style={{ marginTop: 12 }}>
          {loading ? 'Criando conta…' : 'Continuar'} <i className="bi bi-arrow-right" aria-hidden="true" />
        </button>
      </form>
    </AuthShell>
  )
}
