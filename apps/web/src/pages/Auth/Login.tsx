import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth.store'
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
      const res = await axios.post<AuthResponse>(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        form,
      )
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
    <div className="min-h-screen flex items-center justify-center font-sans px-4" style={{ backgroundColor: '#f5f3ff' }}>
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-3xl font-bold" style={{ color: '#531A61' }}>🦅 KUAA</span>
          <p className="text-gray-500 mt-2 text-sm">Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: errors.email ? '#840033' : '#d1d5db', focusRingColor: '#531A61' } as React.CSSProperties}
            />
            {errors.email && <p className="text-xs mt-1" style={{ color: '#840033' }}>{errors.email}</p>}
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: errors.password ? '#840033' : '#d1d5db' } as React.CSSProperties}
            />
            {errors.password && <p className="text-xs mt-1" style={{ color: '#840033' }}>{errors.password}</p>}
          </div>

          {errors.general && (
            <div className="mb-4 text-sm text-center py-2 rounded-lg" style={{ backgroundColor: '#fff0f3', color: '#840033' }}>
              {errors.general}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#531A61', color: '#FFFFFF' }}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Não tem conta?{' '}
          <Link to="/cadastro" className="font-medium" style={{ color: '#531A61' }}>
            Cadastre-se grátis
          </Link>
        </p>
      </div>
    </div>
  )
}
