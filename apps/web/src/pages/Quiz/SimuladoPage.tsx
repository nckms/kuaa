import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import QuestionMedia from '../../components/quiz/QuestionMedia'
import { useAuthStore } from '../../stores/auth.store'
import {
  useCurrentSimulado,
  useStartSimulado,
  useSaveAnswer,
  useToggleFlag,
  useFinishSimulado,
} from '../../hooks/useSimulado'
import type { SimuladoAttempt, SimuladoQuestion, FinishResult } from '../../types/simulado'
import { subjectTheme } from '../../utils/subjectTheme'
import { INDEX_BANDS, indexBand } from '../../utils/kuaaIndex'
import './SimuladoPage.css'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${d.getUTCDate()} de ${months[d.getUTCMonth()]}`
}

// ─── Intro ────────────────────────────────────────────────────────────────────

function SimuladoIntro({ vestibularName, onStart, isStarting }: { vestibularName?: string; onStart: () => void; isStarting: boolean }) {
  const exam = vestibularName ?? 'ENEM'
  return (
    <div className="k-page is-narrow">
      <p className="k-eyebrow">{exam} · Semana atual</p>
      <h1 className="sim-title">Simulado semanal</h1>
      <p className="sim-lead">Questões no estilo {exam}, cronometradas. O resultado vira nota de 300 a 1000 e atualiza seu Índice Kuaa. Não é prova oficial.</p>
      <div className="k-grid sim-facts" style={{ ['--min' as string]: '160px' }}>
        {[
          { icon: 'bi-list-check', v: 'Até 45', l: 'questões' },
          { icon: 'bi-stopwatch', v: '90 min', l: 'de prova' },
          { icon: 'bi-calendar3', v: 'Dom', l: 'novo toda semana' },
          { icon: 'bi-speedometer2', v: '300–1000', l: 'escala da nota' },
        ].map((fact) => (
          <div key={fact.l} className="k-card is-sm"><i className={`bi ${fact.icon}`} aria-hidden="true" /><strong className="k-num">{fact.v}</strong><small>{fact.l}</small></div>
        ))}
      </div>
      <div className="k-card is-sm sim-rules">
        <div><i className="bi bi-check-lg" aria-hidden="true" />Navegue livremente e marque questões pra revisar</div>
        <div><i className="bi bi-check-lg" aria-hidden="true" />Gabarito comentado assim que você entregar</div>
        <div><i className="bi bi-check-lg" aria-hidden="true" />Se sair, o tempo continua contando</div>
      </div>
      <button type="button" onClick={onStart} disabled={isStarting} className="k-btn k-btn-primary is-lg has-glow" style={{ alignSelf: 'flex-start', marginTop: 12 }}>
        {isStarting ? 'Carregando...' : 'Iniciar simulado'}<i className="bi bi-arrow-right" aria-hidden="true" />
      </button>
    </div>
  )
}

// ─── Results ──────────────────────────────────────────────────────────────────

function SimuladoResults({ attempt, result }: { attempt: SimuladoAttempt; result: FinishResult | null }) {
  const score = result?.score ?? attempt.score ?? 0
  const correct = result?.correct ?? attempt.correct ?? 0
  const wrong = result?.wrong ?? attempt.wrong ?? 0
  const total = result?.total ?? attempt.questions.length
  const skipped = total - correct - wrong
  const band = indexBand(score)
  const used = attempt.finishedAt ? Math.min(attempt.totalSeconds, Math.round((new Date(attempt.finishedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000)) : null

  return (
    <div className="k-page is-narrow">
      <p className="k-eyebrow">Resultado · {attempt.vestibularName}</p>
      <section className="sim-score">
        <div><div className="sim-score-label">Sua nota</div><div className="sim-score-value">{score}</div><div className="sim-score-band">Faixa {band.name}</div></div>
        <div className="sim-score-stats">
          <div><strong>{correct}</strong><small>acertos</small></div>
          <div><strong>{wrong}</strong><small>erros</small></div>
          <div><strong>{skipped}</strong><small>em branco</small></div>
          {used !== null && <div><strong>{formatTime(used)}</strong><small>usados</small></div>}
        </div>
      </section>
      <div className="k-card is-md">
        <div style={{ fontWeight: 600, marginBottom: 14 }}>Onde sua nota fica na escala</div>
        <div className="k-track is-lg"><span style={{ width: `${Math.max(0, Math.min(100, ((score - 300) / 700) * 100))}%` }} /></div>
        <div className="sim-bands">{INDEX_BANDS.map((item, index) => <div key={item.name} className={index === band.index ? 'is-on' : ''}><small className="k-mono">{item.range}</small><span>{item.name}</span></div>)}</div>
        <p className="k-muted" style={{ fontSize: 13, margin: '14px 0 0' }}>Próximo simulado disponível em <strong>{formatDate(attempt.nextWeekStart)}</strong>.</p>
      </div>

      <section className="k-card is-flush" aria-label="Revisão do simulado">
        <h2 className="k-h3" style={{ padding: '22px 24px 8px' }}>Gabarito comentado</h2>
        {attempt.questions.map((question, index) => {
          const answer = attempt.answers[question.id]
          const correctOption = question.options.find((option) => option.id === question.correctOptionId)
          const selected = question.options.find((option) => option.id === answer)
          const status = !answer ? 'Em branco' : !correctOption ? 'Respondida' : answer === correctOption.id ? 'Correta' : 'Errada'
          const color = status === 'Correta' ? 'var(--k-verde)' : status === 'Errada' ? 'var(--k-vinho)' : 'var(--k-faint)'
          return (
            <details key={question.id} className="sim-review">
              <summary><span className="sim-review-bar" style={{ background: color }} /><span className="k-mono">{String(index + 1).padStart(2, '0')}</span><span className="sim-review-subj">{question.subjectName}</span><span style={{ color, fontWeight: 600, fontSize: 13 }}>{status}</span></summary>
              <div className="sim-review-body">
                <p className="sim-review-q">{question.body}</p>
                <QuestionMedia {...question} />
                <p>Sua resposta: {selected ? `${selected.id}) ${selected.text}` : 'Em branco'}</p>
                {correctOption && <p><strong>Resposta correta:</strong> {correctOption.id}) {correctOption.text}</p>}
                <div className="k-tip"><i className="bi bi-lightbulb" aria-hidden="true" /><div>{question.explanation ?? 'Explicação não disponível nesta tentativa antiga.'}</div></div>
              </div>
            </details>
          )
        })}
      </section>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link to="/indice" className="k-btn k-btn-primary">Ver meu Índice<i className="bi bi-arrow-right" aria-hidden="true" /></Link>
        <Link to="/dashboard" className="k-btn k-btn-outline">Voltar ao início</Link>
      </div>
    </div>
  )
}

// ─── Exam ─────────────────────────────────────────────────────────────────────

function SimuladoExam({
  attempt, localAnswers, localFlagged, currentIdx, timeLeft, onAnswer, onFlag, onNext, onPrev, onJump, onFinish, isFinishing, isSaving,
}: {
  attempt: SimuladoAttempt
  localAnswers: Record<string, string>
  localFlagged: string[]
  currentIdx: number
  timeLeft: number
  onAnswer: (optionId: string) => void
  onFlag: () => void
  onNext: () => void
  onPrev: () => void
  onJump: (idx: number) => void
  onFinish: () => void
  isFinishing: boolean
  isSaving: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  const questions = attempt.questions
  const q: SimuladoQuestion = questions[currentIdx]!
  const selected = localAnswers[q.id]
  const isFlagged = localFlagged.includes(q.id)
  const answeredCount = Object.keys(localAnswers).length
  const flaggedCount = localFlagged.length
  const blank = questions.length - answeredCount
  const locked = isSaving || isFinishing || timeLeft === 0
  const theme = subjectTheme(q.subjectSlug)

  const map = (
    <>
      <div className="sim-legend"><span><i style={{ background: 'var(--k-roxo)' }} />Respondida</span><span><i style={{ background: 'var(--k-amarelo)' }} />Marcada</span><span><i style={{ border: '1.5px solid #D9D0D6' }} />Em branco</span></div>
      <div className="sim-map">
        {questions.map((item, idx) => {
          const flagged = localFlagged.includes(item.id)
          const done = !!localAnswers[item.id]
          return (
            <button key={item.id} type="button" onClick={() => onJump(idx)} aria-label={`Questão ${item.order}${done ? ', respondida' : ''}${flagged ? ', marcada' : ''}`} aria-current={idx === currentIdx ? 'true' : undefined}
              className={`${flagged ? 'is-flag' : done ? 'is-done' : ''}${idx === currentIdx ? ' is-current' : ''}`}>{item.order}</button>
          )
        })}
      </div>
      <div className="sim-summary">{answeredCount} respondidas · {flaggedCount} marcadas · {blank} em branco</div>
      <button type="button" className="k-btn k-btn-dark is-block" onClick={() => setConfirming(true)} disabled={isFinishing || isSaving}>{isFinishing ? 'Entregando...' : 'Entregar simulado'}</button>
    </>
  )

  return (
    <div className="sim-exam">
      <div className="sim-exam-main">
        <div className="sim-bar">
          <span className="k-mono">Questão {currentIdx + 1} de {questions.length}</span>
          <div className="sim-bar-track"><span style={{ width: `${(answeredCount / questions.length) * 100}%` }} /></div>
          <span className={`sim-timer${timeLeft < 600 ? ' is-low' : ''}`} role="timer" aria-label="Tempo restante"><i className="bi bi-stopwatch" aria-hidden="true" />{formatTime(timeLeft)}</span>
        </div>
        <div className="sim-question" key={q.id}>
          <span className="k-tag" style={{ color: theme.color, background: theme.soft }}>{q.subjectName}</span>
          <p className="sim-q-body">{q.body}</p>
          <QuestionMedia {...q} />
          <div className="sim-options">
            {q.options.map(({ id, text }) => (
              <button key={id} type="button" className="k-option" onClick={() => onAnswer(id)} disabled={locked} aria-pressed={selected === id}>
                <span className="k-letter">{id}</span><span style={{ flex: 1 }}>{text}</span>
              </button>
            ))}
          </div>
          <div className="sim-nav">
            <button type="button" className="k-btn k-btn-outline" onClick={onPrev} disabled={currentIdx === 0}><i className="bi bi-arrow-left" aria-hidden="true" />Anterior</button>
            <button type="button" className={`k-btn sim-flag${isFlagged ? ' is-on' : ''}`} onClick={onFlag} disabled={locked} aria-pressed={isFlagged}><i className="bi bi-flag" aria-hidden="true" />{isFlagged ? 'Marcada' : 'Marcar'}</button>
            <button type="button" className="k-btn k-btn-primary" style={{ marginLeft: 'auto' }} onClick={onNext} disabled={currentIdx === questions.length - 1}>Próxima<i className="bi bi-arrow-right" aria-hidden="true" /></button>
          </div>
          <details className="sim-map-mobile"><summary>Mapa da prova e entrega</summary><div>{map}</div></details>
        </div>
      </div>
      <aside className="sim-aside" aria-label="Mapa da prova">
        <div style={{ fontWeight: 600, fontSize: 15 }}>Mapa da prova</div>
        {map}
      </aside>

      {confirming && (
        <div className="k-overlay" onClick={() => setConfirming(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="sim-confirm-title" className="k-dialog" style={{ maxWidth: 420, gap: 16 }} onClick={(event) => event.stopPropagation()}>
            <h3 id="sim-confirm-title" className="k-h3" style={{ fontSize: 20 }}>Entregar agora?</h3>
            <p style={{ margin: 0, fontFamily: 'var(--k-read)', fontSize: 15, color: 'var(--k-muted)', lineHeight: 1.5 }}>
              {blank > 0 ? `Você ainda tem ${blank} questões em branco${flaggedCount ? ` e ${flaggedCount} marcadas pra revisar` : ''}. Questões em branco contam como erro.` : 'Todas respondidas. Bora ver a nota?'}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="k-btn k-btn-outline" style={{ flex: 1 }} onClick={() => setConfirming(false)}>Revisar</button>
              <button type="button" className="k-btn k-btn-primary" style={{ flex: 1 }} disabled={isFinishing} onClick={() => { setConfirming(false); onFinish() }}>Entregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SimuladoPage() {
  const firstVestibularSlug = useAuthStore((s) => s.firstVestibularSlug)
  const slug = firstVestibularSlug ?? ''
  const vestibularName = useAuthStore((s) => s.enrollments.find((e) => e.vestibular.slug === slug)?.vestibular.name)

  const { data: attempt, isLoading, isError, refetch } = useCurrentSimulado(slug)
  const startMutation = useStartSimulado(slug)
  const answerMutation = useSaveAnswer()
  const flagMutation = useToggleFlag()
  const finishMutation = useFinishSimulado()

  const [currentIdx, setCurrentIdx] = useState(0)
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({})
  const [localFlagged, setLocalFlagged] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [result, setResult] = useState<FinishResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pendingSave = useRef<Promise<unknown> | null>(null)
  const finishing = useRef(false)
  const autoFinished = useRef<string | null>(null)
  const initializedAttempt = useRef<string | null>(null)
  const { mutateAsync: finishAttempt } = finishMutation

  // Sync local state when attempt loads
  useEffect(() => {
    if (attempt && initializedAttempt.current !== attempt.id) {
      setLocalAnswers(attempt.answers)
      setLocalFlagged(attempt.flagged)
      setCurrentIdx(0)
      setResult(null)
      initializedAttempt.current = attempt.id
    }
  }, [attempt])

  const handleFinish = useCallback(async () => {
    if (!attempt || finishing.current) return
    finishing.current = true
    setError(null)
    try {
      await pendingSave.current?.catch(() => undefined)
      setResult(await finishAttempt(attempt.id))
    } catch {
      setError('Não foi possível finalizar. Suas respostas salvas foram mantidas. Tente novamente.')
    } finally {
      finishing.current = false
    }
  }, [attempt, finishAttempt])

  // Timer
  useEffect(() => {
    if (!attempt || attempt.finishedAt || result) return
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((new Date(attempt.startedAt).getTime()
        + attempt.totalSeconds * 1000 - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining === 0 && autoFinished.current !== attempt.id) {
        autoFinished.current = attempt.id
        void handleFinish()
      }
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [attempt, result, handleFinish])

  async function handleStart() {
    setError(null)
    try {
      await startMutation.mutateAsync()
    } catch (err: unknown) {
      // 409 = already attempted this week; refetch to show the existing attempt/results
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) void refetch()
      else setError('Não foi possível iniciar o simulado. Tente novamente.')
    }
  }

  async function handleAnswer(optionId: string) {
    if (!attempt || pendingSave.current || finishing.current || timeLeft === 0) return
    const qId = attempt.questions[currentIdx]!.id
    setError(null)
    const request = answerMutation.mutateAsync({ attemptId: attempt.id, questionId: qId, optionId })
    pendingSave.current = request
    try {
      await request
      setLocalAnswers((prev) => ({ ...prev, [qId]: optionId }))
    } catch {
      setError('A resposta não foi salva. Selecione a alternativa novamente para tentar salvar.')
    } finally {
      pendingSave.current = null
    }
  }

  async function handleFlag() {
    if (!attempt || flagMutation.isPending || finishing.current || timeLeft === 0) return
    const qId = attempt.questions[currentIdx]!.id
    setError(null)
    try {
      await flagMutation.mutateAsync({ attemptId: attempt.id, questionId: qId })
      setLocalFlagged((prev) => prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId])
    } catch {
      setError('Não foi possível salvar a marcação. Tente novamente.')
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const errorMessage = error ? <p role="alert" className="k-alert sim-error">{error}</p> : null
  let content: React.ReactNode

  if (!slug) content = <div className="k-page"><div className="k-state">Nenhum vestibular selecionado.</div></div>
  else if (isLoading) content = <div className="k-page"><div className="k-state">Carregando...</div></div>
  else if (isError) {
    content = <div className="k-page"><div className="k-state" role="alert">
      <p style={{ margin: 0 }}>Não foi possível carregar o simulado.</p>
      <div style={{ display: 'flex', gap: 10 }}><button className="k-btn k-btn-primary is-sm" onClick={() => void refetch()}>Tentar novamente</button><Link to="/dashboard" className="k-btn k-btn-outline is-sm">Voltar ao início</Link></div>
    </div></div>
  } else if (!attempt) content = <SimuladoIntro vestibularName={vestibularName} onStart={handleStart} isStarting={startMutation.isPending} />
  else if (result || attempt.finishedAt) content = <SimuladoResults attempt={attempt} result={result} />
  else {
    content = <SimuladoExam
      attempt={attempt}
      localAnswers={localAnswers}
      localFlagged={localFlagged}
      currentIdx={currentIdx}
      timeLeft={timeLeft}
      onAnswer={handleAnswer}
      onFlag={handleFlag}
      onNext={() => setCurrentIdx((i) => Math.min(i + 1, attempt.questions.length - 1))}
      onPrev={() => setCurrentIdx((i) => Math.max(i - 1, 0))}
      onJump={(idx) => setCurrentIdx(idx)}
      onFinish={handleFinish}
      isFinishing={finishMutation.isPending}
      isSaving={answerMutation.isPending || flagMutation.isPending}
    />
  }

  return <AppLayout>{errorMessage}{content}</AppLayout>
}
