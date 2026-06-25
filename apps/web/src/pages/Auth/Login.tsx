import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth.store'
import { api } from '../../services/api'
import KuaaLogo from '../../components/ui/KuaaLogo'
import AsaGlyph from '../../components/ui/AsaGlyph'
import type { AuthResponse } from '../../types/user'

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
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState<FormState>({ email: '', password: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

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
      navigate('/trilha')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setErrors({ general: 'E-mail ou senha incorretos' })
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
        style={{ flex: '0 0 420px', backgroundColor: '#1a0a1f', flexDirection: 'column', padding: '48px 44px', position: 'relative', overflow: 'hidden' }}
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
          <h2 style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 30, color: '#fff', letterSpacing: '-.03em', lineHeight: 1.1, marginBottom: 16 }}>
            Bem-vindo<br />de volta.
          </h2>
          <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 15, lineHeight: 1.7 }}>
            Continue sua jornada rumo à aprovação. Cada sessão conta.
          </p>
        </div>

        <p style={{ color: 'rgba(255,255,255,.2)', fontSize: 12, letterSpacing: '.04em', textTransform: 'uppercase' }}>
          Para escolas públicas brasileiras
        </p>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, backgroundColor: '#faf3e3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          <div className="lg:hidden" style={{ marginBottom: 40 }}>
            <KuaaLogo size={38} />
          </div>

          <h1 style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 24, color: '#1a0a1f', letterSpacing: '-.03em', marginBottom: 8 }}>
            Entrar
          </h1>
          <p style={{ color: '#6b566f', fontSize: 14, marginBottom: 36 }}>
            Não tem conta?{' '}
            <Link to="/cadastro" style={{ color: '#531A61', fontWeight: 600, textDecoration: 'none' }}>
              Cadastre-se grátis
            </Link>
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3a2540', marginBottom: 6, letterSpacing: '.02em' }}>
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                style={{ width: '100%', border: `1.5px solid ${errors.email ? '#840033' : 'rgba(26,10,31,.14)'}`, borderRadius: 12, padding: '12px 16px', fontSize: 15, backgroundColor: '#fff', outline: 'none', fontFamily: "'Questrial', Arial, sans-serif", boxSizing: 'border-box', color: '#1a0a1f' }}
              />
              {errors.email && <p style={{ color: '#840033', fontSize: 12, marginTop: 6 }}>{errors.email}</p>}
            </div>

            <div style={{ marginBottom: 28 }}>
              <label htmlFor="password" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3a2540', marginBottom: 6, letterSpacing: '.02em' }}>
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                style={{ width: '100%', border: `1.5px solid ${errors.password ? '#840033' : 'rgba(26,10,31,.14)'}`, borderRadius: 12, padding: '12px 16px', fontSize: 15, backgroundColor: '#fff', outline: 'none', fontFamily: "'Questrial', Arial, sans-serif", boxSizing: 'border-box', color: '#1a0a1f' }}
              />
              {errors.password && <p style={{ color: '#840033', fontSize: 12, marginTop: 6 }}>{errors.password}</p>}
            </div>

            {errors.general && (
              <div style={{ marginBottom: 20, backgroundColor: 'rgba(132,0,51,.08)', border: '1px solid rgba(132,0,51,.2)', borderRadius: 10, padding: '12px 16px', color: '#840033', fontSize: 14, textAlign: 'center' }}>
                {errors.general}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '15px', borderRadius: 999, fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 13, backgroundColor: loading ? 'rgba(83,26,97,.5)' : '#531A61', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '-.02em', transition: 'opacity .15s' }}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
