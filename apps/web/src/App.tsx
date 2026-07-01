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
import QuizLoadingPage from './pages/Quiz/QuizLoadingPage'
import QuizPage from './pages/Quiz/QuizPage'
import ResultPage from './pages/Quiz/ResultPage'
import ReviewPage from './pages/Quiz/ReviewPage'

function TrailIndex() {
  const navigate = useNavigate()
  const firstVestibularSlug = useAuthStore((state) => state.firstVestibularSlug)
  const isHydrating = useAuthStore((state) => state.isHydrating)
  const loadEnrollments = useAuthStore((state) => state.loadEnrollments)

  useEffect(() => {
    let cancelled = false

    async function redirectToTrail() {
      if (isHydrating) return

      if (firstVestibularSlug) {
        navigate(`/trilha/${firstVestibularSlug}`, { replace: true })
        return
      }

      try {
        const enrollments = await loadEnrollments()
        if (cancelled) return

        const firstSlug = enrollments[0]?.vestibular.slug
        navigate(firstSlug ? `/trilha/${firstSlug}` : '/onboarding', { replace: true })
      } catch {
        if (!cancelled) navigate('/onboarding', { replace: true })
      }
    }

    void redirectToTrail()

    return () => {
      cancelled = true
    }
  }, [firstVestibularSlug, isHydrating, loadEnrollments, navigate])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#faf3e3' }}>
      <p style={{ color: '#9ca3af', fontSize: 14 }}>Carregando trilha...</p>
    </div>
  )
}

function AppRoutes() {
  const hydrate = useAuthStore((state) => state.hydrate)
  useEffect(() => { hydrate() }, [hydrate])

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
        <Route path="/quiz/loading/:sessionId" element={<QuizLoadingPage />} />
        <Route path="/quiz/:sessionId" element={<QuizPage />} />
        <Route path="/resultado/:sessionId" element={<ResultPage />} />
        <Route path="/revisao/:sessionId" element={<ReviewPage />} />
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
