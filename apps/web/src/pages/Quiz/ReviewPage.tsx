import { useLocation, useNavigate, useParams } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import QuestionMedia from '../../components/quiz/QuestionMedia'
import type { ReviewQuestion } from '../../types/quiz'
import { useGenerateQuiz, useSessionSummary } from '../../hooks/useQuiz'
import './ReviewPage.css'

interface LocationState {
  questions: ReviewQuestion[]
  topicId?: string
  topicName: string
  vestibularSlug: string
  correct: number
  total: number
  accuracy: number
}

export default function ReviewPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const routeState = location.state as LocationState | null
  const { data: summary, isLoading, isError } = useSessionSummary(sessionId, !routeState?.topicId)
  const generateQuiz = useGenerateQuiz()
  const state: LocationState | null = routeState ?? (summary ? {
    questions: summary.questions,
    topicId: summary.topicId,
    topicName: summary.topicName,
    vestibularSlug: summary.vestibularSlug,
    correct: summary.correct,
    total: summary.correct + summary.wrong + summary.skipped,
    accuracy: summary.accuracy,
  } : null)
  const topicId = state?.topicId ?? summary?.topicId

  if (isLoading && !state) {
    return <AppLayout><div className="k-page"><div className="k-state">Carregando revisão...</div></div></AppLayout>
  }

  if (!state || !state.questions || (isError && !state.topicId)) {
    return (
      <AppLayout>
        <div className="k-page"><div className="k-state">
          <p style={{ margin: 0 }}>Dados da revisão não encontrados.</p>
          <button type="button" className="k-btn k-btn-primary is-sm" onClick={() => navigate(-1)}>Voltar</button>
        </div></div>
      </AppLayout>
    )
  }

  const { questions, topicName, vestibularSlug, correct, total, accuracy } = state

  return (
    <AppLayout>
      <div className="k-page is-slim">
        <nav aria-label="Breadcrumb" className="review-crumbs">
          <button type="button" className="k-link-btn" onClick={() => navigate(`/trilha/${vestibularSlug}`)}><i className="bi bi-arrow-left" aria-hidden="true" />Trilha</button>
          <i className="bi bi-chevron-right" aria-hidden="true" /><span>Revisão</span>
        </nav>
        <header className="k-page-head">
          <div><p className="k-eyebrow">Revisão da sessão</p><h1 className="k-h1">{topicName}</h1></div>
          <div className="review-chips">
            <span className="k-chip">{correct} de {total} corretas</span>
            <span className="k-tag" style={{ background: 'var(--k-amarelo-soft)', color: '#7A5A00' }}>{Math.round(accuracy * 100)}% de acerto</span>
          </div>
        </header>

        {questions.map((q, idx) => {
          const selected = q.options.find((opt) => opt.id === q.userAnswerId)
          const correctOption = q.options.find((opt) => opt.isCorrect)
          const status = q.userAnswerId === null ? 'Em branco' : q.isCorrect ? 'Correta' : 'Errada'
          return (
            <article key={q.id} className="k-card is-md review-item">
              <div className="review-item-head">
                <span className="k-mono review-num">Questão {String(idx + 1).padStart(2, '0')}</span>
                <span className="k-tag" style={q.isCorrect ? { background: 'var(--k-verde-soft)', color: 'var(--k-verde)' } : { background: 'var(--k-vinho-soft)', color: 'var(--k-vinho)' }}>{status}</span>
              </div>
              <p className="review-body">{q.body}</p>
              <QuestionMedia {...q} />
              <div className="review-options">
                {q.options.map((opt) => {
                  const isUserWrong = opt.id === q.userAnswerId && !q.isCorrect
                  return (
                    <div key={opt.id} className={`k-option${opt.isCorrect ? ' is-correct' : isUserWrong ? ' is-wrong' : ''}`} style={{ cursor: 'default', opacity: !opt.isCorrect && !isUserWrong ? 0.65 : 1 }}>
                      <span className="k-letter">{opt.id}</span><span style={{ flex: 1, fontSize: 15 }}>{opt.text}</span>
                      {opt.isCorrect && <i className="bi bi-check-lg" style={{ color: 'var(--k-verde)' }} aria-label="Correta" />}
                      {isUserWrong && <i className="bi bi-x-lg" style={{ color: 'var(--k-vinho)' }} aria-label="Sua resposta" />}
                    </div>
                  )
                })}
              </div>
              {!q.isCorrect && selected && correctOption && (
                <div className="review-comparison" aria-label="Comparação das respostas">
                  <div><strong>Sua resposta</strong><p>{selected.id}. {selected.text}</p></div>
                  <div><strong>Resposta correta</strong><p>{correctOption.id}. {correctOption.text}</p></div>
                </div>
              )}
              <div className="k-tip"><i className="bi bi-lightbulb" aria-hidden="true" /><div><strong>Explicação:</strong> {q.explanation}</div></div>
              {!q.isCorrect && q.userAnswerId !== null && (
                <div className="review-practice">
                  <button type="button" className="k-btn k-btn-primary is-sm" disabled={!topicId || generateQuiz.isPending}
                    onClick={() => { if (topicId) generateQuiz.mutate({ topicId, sourceQuestionId: q.id, count: 3 }) }}>
                    <i className="bi bi-play-fill" aria-hidden="true" />{generateQuiz.isPending && generateQuiz.variables?.sourceQuestionId === q.id ? 'Preparando questões...' : 'Praticar este erro'}
                  </button>
                  {generateQuiz.isError && generateQuiz.variables?.sourceQuestionId === q.id && <p role="alert">Não foi possível preparar a prática. Tente novamente.</p>}
                </div>
              )}
            </article>
          )
        })}

        <button type="button" className="k-btn k-btn-primary is-lg" style={{ alignSelf: 'flex-end' }} onClick={() => navigate(`/trilha/${vestibularSlug}`)}>Voltar à trilha <i className="bi bi-arrow-right" aria-hidden="true" /></button>
      </div>
    </AppLayout>
  )
}
