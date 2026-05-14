import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { useAuthStore } from './stores/auth.store'
import Home from './pages/Home'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import SelectVestibular from './pages/Onboarding/SelectVestibular'
import TrailPage from './pages/Trail/TrailPage'
import ProtectedRoute from './components/ProtectedRoute'

function Placeholder({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center font-sans">
      <div className="text-center">
        <p className="text-5xl mb-4">🦅</p>
        <h1 className="text-2xl font-bold" style={{ color: '#531A61' }}>{label}</h1>
        <p className="text-gray-500 mt-2 text-sm">Em breve…</p>
      </div>
    </div>
  )
}

function TrailIndex() {
  const navigate = useNavigate()
  const firstVestibularSlug = useAuthStore((state) => state.firstVestibularSlug)
  const isHydrating = useAuthStore((state) => state.isHydrating)

  useEffect(() => {
    if (isHydrating) return
    if (firstVestibularSlug) {
      navigate(`/trilha/${firstVestibularSlug}`, { replace: true })
    } else {
      navigate('/onboarding', { replace: true })
    }
  }, [firstVestibularSlug, isHydrating, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-sm">Carregando trilha…</p>
    </div>
  )
}

function AppRoutes() {
  const hydrate = useAuthStore((state) => state.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/entrar" element={<Login />} />
      <Route path="/cadastro" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<SelectVestibular />} />
        <Route path="/trilha" element={<TrailIndex />} />
        <Route path="/trilha/:vestibularSlug" element={<TrailPage />} />
        <Route path="/quiz/:topicId" element={<Placeholder label="Quiz em breve" />} />
        <Route path="/perfil" element={<Placeholder label="Perfil (em breve)" />} />
        <Route path="/ranking" element={<Placeholder label="Ranking (em breve)" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
