import { useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useJobStatus } from '../../hooks/useQuiz'

const WingGlyph = () => (
  <svg width="48" height="41" viewBox="0 0 28 24" fill="none" style={{ color: '#FFDC5C' }}>
    <path d="M2 20 C6 12 14 8 26 4 C20 10 18 16 20 22 C14 18 8 18 2 20Z" fill="currentColor" opacity="0.9"/>
    <path d="M2 20 C8 16 14 14 20 22 C14 22 8 22 2 20Z" fill="currentColor" opacity="0.5"/>
  </svg>
)

export default function QuizLoadingPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [searchParams] = useSearchParams()
  const jobId = searchParams.get('jobId')
  const navigate = useNavigate()

  const { data, isError } = useJobStatus(jobId, sessionId ?? null)

  useEffect(() => {
    if (data?.status === 'ready' && data.sessionId) {
      navigate(`/quiz/${data.sessionId}`, { replace: true })
    }
  }, [data, navigate])

  const hasError = isError || data?.status === 'error'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#2a0d33', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', padding: 24, textAlign: 'center' }}>
      {hasError ? (
        <>
          <p style={{ color: '#fca5a5', fontSize: 16, marginBottom: 24 }}>
            {data?.message ?? 'Erro ao gerar questões. Tente novamente.'}
          </p>
          <button
            onClick={() => navigate(-1)}
            style={{ backgroundColor: '#531A61', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 12, cursor: 'pointer', fontSize: 15, fontFamily: 'Arial, sans-serif' }}
          >
            Voltar à trilha
          </button>
        </>
      ) : (
        <>
          <div style={{ animation: 'float 2s ease-in-out infinite', marginBottom: 32 }}>
            <WingGlyph />
          </div>
          <p style={{ fontFamily: "'Questrial', sans-serif", fontSize: 24, color: '#fff', marginBottom: 12 }}>
            Preparando suas questões...
          </p>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.55)', marginBottom: 32 }}>
            Nossa IA está criando questões personalizadas para você
          </p>
          <div style={{ width: 280, height: 6, backgroundColor: 'rgba(255,255,255,.1)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #531A61, #840033)', animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }} />
          </div>
        </>
      )}
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  )
}
