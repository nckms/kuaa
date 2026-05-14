import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth.store'
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
      const res = await axios.post<AuthResponse>(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        payload,
      )
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
    <div className="min-h-screen flex items-center justify-center font-sans px-4 py-8" style={{ backgroundColor: '#f5f3ff' }}>
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-3xl font-bold" style={{ color: '#531A61' }}>🦅 KUAA</span>
          <p className="text-gray-500 mt-2 text-sm">Crie sua conta grátis</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Nome */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <input id="name" name="name" type="text" autoComplete="name"
              value={form.name} onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: errors.name ? '#840033' : '#d1d5db' } as React.CSSProperties}
            />
            {errors.name && <p className="text-xs mt-1" style={{ color: '#840033' }}>{errors.name}</p>}
          </div>

          {/* E-mail */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input id="email" name="email" type="email" autoComplete="email"
              value={form.email} onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: errors.email ? '#840033' : '#d1d5db' } as React.CSSProperties}
            />
            {errors.email && <p className="text-xs mt-1" style={{ color: '#840033' }}>{errors.email}</p>}
          </div>

          {/* Senha */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input id="password" name="password" type="password" autoComplete="new-password"
              value={form.password} onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: errors.password ? '#840033' : '#d1d5db' } as React.CSSProperties}
            />
            {errors.password && <p className="text-xs mt-1" style={{ color: '#840033' }}>{errors.password}</p>}
          </div>

          {/* Escola (opcional) */}
          <div className="mb-4">
            <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
              Escola <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input id="school" name="school" type="text"
              value={form.school} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
            />
          </div>

          {/* Cidade e Estado */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                Cidade <span className="text-gray-400 font-normal">(opc.)</span>
              </label>
              <input id="city" name="city" type="text"
                value={form.city} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                Estado <span className="text-gray-400 font-normal">(opc.)</span>
              </label>
              <select id="state" name="state"
                value={form.state} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white"
              >
                <option value="">—</option>
                {BR_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {errors.general && (
            <div className="mb-4 text-sm text-center py-2 rounded-lg" style={{ backgroundColor: '#fff0f3', color: '#840033' }}>
              {errors.general}
            </div>
          )}
          {errors.validation && errors.validation.length > 0 && (
            <ul className="mb-4 text-sm py-2 px-4 rounded-lg list-disc list-inside" style={{ backgroundColor: '#fff0f3', color: '#840033' }}>
              {errors.validation.map((msg, i) => <li key={i}>{msg}</li>)}
            </ul>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#531A61', color: '#FFFFFF' }}
          >
            {loading ? 'Criando conta…' : 'Criar conta grátis'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem conta?{' '}
          <Link to="/entrar" className="font-medium" style={{ color: '#531A61' }}>Entrar</Link>
        </p>
      </div>
    </div>
  )
}
