import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth.store'
import { api } from '../../services/api'
import KuaaLogo from '../../components/ui/KuaaLogo'
import AsaGlyph from '../../components/ui/AsaGlyph'
import type { AuthResponse } from '../../types/user'

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

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  if (form.name.trim().length < 2) errors.name = 'Nome deve ter pelo menos 2 caracteres'
  if (!form.email.includes('@')) errors.email = 'Informe um e-mail válido'
  if (form.password.length < 8) errors.password = 'A senha deve ter pelo menos 8 caracteres'
  return errors
}

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: '100%',
  border: `1.5px solid ${hasError ? '#840033' : 'rgba(26,10,31,.14)'}`,
  borderRadius: 12,
  padding: '12px 16px',
  fontSize: 15,
  backgroundColor: '#fff',
  outline: 'none',
  fontFamily: "'Questrial', Arial, sans-serif",
  boxSizing: 'border-box',
  color: '#1a0a1f',
})

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#3a2540',
  marginBottom: 6,
  letterSpacing: '.02em',
}

export default function Register() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState<FormState>({
    name: '', email: '', password: '', school: '', city: '', state: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

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
      navigate('/trilha')
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
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Questrial', Arial, sans-serif" }}>

      {/* Left brand panel */}
      <div
        style={{ flex: '0 0 400px', backgroundColor: '#2a0d33', flexDirection: 'column', padding: '48px 44px', position: 'relative', overflow: 'hidden' }}
        className="hidden lg:flex"
      >
        <div style={{ position: 'absolute', right: -60, bottom: -60, opacity: 0.07, color: '#fff', pointerEvents: 'none' }}>
          <AsaGlyph size={360} tone="mono" />
        </div>

        <KuaaLogo size={38} dark showTagline />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 48 }}>
          <div className="k-pill ghost-dark" style={{ marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#FFDC5C', flexShrink: 0 }} />
            100% gratuito
          </div>
          <h2 style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 28, color: '#fff', letterSpacing: '-.03em', lineHeight: 1.1, marginBottom: 16 }}>
            Sua aprovação<br />começa aqui.
          </h2>
          <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
            Trilhas personalizadas, simulados e monitores. Tudo gratuito para estudantes de escolas públicas.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['ENEM', 'FUVEST', 'UNICAMP'].map((v) => (
              <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: 'rgba(255,220,92,.15)', display: 'grid', placeItems: 'center', fontSize: 10, color: '#FFDC5C', fontWeight: 700, fontFamily: "'Unbounded', sans-serif" }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,.55)', fontSize: 14 }}>{v} coberto</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,.2)', fontSize: 12, letterSpacing: '.04em', textTransform: 'uppercase' }}>
          Para escolas públicas brasileiras
        </p>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, backgroundColor: '#faf3e3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Mobile logo */}
          <div className="lg:hidden" style={{ marginBottom: 40 }}>
            <KuaaLogo size={38} />
          </div>

          <h1 style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 24, color: '#1a0a1f', letterSpacing: '-.03em', marginBottom: 8 }}>
            Criar conta
          </h1>
          <p style={{ color: '#6b566f', fontSize: 14, marginBottom: 32 }}>
            Já tem conta?{' '}
            <Link to="/entrar" style={{ color: '#531A61', fontWeight: 600, textDecoration: 'none' }}>
              Entrar
            </Link>
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Nome */}
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="name" style={labelStyle}>Nome completo</label>
              <input id="name" name="name" type="text" autoComplete="name"
                value={form.name} onChange={handleChange}
                style={inputStyle(!!errors.name)}
              />
              {errors.name && <p style={{ color: '#840033', fontSize: 12, marginTop: 6 }}>{errors.name}</p>}
            </div>

            {/* E-mail */}
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="email" style={labelStyle}>E-mail</label>
              <input id="email" name="email" type="email" autoComplete="email"
                value={form.email} onChange={handleChange}
                style={inputStyle(!!errors.email)}
              />
              {errors.email && <p style={{ color: '#840033', fontSize: 12, marginTop: 6 }}>{errors.email}</p>}
            </div>

            {/* Senha */}
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="password" style={labelStyle}>Senha</label>
              <input id="password" name="password" type="password" autoComplete="new-password"
                value={form.password} onChange={handleChange}
                style={inputStyle(!!errors.password)}
              />
              {errors.password && <p style={{ color: '#840033', fontSize: 12, marginTop: 6 }}>{errors.password}</p>}
            </div>

            {/* Escola */}
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="school" style={labelStyle}>
                Escola <span style={{ color: '#6b566f', fontWeight: 400 }}>(opcional)</span>
              </label>
              <input id="school" name="school" type="text"
                value={form.school} onChange={handleChange}
                style={inputStyle(false)}
              />
            </div>

            {/* Cidade + Estado */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12, marginBottom: 28 }}>
              <div>
                <label htmlFor="city" style={labelStyle}>
                  Cidade <span style={{ color: '#6b566f', fontWeight: 400 }}>(opc.)</span>
                </label>
                <input id="city" name="city" type="text"
                  value={form.city} onChange={handleChange}
                  style={inputStyle(false)}
                />
              </div>
              <div>
                <label htmlFor="state" style={labelStyle}>
                  UF <span style={{ color: '#6b566f', fontWeight: 400 }}>(opc.)</span>
                </label>
                <select id="state" name="state"
                  value={form.state} onChange={handleChange}
                  style={{ ...inputStyle(false), appearance: 'none', backgroundImage: 'none' }}
                >
                  <option value="">—</option>
                  {BR_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {errors.general && (
              <div style={{ marginBottom: 18, backgroundColor: 'rgba(132,0,51,.08)', border: '1px solid rgba(132,0,51,.2)', borderRadius: 10, padding: '12px 16px', color: '#840033', fontSize: 14, textAlign: 'center' }}>
                {errors.general}
              </div>
            )}
            {errors.validation && errors.validation.length > 0 && (
              <ul style={{ marginBottom: 18, backgroundColor: 'rgba(132,0,51,.08)', border: '1px solid rgba(132,0,51,.2)', borderRadius: 10, padding: '12px 16px 12px 28px', color: '#840033', fontSize: 14 }}>
                {errors.validation.map((msg, i) => <li key={i}>{msg}</li>)}
              </ul>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '15px', borderRadius: 999, fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 13, backgroundColor: loading ? 'rgba(83,26,97,.5)' : '#531A61', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '-.02em', transition: 'opacity .15s' }}
            >
              {loading ? 'Criando conta…' : 'Criar conta grátis'}
            </button>

            <p style={{ color: 'rgba(26,10,31,.3)', fontSize: 11, textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
              Ao criar conta, você concorda que isso é um projeto acadêmico sem fins lucrativos.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
