import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSession, useAnswer, useFinish } from '../../hooks/useQuiz'
import { useAuthStore } from '../../stores/auth.store'
import QuestionMedia from '../../components/quiz/QuestionMedia'
import type { AnswerResult } from '../../types/quiz'
import './QuizPage.css'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function QuizPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const userHearts = useAuthStore((state) => state.user?.hearts)

  const { data: session, isLoading, isError } = useSession(sessionId)
  const answerMutation = useAnswer(sessionId ?? '')
  const finishMutation = useFinish(sessionId ?? '')

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [answeredMap, setAnsweredMap] = useState<Record<string, AnswerResult>>({})
  const [showExit, setShowExit] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const restoredSession = useRef<string | null>(null)

  useEffect(() => {
    const interval = setInterval(() => setElapsedTime((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const goToQuestion = useCallback((idx: number) => {
    setCurrentIndex(idx)
    setSelectedOption(null)
    setAnswerResult(null)
    setIsConfirmed(false)
    setQuestionStartTime(Date.now())
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!session) return
    const restored = Object.fromEntries(
      (session.answeredResults ?? []).map((answer) => [answer.questionId, answer]),
    )
    setAnsweredMap(restored)
    if (restoredSession.current !== session.sessionId) {
      restoredSession.current = session.sessionId
      const next = session.questions.findIndex((question) => !session.answeredIds.includes(question.id))
      goToQuestion(next >= 0 ? next : 0)
    }
  }, [session, goToQuestion])

  if (isLoading) {
    return <div className="qz qz-center"><p className="qz-sub">Carregando sessão...</p></div>
  }

  if (isError || !session) {
    return (
      <div className="qz qz-center">
        <div className="qz-stack">
          <p className="qz-error-text">Erro ao carregar a sessão.</p>
          <button type="button" className="k-btn k-btn-yellow" onClick={() => navigate(-1)}>Voltar</button>
        </div>
      </div>
    )
  }

  const { questions, topicName, subjectName } = session
  const total = questions.length
  const currentQ = questions[currentIndex]!
  const answeredCount = Object.keys(answeredMap).length
  const prevResult = answeredMap[currentQ.id]
  const displayResult = isConfirmed ? answerResult : prevResult ?? null
  const answered = !!displayResult
  const isLast = currentIndex >= total - 1
  const hearts = Object.values(answeredMap).pop()?.heartsRemaining ?? userHearts
  const busy = answerMutation.isPending || finishMutation.isPending

  async function handleConfirm() {
    if (!selectedOption) return
    const timeSpentMs = Math.min(300000, Math.max(0, Date.now() - questionStartTime))
    try {
      const result = await answerMutation.mutateAsync({ questionId: currentQ.id, optionId: selectedOption, timeSpentMs })
      setAnswerResult(result)
      setIsConfirmed(true)
      setAnsweredMap((prev) => ({ ...prev, [currentQ.id]: { ...result, selectedOptionId: selectedOption } }))
    } catch (err) {
      console.error('Erro ao responder:', err)
    }
  }

  function handleNext() {
    if (!isLast) goToQuestion(currentIndex + 1)
    else finishMutation.mutate()
  }

  function optionClass(optId: string) {
    if (!displayResult) return selectedOption === optId ? ' is-selected' : ''
    if (optId === displayResult.correctOptionId) return ' is-correct'
    if (optId === displayResult.selectedOptionId && !displayResult.isCorrect) return ' is-wrong'
    return ' is-dim'
  }

  const correctLetter = displayResult?.correctOptionId
  const ok = displayResult?.isCorrect

  return (
    <div className="qz">
      <header className="qz-top">
        <button type="button" className="qz-exit" aria-label="Sair do quiz" onClick={() => setShowExit(true)} disabled={busy}><i className="bi bi-x-lg" aria-hidden="true" /></button>
        <div className="qz-progress" role="progressbar" aria-label="Progresso da sessão" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answeredCount}>
          <span style={{ width: `${(answeredCount / total) * 100}%` }} />
        </div>
        <span className="qz-timer"><i className="bi bi-stopwatch" aria-hidden="true" />{formatTime(elapsedTime)}</span>
        {hearts != null && <span className="qz-hearts" aria-label={`${hearts} vidas`}><i className="bi bi-heart-fill" aria-hidden="true" />{hearts}</span>}
      </header>

      <main className="qz-main">
        <div className="qz-meta">
          <span className="qz-tag">{subjectName}</span><span>{topicName}</span><span className="k-mono qz-counter">{currentIndex + 1} / {total}</span>
        </div>
        <details className="qz-info">
          <summary>Sobre estas questões</summary>
          <p>{session.generation?.source === 'AI_GENERATED' ? 'Questões criadas com apoio de IA. Confira dados importantes nas explicações.' : 'Questões selecionadas do acervo de estudos.'}</p>
          {session.generation?.targetSatisfied === false && <p>Algumas questões podem estar fora da dificuldade prevista.</p>}
          {(session.generation?.deliveredCount ?? total) < (session.generation?.requestedCount ?? total) && <p>Esta sessão tem menos questões porque não havia outras adequadas para este tópico.</p>}
          {session.generation?.remediationSourceQuestionId && session.generation.source === 'CURATED' && <p>Esta prática retoma o tópico do erro, mas pode abordar outra parte do conteúdo.</p>}
        </details>
        {(answerMutation.isError || finishMutation.isError) && <p role="alert" className="qz-alert">Não foi possível salvar. Confira sua conexão e tente novamente.</p>}
        <h2 className="qz-question">{currentQ.body}</h2>
        <div className="qz-media"><QuestionMedia key={currentQ.id} {...currentQ} /></div>
        <div className="qz-options">
          {currentQ.options.map((opt) => (
            <button type="button" key={opt.id} disabled={answered || busy} aria-pressed={selectedOption === opt.id || displayResult?.selectedOptionId === opt.id}
              onClick={() => setSelectedOption(opt.id)} className={`qz-option${optionClass(opt.id)}`}>
              <span className="qz-letter">{opt.id}</span><span style={{ flex: 1 }}>{opt.text}</span>
            </button>
          ))}
        </div>
      </main>

      <footer className={`qz-feedback${answered ? (ok ? ' is-ok' : ' is-bad') : ''}`}>
        <div className="qz-feedback-inner">
          {answered && displayResult ? (
            <div className="qz-feedback-text" role="status">
              <span className="qz-feedback-icon"><i className={`bi ${ok ? 'bi-check-lg' : 'bi-x-lg'}`} aria-hidden="true" /></span>
              <div>
                <div className="qz-feedback-title">{ok ? 'Mandou bem!' : `Quase. A correta é ${correctLetter}.`}{displayResult.xpDelta > 0 && <span className="qz-xp">+{displayResult.xpDelta} XP</span>}</div>
                <div className="qz-feedback-exp">{displayResult.explanation}</div>
              </div>
            </div>
          ) : <div className="qz-feedback-hint">Escolha uma alternativa e confirme</div>}
          {answered
            ? <button type="button" className={`qz-action ${ok ? 'is-ok' : 'is-bad'}`} onClick={handleNext} disabled={finishMutation.isPending}>{finishMutation.isPending ? 'Finalizando...' : isLast ? 'Ver resultado' : 'Continuar'}</button>
            : <button type="button" className={`qz-action${selectedOption ? ' is-ready' : ''}`} onClick={handleConfirm} disabled={!selectedOption || busy}>{answerMutation.isPending ? 'Verificando...' : 'Confirmar'}</button>}
        </div>
      </footer>

      {showExit && (
        <div className="k-overlay" onClick={() => setShowExit(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="quiz-exit-title" className="k-dialog" style={{ maxWidth: 420 }} onClick={(event) => event.stopPropagation()}>
            <h3 id="quiz-exit-title" className="k-h3" style={{ fontSize: 20 }}>Sair da sessão?</h3>
            <p style={{ margin: 0, fontFamily: 'var(--k-read)', fontSize: 15, color: 'var(--k-muted)', lineHeight: 1.5 }}>
              {answeredCount} de {total} questões respondidas.{answeredCount < total ? ' Você pode finalizar agora (as restantes ficam em branco) ou sair e continuar depois.' : ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button type="button" className="k-btn k-btn-primary is-block" onClick={() => finishMutation.mutate()} disabled={finishMutation.isPending}>{finishMutation.isPending ? 'Finalizando...' : 'Finalizar e ver resultado'}</button>
              <button type="button" className="k-btn k-btn-outline is-block" onClick={() => navigate(`/trilha/${session.vestibularSlug}`)}>Sair e continuar depois</button>
              <button type="button" className="k-link-btn" style={{ alignSelf: 'center', padding: 8 }} onClick={() => setShowExit(false)}>Voltar às questões</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
