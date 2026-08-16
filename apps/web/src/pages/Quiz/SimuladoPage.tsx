import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import KuaaLogo from '../../components/ui/KuaaLogo'
import KuaaIcon from '../../components/ui/KuaaIcon'
import { useAuthStore } from '../../stores/auth.store'
import {
  useCurrentSimulado,
  useStartSimulado,
  useSaveAnswer,
  useToggleFlag,
  useFinishSimulado,
} from '../../hooks/useSimulado'
import type { SimuladoAttempt, SimuladoQuestion, FinishResult } from '../../types/simulado'

type QuestionStatus = 'answered' | 'flagged' | 'current' | 'unanswered'

function getStatusColor(status: QuestionStatus): string {
  switch (status) {
    case 'answered': return '#531A61'
    case 'flagged': return '#FFDC5C'
    case 'current': return '#840033'
    case 'unanswered': return 'rgba(26,10,31,.08)'
  }
}

function getStatusTextColor(status: QuestionStatus): string {
  switch (status) {
    case 'answered': return '#fff'
    case 'flagged': return '#2a0d33'
    case 'current': return '#fff'
    case 'unanswered': return 'var(--k-tinta-3)'
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const day = d.getUTCDate()
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${day} de ${months[d.getUTCMonth()]}`
}

// ─── Landing ──────────────────────────────────────────────────────────────────

function SimuladoLanding({
  vestibularName,
  onStart,
  isStarting,
}: {
  vestibularName?: string
  onStart: () => void
  isStarting: boolean
}) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--k-creme)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: "'Questrial', Arial, sans-serif" }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #2a0d33, #531A61)', display: 'grid', placeItems: 'center', margin: '0 auto 28px' }}>
          <KuaaIcon name="sparkle" size={36} color="#FFDC5C" />
        </div>

        <p style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 500, fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--k-tinta-3)', marginBottom: 12 }}>
          {vestibularName ?? 'ENEM'} · Esta semana
        </p>

        <h1 style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 32, color: '#2a0d33', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 16 }}>
          Simulado<br />da Semana
        </h1>

        <p style={{ fontSize: 15, color: 'var(--k-tinta-2)', lineHeight: 1.65, marginBottom: 36 }}>
          45 questões distribuídas entre todas as áreas do {vestibularName ?? 'ENEM'}. Você tem <strong>90 minutos</strong>. Um novo simulado é publicado todo domingo.
        </p>

        <button
          onClick={onStart}
          disabled={isStarting}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 36px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #531A61, #840033)', color: '#fff', fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: '.04em', cursor: isStarting ? 'not-allowed' : 'pointer', opacity: isStarting ? 0.7 : 1 }}
        >
          {isStarting ? 'Carregando...' : 'Iniciar Simulado →'}
        </button>

        <div style={{ marginTop: 28 }}>
          <Link to="/dashboard" style={{ fontSize: 13, color: 'var(--k-tinta-3)', textDecoration: 'none' }}>
            ← Voltar ao Dashboard
          </Link>
        </div>
      </div>
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
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0

  function getFaixa(s: number): { label: string; color: string } {
    if (s < 500) return { label: 'Iniciante', color: '#9ca3af' }
    if (s < 700) return { label: 'Básico', color: '#531A61' }
    if (s < 850) return { label: 'Forte', color: '#840033' }
    return { label: 'Elite', color: '#FFDC5C' }
  }

  const faixa = getFaixa(score)
  const nextWeek = formatDate(attempt.nextWeekStart)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--k-creme)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: "'Questrial', Arial, sans-serif" }}>
      <div style={{ maxWidth: 520, width: '100%' }}>
        <div style={{ background: 'linear-gradient(135deg, #2a0d33, #531A61)', borderRadius: 24, padding: '40px 36px', textAlign: 'center', marginBottom: 20 }}>
          <p style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 500, fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 16 }}>
            Resultado · {attempt.vestibularName}
          </p>
          <div style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 72, color: '#FFDC5C', letterSpacing: '-0.05em', lineHeight: 0.9, marginBottom: 12 }}>
            {score}
          </div>
          <div style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 600, fontSize: 13, color: faixa.color === '#FFDC5C' ? '#FFDC5C' : 'rgba(255,255,255,.7)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
            {faixa.label}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Acertos', value: correct, color: '#531A61' },
            { label: 'Erros', value: wrong, color: '#840033' },
            { label: 'Em branco', value: skipped, color: '#9ca3af' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 16, padding: '20px 16px', textAlign: 'center', border: '1.5px solid var(--k-line)' }}>
              <div style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 32, color, letterSpacing: '-0.04em' }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--k-tinta-3)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1.5px solid var(--k-line)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--k-tinta-2)' }}>Aproveitamento</span>
            <span style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 15, color: '#531A61' }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: 'var(--k-line)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #531A61, #840033)', borderRadius: 999 }} />
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--k-tinta-3)', textAlign: 'center', marginBottom: 24 }}>
          Próximo simulado disponível em <strong>{nextWeek}</strong>
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/indice" style={{ padding: '12px 24px', borderRadius: 12, background: '#531A61', color: '#fff', textDecoration: 'none', fontFamily: "'Unbounded', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '.05em' }}>
            Ver Índice Kuaa
          </Link>
          <Link to="/dashboard" style={{ padding: '12px 24px', borderRadius: 12, border: '1.5px solid var(--k-line-2)', color: 'var(--k-tinta-2)', textDecoration: 'none', fontFamily: "'Unbounded', sans-serif", fontWeight: 500, fontSize: 12, letterSpacing: '.05em' }}>
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Exam ─────────────────────────────────────────────────────────────────────

function SimuladoExam({
  attempt,
  localAnswers,
  localFlagged,
  currentIdx,
  timeLeft,
  onAnswer,
  onFlag,
  onNext,
  onPrev,
  onJump,
  onFinish,
  isFinishing,
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
}) {
  const questions = attempt.questions
  const q: SimuladoQuestion = questions[currentIdx]!
  const selected = localAnswers[q.id]
  const isFlagged = localFlagged.includes(q.id)
  const answeredCount = Object.keys(localAnswers).length
  const flaggedCount = localFlagged.length
  const progress = ((attempt.totalSeconds - timeLeft) / attempt.totalSeconds) * 100

  return (
    <div style={{ minHeight: '100vh', background: 'var(--k-creme)', display: 'flex', flexDirection: 'column', fontFamily: "'Questrial', Arial, sans-serif" }}>

      {/* Top bar */}
      <div style={{ background: 'var(--k-roxo-deep)', padding: '0 32px', height: 62, display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <KuaaLogo size={32} dark />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.15)' }} />
          <span style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 600, fontSize: 12, color: 'rgba(255,255,255,.7)', letterSpacing: '.05em' }}>
            {attempt.vestibularName} · Simulado Completo
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, maxWidth: 480, margin: '0 auto' }}>
          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.12)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#840033,#531A61,#FFDC5C)', borderRadius: 999 }} />
          </div>
          <span style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 13, color: '#FFDC5C', whiteSpace: 'nowrap' }}>
            {answeredCount} / {questions.length}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onFinish}
            disabled={isFinishing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: 'rgba(255,220,92,.15)', color: '#FFDC5C', fontFamily: "'Unbounded', sans-serif", fontSize: 11, fontWeight: 700, cursor: isFinishing ? 'not-allowed' : 'pointer', letterSpacing: '.08em' }}
          >
            {isFinishing ? 'finalizando...' : 'finalizar'}
          </button>
        </div>
      </div>

      {/* Question header */}
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--k-line)', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 500, fontSize: 11, color: 'var(--k-tinta-3)', letterSpacing: '.15em', textTransform: 'uppercase' }}>
            questão {q.order} de {questions.length}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 600, fontSize: 15, color: 'var(--k-tinta)', letterSpacing: '-0.02em', margin: 0 }}>
            {q.subjectName}
          </h2>
          <button
            onClick={onFlag}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 999, border: '1px solid var(--k-line-2)', background: isFlagged ? 'var(--k-amarelo-soft)' : '#fff', color: isFlagged ? 'var(--k-tinta)' : 'var(--k-tinta-3)', fontSize: 11, fontFamily: "'Unbounded', sans-serif", fontWeight: 500, cursor: 'pointer', letterSpacing: '.1em', textTransform: 'uppercase' }}
          >
            <KuaaIcon name="flag" size={13} color={isFlagged ? '#840033' : 'var(--k-tinta-3)'} />
            marcar p/ revisar
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, padding: '24px 32px', alignItems: 'start' }}>

        {/* Question card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '32px 36px', boxShadow: 'var(--k-shadow-sm)' }}>
          <p style={{ color: 'var(--k-tinta-2)', fontSize: 15, lineHeight: 1.65, marginBottom: 28 }}>
            {q.body}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map(({ id, text }) => {
              const isSelected = selected === id
              return (
                <button
                  key={id}
                  onClick={() => onAnswer(id)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', borderRadius: 12, border: '1.5px solid', borderColor: isSelected ? '#840033' : 'var(--k-line-2)', background: isSelected ? 'rgba(132,0,51,.06)' : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all .12s' }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: isSelected ? '#840033' : 'var(--k-creme)', color: isSelected ? '#fff' : 'var(--k-tinta-3)', display: 'grid', placeItems: 'center', fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                    {id}
                  </div>
                  <span style={{ fontSize: 14, color: isSelected ? 'var(--k-tinta)' : 'var(--k-tinta-2)', lineHeight: 1.55, paddingTop: 3 }}>
                    {text}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Bottom nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--k-line)' }}>
            <button
              onClick={onPrev}
              disabled={currentIdx === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: '1px solid var(--k-line-2)', background: '#fff', color: 'var(--k-tinta-2)', fontFamily: "'Unbounded', sans-serif", fontSize: 12, fontWeight: 500, cursor: currentIdx === 0 ? 'not-allowed' : 'pointer', opacity: currentIdx === 0 ? 0.4 : 1, letterSpacing: '.05em' }}
            >
              ← anterior
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <KuaaIcon name="clock" size={14} color="var(--k-tinta-3)" />
              <span style={{ fontSize: 12, color: 'var(--k-tinta-3)', fontFamily: "'Unbounded', sans-serif" }}>
                {formatTime(timeLeft)} restante
              </span>
            </div>

            <button
              onClick={onNext}
              disabled={currentIdx === questions.length - 1}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 10, border: 'none', background: 'var(--k-roxo-deep)', color: '#FFDC5C', fontFamily: "'Unbounded', sans-serif", fontSize: 12, fontWeight: 700, cursor: currentIdx === questions.length - 1 ? 'not-allowed' : 'pointer', opacity: currentIdx === questions.length - 1 ? 0.4 : 1, letterSpacing: '.05em' }}
            >
              próxima →
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Timer */}
          <div style={{ background: 'var(--k-amarelo)', borderRadius: 18, padding: '22px 24px' }}>
            <div style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 54, color: 'var(--k-roxo-deep)', letterSpacing: '-0.045em', lineHeight: 0.92, textAlign: 'center', marginBottom: 12 }}>
              {formatTime(timeLeft)}
            </div>
            <div style={{ height: 6, background: 'rgba(26,10,31,.12)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(0, 100 - (timeLeft / attempt.totalSeconds) * 100)}%`, height: '100%', background: 'var(--k-vinho)', borderRadius: 999 }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--k-tinta-2)', textAlign: 'center', marginTop: 8 }}>tempo restante</div>
          </div>

          {/* Mini stats */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: 'var(--k-shadow-sm)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 28, color: 'var(--k-roxo)', letterSpacing: '-0.04em' }}>{answeredCount}</div>
              <div style={{ fontSize: 11, color: 'var(--k-tinta-3)' }}>respondidas</div>
              <div style={{ fontSize: 10, color: 'var(--k-tinta-3)' }}>de {questions.length}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 28, color: '#FFDC5C', letterSpacing: '-0.04em' }}>{String(flaggedCount).padStart(2, '0')}</div>
              <div style={{ fontSize: 11, color: 'var(--k-tinta-3)' }}>marcadas</div>
              <div style={{ fontSize: 10, color: 'var(--k-tinta-3)' }}>p/ revisar</div>
            </div>
          </div>

          {/* Question map */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: 'var(--k-shadow-sm)' }}>
            <div style={{ fontSize: 10, fontFamily: "'Unbounded', sans-serif", fontWeight: 500, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--k-tinta-3)', marginBottom: 12 }}>
              mapa de questões
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 4 }}>
              {questions.map((qs, idx) => {
                let status: QuestionStatus = 'unanswered'
                if (idx === currentIdx) status = 'current'
                else if (localFlagged.includes(qs.id)) status = 'flagged'
                else if (localAnswers[qs.id]) status = 'answered'
                return (
                  <div
                    key={qs.id}
                    onClick={() => onJump(idx)}
                    style={{ width: '100%', aspectRatio: '1', borderRadius: 5, background: getStatusColor(status), border: status === 'current' ? '2px solid #FFDC5C' : '2px solid transparent', display: 'grid', placeItems: 'center', fontSize: 8, fontFamily: "'Unbounded', sans-serif", fontWeight: 700, color: getStatusTextColor(status), cursor: 'pointer' }}
                  >
                    {qs.order}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { color: '#531A61', label: 'respondida' },
                { color: '#FFDC5C', label: 'marcada' },
                { color: '#840033', label: 'atual' },
                { color: 'rgba(26,10,31,.08)', label: 'pendente' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 9, color: 'var(--k-tinta-3)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div style={{ background: 'var(--k-roxo-deep)', borderRadius: 16, padding: '20px 22px' }}>
            <div style={{ fontSize: 10, fontFamily: "'Unbounded', sans-serif", fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--k-amarelo)', marginBottom: 10 }}>
              respira ✦
            </div>
            <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic', fontSize: 14, color: 'rgba(255,255,255,.8)', lineHeight: 1.65, margin: 0 }}>
              {answeredCount >= questions.length / 2
                ? `Você já respondeu ${answeredCount} questões — isso é mais da metade. Confie no seu preparo e elimine as alternativas absurdas primeiro.`
                : `Mantenha o ritmo — responda o que sabe primeiro e volte às difíceis depois.`}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .simulado-body { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SimuladoPage() {
  const firstVestibularSlug = useAuthStore((s) => s.firstVestibularSlug)
  const slug = firstVestibularSlug ?? ''

  const { data: attempt, isLoading } = useCurrentSimulado(slug)
  const startMutation = useStartSimulado(slug)
  const answerMutation = useSaveAnswer()
  const flagMutation = useToggleFlag()
  const finishMutation = useFinishSimulado()

  const [currentIdx, setCurrentIdx] = useState(0)
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({})
  const [localFlagged, setLocalFlagged] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [result, setResult] = useState<FinishResult | null>(null)

  // Sync local state when attempt loads
  useEffect(() => {
    if (attempt) {
      setLocalAnswers(attempt.answers)
      setLocalFlagged(attempt.flagged)
    }
  }, [attempt?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Timer
  useEffect(() => {
    if (!attempt || attempt.finishedAt || result) return
    const elapsed = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000)
    const initial = Math.max(0, attempt.totalSeconds - elapsed)
    setTimeLeft(initial)
    if (initial === 0) return
    const interval = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [attempt?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStart() {
    await startMutation.mutateAsync()
  }

  function handleAnswer(optionId: string) {
    if (!attempt) return
    const qId = attempt.questions[currentIdx]!.id
    setLocalAnswers((prev) => ({ ...prev, [qId]: optionId }))
    answerMutation.mutate({ attemptId: attempt.id, questionId: qId, optionId })
  }

  function handleFlag() {
    if (!attempt) return
    const qId = attempt.questions[currentIdx]!.id
    setLocalFlagged((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    )
    flagMutation.mutate({ attemptId: attempt.id, questionId: qId })
  }

  async function handleFinish() {
    if (!attempt) return
    const res = await finishMutation.mutateAsync(attempt.id)
    setResult(res)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--k-creme)' }}>
        <p style={{ color: 'var(--k-tinta-3)', fontFamily: "'Unbounded', sans-serif", fontSize: 13 }}>Carregando...</p>
      </div>
    )
  }

  if (!slug) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--k-creme)' }}>
        <p style={{ color: 'var(--k-tinta-3)', fontSize: 14 }}>Nenhum vestibular selecionado.</p>
      </div>
    )
  }

  if (!attempt) {
    return (
      <SimuladoLanding
        vestibularName={undefined}
        onStart={handleStart}
        isStarting={startMutation.isPending}
      />
    )
  }

  if (result || attempt.finishedAt) {
    return <SimuladoResults attempt={attempt} result={result} />
  }

  return (
    <SimuladoExam
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
    />
  )
}
