import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import QuestionMedia from '../../components/quiz/QuestionMedia'
import { SimuladoExam } from '../Quiz/SimuladoPage'
import { fetchExamExplanation, useExamActions, useExamAttempt } from '../../hooks/useExams'
import type { ExamAttempt, ExamQuestion } from '../../types/exams'
import '../Quiz/SimuladoPage.css'
import './Exams.css'

const LEVELS = ['Muito fácil', 'Fácil', 'Média', 'Difícil', 'Muito difícil']

function Explanation({ attemptId, question }: { attemptId: string; question: ExamQuestion }) {
  const [text, setText] = useState<string | null>(question.explanation ?? null)
  const [byAi, setByAi] = useState(Boolean(question.explanationByAi))
  const [state, setState] = useState<'idle' | 'loading' | 'failed'>('idle')
  const load = async () => {
    setState('loading')
    try {
      const res = await fetchExamExplanation(attemptId, question.id)
      if (res.explanation) { setText(res.explanation); setByAi(res.explanationByAi); setState('idle') } else setState('failed')
    } catch { setState('failed') }
  }
  if (text) return <div className="k-tip"><i className="bi bi-lightbulb" aria-hidden="true" /><div>{text}{byAi && <small className="ex-ai"> · Explicação escrita com apoio de IA; gabarito oficial.</small>}</div></div>
  return <div className="ex-explain">
    <button type="button" className="k-btn k-btn-outline is-sm" disabled={state === 'loading'} onClick={() => void load()}>
      <i className="bi bi-lightbulb" aria-hidden="true" />{state === 'loading' ? 'Preparando explicação…' : 'Ver explicação'}
    </button>
    {state === 'failed' && <span className="k-muted" role="status">Explicação indisponível agora. Tente de novo em instantes.</span>}
  </div>
}

function Results({ attempt }: { attempt: ExamAttempt }) {
  const total = attempt.questions.length
  const correct = attempt.correct ?? 0
  const wrong = attempt.wrong ?? 0
  const bySubject = new Map<string, { ok: number; total: number }>()
  for (const q of attempt.questions) {
    const row = bySubject.get(q.subjectName) ?? { ok: 0, total: 0 }
    row.total++
    if (attempt.answers[q.id] && attempt.answers[q.id] === q.correctOptionId) row.ok++
    bySubject.set(q.subjectName, row)
  }
  return (
    <div className="k-page is-narrow">
      <p className="k-eyebrow">Resultado · {attempt.vestibularName}</p>
      <section className="sim-score">
        <div><div className="sim-score-label">Acertos</div><div className="sim-score-value">{correct}<small className="ex-of">/{total}</small></div><div className="sim-score-band">{Math.round((100 * correct) / Math.max(1, total))}% da prova</div></div>
        <div className="sim-score-stats">
          <div><strong>{correct}</strong><small>acertos</small></div>
          <div><strong>{wrong}</strong><small>erros</small></div>
          <div><strong>{total - correct - wrong}</strong><small>em branco</small></div>
        </div>
      </section>
      <div className="k-card is-md">
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Por matéria</div>
        <ul className="ex-subjects">{[...bySubject.entries()].sort((a, b) => b[1].total - a[1].total).map(([name, row]) => (
          <li key={name}><span>{name}</span><span className="k-mono">{row.ok}/{row.total}</span></li>
        ))}</ul>
        <p className="k-muted" style={{ fontSize: 13, margin: '12px 0 0' }}>Contagem de acertos, não é a nota TRI do ENEM.</p>
      </div>
      <section className="k-card is-flush" aria-label="Correção da prova">
        <h2 className="k-h3" style={{ padding: '22px 24px 8px' }}>Correção</h2>
        {attempt.questions.map((q) => {
          const answer = attempt.answers[q.id]
          const status = !answer ? 'Em branco' : answer === q.correctOptionId ? 'Correta' : 'Errada'
          const color = status === 'Correta' ? 'var(--k-verde)' : status === 'Errada' ? 'var(--k-vinho)' : 'var(--k-faint)'
          const correctOption = q.options.find((o) => o.id === q.correctOptionId)
          const selected = q.options.find((o) => o.id === answer)
          return (
            <details key={q.id} className="sim-review">
              <summary><span className="sim-review-bar" style={{ background: color }} /><span className="k-mono">{String(q.order).padStart(3, '0')}</span><span className="sim-review-subj">{q.subjectName}</span><span style={{ color, fontWeight: 600, fontSize: 13 }}>{status}</span></summary>
              <div className="sim-review-body">
                <p className="k-mono" style={{ fontSize: 12, color: 'var(--k-faint)', margin: 0 }}>{q.origin}{q.difficulty ? ` · Nível: ${LEVELS[q.difficulty - 1]}` : ''}</p>
                <p className="sim-review-q">{q.body}</p>
                <QuestionMedia {...q} />
                <p>Sua resposta: {selected ? `${selected.id}) ${selected.text}` : 'Em branco'}</p>
                {correctOption && <p><strong>Gabarito oficial:</strong> {correctOption.id}) {correctOption.text}</p>}
                <Explanation attemptId={attempt.id} question={q} />
              </div>
            </details>
          )
        })}
      </section>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link to="/provas" className="k-btn k-btn-primary">Outras provas<i className="bi bi-arrow-right" aria-hidden="true" /></Link>
        <Link to="/dashboard" className="k-btn k-btn-outline">Voltar ao início</Link>
      </div>
    </div>
  )
}

