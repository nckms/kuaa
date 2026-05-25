import { useLocation, useNavigate, useParams } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import type { ReviewQuestion } from '../../types/quiz'

interface LocationState {
  questions: ReviewQuestion[]
  topicName: string
  vestibularSlug: string
  correct: number
  total: number
  accuracy: number
}

export default function ReviewPage() {
  const location = useLocation()
  const navigate = useNavigate()
  useParams<{ sessionId: string }>()
  const state = location.state as LocationState | null

  if (!state || !state.questions) {
    return (
      <AppLayout>
        <div style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: '#9ca3af' }}>Dados da revisão não encontrados.</p>
          <button onClick={() => navigate(-1)} style={{ marginTop: 16, backgroundColor: '#531A61', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter, Arial, sans-serif' }}>Voltar</button>
        </div>
      </AppLayout>
    )
  }

  const { questions, topicName, vestibularSlug, correct, total, accuracy } = state

  return (
    <AppLayout>
      <div style={{ fontFamily: 'Inter, Arial, sans-serif', paddingBottom: 80 }}>

        {/* Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#fff', borderBottom: '1px solid #f3f4f6', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button onClick={() => navigate(`/trilha/${vestibularSlug}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#531A61', fontSize: 18 }}>←</button>
          <p style={{ fontFamily: "'Questrial', sans-serif", fontSize: 20, color: '#1a1a1a', flex: 1 }}>Revisão · {topicName}</p>
          <span style={{ backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: 12, padding: '4px 12px', borderRadius: 999 }}>{correct} de {total} corretas</span>
          <span style={{ backgroundColor: 'rgba(255,220,92,.2)', color: '#531A61', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 999 }}>{Math.round(accuracy * 100)}% de acerto</span>
        </div>

        {/* Lista */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 860, margin: '0 auto' }}>
          {questions.map((q, idx) => (
            <div key={q.id} style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ backgroundColor: '#f3f4f6', color: '#9ca3af', fontSize: 12, padding: '3px 10px', borderRadius: 999 }}>Questão {idx + 1}</span>
                <span style={{ backgroundColor: q.isCorrect ? 'rgba(16,185,129,.12)' : 'rgba(132,0,51,.1)', color: q.isCorrect ? '#10b981' : '#840033', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999 }}>
                  {q.isCorrect ? 'Correta' : 'Errada'}
                </span>
              </div>
              <p style={{ fontSize: 16, color: '#1a1a1a', lineHeight: 1.7, marginBottom: 16 }}>{q.body}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {q.options.map((opt) => {
                  const isCorrect = opt.isCorrect
                  const isUserWrong = opt.id === q.userAnswerId && !q.isCorrect
                  const isOther = !isCorrect && opt.id !== q.userAnswerId

                  let bg = '#f9fafb'
                  let border = 'transparent'
                  let letterColor = '#9ca3af'
                  let textColor = '#6b7280'

                  if (isCorrect) { bg = 'rgba(16,185,129,.08)'; border = '#10b981'; letterColor = '#10b981'; textColor = '#1a1a1a' }
                  if (isUserWrong) { bg = 'rgba(132,0,51,.06)'; border = '#840033'; letterColor = '#840033'; textColor = '#1a1a1a' }

                  return (
                    <div key={opt.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderRadius: 12, backgroundColor: bg, border: `1.5px solid ${border === 'transparent' ? 'transparent' : border}` }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: letterColor, width: 20, flexShrink: 0, marginTop: 1 }}>{opt.id}</span>
                      <span style={{ fontSize: 14, color: textColor, lineHeight: 1.5, flex: 1, opacity: isOther ? 0.7 : 1 }}>{opt.text}</span>
                      {isCorrect && <span style={{ color: '#10b981', fontSize: 16, flexShrink: 0 }}>✓</span>}
                      {isUserWrong && <span style={{ color: '#840033', fontSize: 16, flexShrink: 0 }}>✗</span>}
                    </div>
                  )
                })}
              </div>

              <div style={{ backgroundColor: '#f3eaf7', borderLeft: '4px solid #531A61', borderRadius: '0 12px 12px 0', padding: '14px 16px' }}>
                <p style={{ fontSize: 13, color: '#531A61', fontWeight: 700, marginBottom: 6 }}>Explicação</p>
                <p style={{ fontSize: 14, color: 'rgba(83,26,97,.8)', lineHeight: 1.6 }}>{q.explanation}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé fixo */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTop: '1px solid #f3f4f6', padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', zIndex: 10 }}>
          <button
            onClick={() => navigate(`/trilha/${vestibularSlug}`)}
            style={{ backgroundColor: '#531A61', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 12, cursor: 'pointer', fontSize: 15, fontWeight: 600, fontFamily: 'Inter, Arial, sans-serif' }}
          >
            Voltar à trilha
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
