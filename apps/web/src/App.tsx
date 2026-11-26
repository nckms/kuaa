import { lazy as reactLazy, Suspense, useEffect, type ComponentType } from 'react'
import { MotionConfig } from 'framer-motion'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { useAuthStore } from './stores/auth.store'
import Home from './pages/Home'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ProtectedRoute from './components/ProtectedRoute'
// Telas carregadas sob demanda: quem abre a página inicial não baixa o app inteiro.
// O CSS de todas as telas continua no carregamento inicial (mesma ordem e cascata de antes).
import './components/InstallAppCard.css'
import './components/layout/AppLayout.css'
import './components/onboarding/ExamOption.css'
import './components/quiz/QuestionMedia.css'
import './components/trail/SubjectSection.css'
import './pages/Auth/Auth.css'
import './pages/Dashboard/DashboardPage.css'
import './pages/Essay/EssayPage.css'
import './pages/Exams/Exams.css'
import './pages/Home.css'
import './pages/Indice/IndicePage.css'
import './pages/Legal/Legal.css'
import './pages/Onboarding/DiagnosticPage.css'
import './pages/Plan/StudyPlan.css'
import './pages/Plans/PlansPage.css'
import './pages/Profile/ProfilePage.css'
import './pages/Quiz/QuizPage.css'
import './pages/Quiz/ReviewPage.css'
import './pages/Quiz/SimuladoPage.css'
import './pages/Ranking/RankingPage.css'
import './pages/Review/Review.css'
import './pages/Sabia/SabiaPage.css'
import './pages/SecondPhase/SecondPhase.css'
import './pages/Settings/SettingsPage.css'
import './pages/Study/StudyPage.css'
import './pages/Trail/TrailPage.css'

// Depois de um deploy, uma aba aberta pede arquivos da versão antiga, que não existem mais.
// Recarrega a página uma vez (por 1 min) para pegar a versão nova em vez de quebrar a tela.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mesmo tipo do React.lazy
function lazy<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return reactLazy(() => load().catch((error) => {
    const key = 'kuaa-chunk-reload'
    let last = 0
    try { last = Number(sessionStorage.getItem(key) ?? 0) } catch { /* sem storage */ }
    if (Date.now() - last > 60_000) {
      try { sessionStorage.setItem(key, String(Date.now())) } catch { /* sem storage */ }
      window.location.reload()
      return new Promise<{ default: T }>(() => undefined)
    }
    throw error
  }))
}

const PlansPage = lazy(() => import('./pages/Plans/PlansPage'))
const Unsubscribe = lazy(() => import('./pages/Auth/Unsubscribe'))
const GuardianLink = lazy(() => import('./pages/Auth/GuardianLink'))
const TermsPage = lazy(() => import('./pages/Legal/TermsPage'))
const PrivacyPage = lazy(() => import('./pages/Legal/PrivacyPage'))
const StudentReviewPage = lazy(() => import('./pages/Admin/StudentReviewPage'))
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'))
const SelectVestibular = lazy(() => import('./pages/Onboarding/SelectVestibular'))
const DiagnosticPage = lazy(() => import('./pages/Onboarding/DiagnosticPage'))
const TrailPage = lazy(() => import('./pages/Trail/TrailPage'))
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'))
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'))
const RankingPage = lazy(() => import('./pages/Ranking/RankingPage'))
const QuizLoadingPage = lazy(() => import('./pages/Quiz/QuizLoadingPage'))
const QuizPage = lazy(() => import('./pages/Quiz/QuizPage'))
const ResultPage = lazy(() => import('./pages/Quiz/ResultPage'))
const ReviewPage = lazy(() => import('./pages/Quiz/ReviewPage'))
const IndicePage = lazy(() => import('./pages/Indice/IndicePage'))
const SimuladoPage = lazy(() => import('./pages/Quiz/SimuladoPage'))
const SabiaPage = lazy(() => import('./pages/Sabia/SabiaPage'))
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'))
const EvaluationPage = lazy(() => import('./pages/Evaluation/EvaluationPage'))
const StudyPage = lazy(() => import('./pages/Study/StudyPage'))
const ExamsPage = lazy(() => import('./pages/Exams/ExamsPage'))
const ErrorNotebookPage = lazy(() => import('./pages/Review/ErrorNotebookPage'))
const MistakeInsightsPage = lazy(() => import('./pages/Review/MistakeInsightsPage'))
const StudyPlanPage = lazy(() => import('./pages/Plan/StudyPlanPage'))
const SecondPhaseListPage = lazy(() => import('./pages/SecondPhase/SecondPhaseListPage'))
const SecondPhaseQuestionPage = lazy(() => import('./pages/SecondPhase/SecondPhaseQuestionPage'))
const ExamAttemptPage = lazy(() => import('./pages/Exams/ExamAttemptPage'))
const EssayPage = lazy(() => import('./pages/Essay/EssayPage'))

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
        await loadEnrollments()
        if (cancelled) return

        const firstSlug = useAuthStore.getState().firstVestibularSlug
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--k-bg)' }}>
      <p style={{ color: '#9ca3af', fontSize: 14 }}>Carregando trilha...</p>
    </div>
  )
}