export default function ExamAttemptPage() {
  const { id = '' } = useParams()
  const { data: attempt, isLoading, isError, refetch } = useExamAttempt(id)
  const actions = useExamActions(id)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flagged, setFlagged] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef<string | null>(null)
  const pending = useRef<Promise<unknown> | null>(null)
  const autoFinished = useRef(false)
  const { mutateAsync: finishAsync, isPending: finishing } = actions.finish

  useEffect(() => {
    if (attempt && initialized.current !== attempt.id) {
      setAnswers(attempt.answers); setFlagged(attempt.flagged); setCurrentIdx(0); initialized.current = attempt.id
    }
  }, [attempt])

  const finish = useCallback(async () => {
    setError(null)
    try { await pending.current?.catch(() => undefined); await finishAsync() } catch { setError('Não foi possível entregar. Suas respostas salvas foram mantidas. Tente de novo.') }
  }, [finishAsync])

  useEffect(() => {
    if (!attempt || attempt.finishedAt) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((new Date(attempt.startedAt).getTime() + attempt.totalSeconds * 1000 - Date.now()) / 1000))
      setTimeLeft(left)
      if (left === 0 && !autoFinished.current) { autoFinished.current = true; void finish() }
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [attempt, finish])

  let content: React.ReactNode
  if (isLoading) content = <div className="k-page"><div className="k-state">Carregando prova…</div></div>
  else if (isError || !attempt) content = <div className="k-page"><div className="k-state" role="alert"><p style={{ margin: 0 }}>Não foi possível carregar a prova.</p><button className="k-btn k-btn-primary is-sm" onClick={() => void refetch()}>Tentar novamente</button></div></div>
  else if (attempt.finishedAt) content = <Results attempt={attempt} />
  else {
    const questions = attempt.questions.map((q) => ({ ...q, subjectId: q.subjectSlug }))
    content = <>
      <p className="k-eyebrow ex-runner-title">{attempt.vestibularName} · {attempt.area}{attempt.language ? ` · ${attempt.language === 'espanhol' ? 'Espanhol' : 'Inglês'}` : ''}</p>
      <SimuladoExam
        attempt={{ questions }}
        localAnswers={answers}
        localFlagged={flagged}
        currentIdx={currentIdx}
        timeLeft={timeLeft}
        finishLabel="Entregar prova"
        onAnswer={async (optionId) => {
          const questionId = questions[currentIdx]!.id
          if (pending.current || timeLeft === 0) return
          setError(null)
          const request = actions.answer.mutateAsync({ questionId, optionId })
          pending.current = request
          try { await request; setAnswers((prev) => ({ ...prev, [questionId]: optionId })) } catch { setError('A resposta não foi salva. Toque na alternativa de novo.') } finally { pending.current = null }
        }}
        onFlag={async () => {
          const questionId = questions[currentIdx]!.id
          try { await actions.flag.mutateAsync(questionId); setFlagged((prev) => prev.includes(questionId) ? prev.filter((x) => x !== questionId) : [...prev, questionId]) } catch { setError('Não foi possível marcar a questão.') }
        }}
        onNext={() => setCurrentIdx((i) => Math.min(i + 1, questions.length - 1))}
        onPrev={() => setCurrentIdx((i) => Math.max(i - 1, 0))}
        onJump={setCurrentIdx}
        onFinish={() => void finish()}
        isFinishing={finishing}
        isSaving={actions.answer.isPending || actions.flag.isPending}
      />
    </>
  }
  return <AppLayout>{error && <p role="alert" className="k-alert sim-error">{error}</p>}{content}</AppLayout>
}
