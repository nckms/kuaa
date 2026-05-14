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
import DashboardPage from './pages/Dashboard/DashboardPage'
import ProfilePage from './pages/Profile/ProfilePage'
import RankingPage from './pages/Ranking/RankingPage'
import QuizPage from './pages/Quiz/QuizPage'

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#faf3e3' }}>
      <p style={{ color: '#9ca3af', fontSize: 14 }}>Carregando trilha…</p>
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
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/quiz/:topicId" element={<QuizPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/ranking" element={<RankingPage />} />
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