function AppRoutes() {
  const hydrate = useAuthStore((state) => state.hydrate)
  useEffect(() => { hydrate() }, [hydrate])

  return (
    <Suspense fallback={<div role="status" aria-label="Carregando" style={{ minHeight: '100vh', background: 'var(--k-bg)' }} />}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/entrar" element={<Login />} />
      <Route path="/cadastro" element={<Register />} />
      <Route path="/esqueci-senha" element={<ForgotPassword />} />
      <Route path="/planos" element={<PlansPage />} />
      <Route path="/descadastrar" element={<Unsubscribe />} />
      <Route path="/responsavel" element={<GuardianLink />} />
      <Route path="/termos" element={<TermsPage />} />
      <Route path="/privacidade" element={<PrivacyPage />} />
      <Route path="/redefinir-senha" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/admin/estudantes" element={<StudentReviewPage />} />
        <Route path="/onboarding" element={<SelectVestibular />} />
        <Route path="/diagnostico/:vestibularSlug" element={<DiagnosticPage />} />
        <Route path="/trilha" element={<TrailIndex />} />
        <Route path="/trilha/:vestibularSlug" element={<TrailPage />} />
        <Route path="/estudar/:topicId" element={<StudyPage />} />
        <Route path="/redacao/:vestibularSlug" element={<EssayPage />} />
        <Route path="/redacao/:vestibularSlug/:essayId" element={<EssayPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/quiz/loading/:sessionId" element={<QuizLoadingPage />} />
        <Route path="/quiz/:sessionId" element={<QuizPage />} />
        <Route path="/resultado/:sessionId" element={<ResultPage />} />
        <Route path="/revisao/:sessionId" element={<ReviewPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
        <Route path="/avaliacao" element={<EvaluationPage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/indice" element={<IndicePage />} />
        <Route path="/simulado" element={<SimuladoPage />} />
        <Route path="/provas" element={<ExamsPage />} />
        <Route path="/erros" element={<ErrorNotebookPage />} />
        <Route path="/raio-x" element={<MistakeInsightsPage />} />
        <Route path="/plano" element={<StudyPlanPage />} />
        <Route path="/segunda-fase" element={<SecondPhaseListPage />} />
        <Route path="/segunda-fase/:id" element={<SecondPhaseQuestionPage />} />
        <Route path="/provas/:id" element={<ExamAttemptPage />} />
        <Route path="/sabia" element={<SabiaPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  )
}

export default function App() {
  const preferences = useAuthStore((state) => state.user?.preferences)
  return (
    <MotionConfig reducedMotion={preferences?.reducedMotion ? 'always' : 'user'}>
    <div data-reduced-motion={preferences?.reducedMotion || undefined} data-high-contrast={preferences?.highContrast || undefined}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
    </div>
    </MotionConfig>
  )
}
