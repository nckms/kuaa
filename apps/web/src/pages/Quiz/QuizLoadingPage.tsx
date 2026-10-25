import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useJobStatus } from '../../hooks/useQuiz'
import { useAuthStore } from '../../stores/auth.store'
import KuaaMascotLogo from '../../components/ui/KuaaMascotLogo'
import './QuizPage.css'

export default function QuizLoadingPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [searchParams] = useSearchParams()
  const jobId = searchParams.get('jobId')
  const navigate = useNavigate()
  const reducedMotion = useAuthStore((state) => state.user?.preferences?.reducedMotion ?? false)
  const [count, setCount] = useState(0)

  const { data, isError } = useJobStatus(jobId, sessionId ?? null)
  const readyId = data?.status === 'ready' ? data.sessionId : undefined

  useEffect(() => {
    if (!readyId) return
    if (reducedMotion) { navigate(`/quiz/${readyId}`, { replace: true }); return }
    setCount(3)
    const timers = [
      setTimeout(() => setCount(2), 800),
      setTimeout(() => setCount(1), 1600),
      setTimeout(() => navigate(`/quiz/${readyId}`, { replace: true }), 2400),
    ]
    return () => timers.forEach(clearTimeout)
  }, [readyId, reducedMotion, navigate])

  const hasError = !jobId || !sessionId || isError || data?.status === 'error'

  return (
    <div className="qz qz-center">
      {hasError ? (
        <div className="qz-stack">
          <KuaaMascotLogo size={96} radius={26} />
          <p className="qz-error-text">{data?.message ?? 'Erro ao gerar questões. Tente novamente.'}</p>
          <button type="button" className="k-btn k-btn-yellow" onClick={() => navigate(-1)}>Voltar à trilha</button>
        </div>
      ) : count > 0 ? (
        <div className="qz-stack" aria-live="polite">
          <div key={count} className="qz-count">{count}</div>
          <p className="qz-sub">Respira. Lê com calma.</p>
        </div>
      ) : (
        <div className="qz-stack" style={{ animation: 'kup .4s ease' }}>
          <span className="qz-owl-float"><KuaaMascotLogo size={120} radius={32} alt="Sabiá" /></span>
          <h1 className="qz-loading-title">Preparando sua sessão</h1>
          <p className="qz-sub" role="status">A Sabiá está separando questões no seu nível<span style={{ animation: 'kblink 1s steps(1) infinite' }}>…</span></p>
        </div>
      )}
    </div>
  )
}
