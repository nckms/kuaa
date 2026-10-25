import { useEffect, useRef, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import type { SessionSummary } from '../../types/quiz'
import { useSessionSummary } from '../../hooks/useQuiz'
import { useAuthStore } from '../../stores/auth.store'
import KuaaMascotLogo from '../../components/ui/KuaaMascotLogo'
import './QuizPage.css'

const CONFETTI_COLORS = ['#FFDC5C', '#FF8FA3', '#7FE0B0', '#C9A3FF']

function useCountUp(target: number, duration: number, active: boolean): number {
  const [count, setCount] = useState(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) return
    let raf: number
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const progress = Math.min((ts - startRef.current) / duration, 1)
      setCount(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, active])

  return count
}

function Confetti() {
  return (
    <div className="qz-confetti" aria-hidden="true">
      {Array.from({ length: 36 }).map((_, k) => (
        <span key={k} style={{
          left: `${(k * 2.8 + ((k * 37) % 11)) % 100}%`, width: k % 3 ? 8 : 6, height: k % 3 ? 14 : 6, borderRadius: k % 3 ? 2 : '50%',
          background: CONFETTI_COLORS[k % 4], animation: `kfall ${2.4 + (k % 5) * 0.4}s cubic-bezier(.3,.6,.5,1) ${(k % 9) * 0.12}s 1 forwards`,
        }} />
      ))}
    </div>
  )
}

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const reducedMotion = useAuthStore((state) => state.user?.preferences?.reducedMotion ?? false)

  const routeSummary = location.state as SessionSummary | null
  const { data: fetchedSummary, isLoading, isError } = useSessionSummary(sessionId, !routeSummary)
  const summary = routeSummary ?? fetchedSummary ?? null

  const [animating, setAnimating] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [reviewTab, setReviewTab] = useState<'all' | 'wrong' | 'right'>('all')
  useEffect(() => { const t = setTimeout(() => setAnimating(true), 300); return () => clearTimeout(t) }, [])

  const xpCount = useCountUp(summary?.xpEarned ?? 0, 1100, animating)

  if (isLoading && !summary) {
    return <div className="qz qz-center"><p className="qz-sub">Carregando resultado...</p></div>
  }

  if (!summary || isError) {
    return (
      <div className="qz qz-center">
        <div className="qz-stack">
          <p className="qz-sub">Resultado não encontrado.</p>
          <button type="button" className="k-btn k-btn-yellow" onClick={() => navigate('/trilha')}>Voltar à trilha</button>
        </div>
      </div>
    )
  }

  const { topicName, vestibularSlug, correct, wrong, isPerfect, accuracy, newMasteryLevel, newAchievements, levelUp, newLevel, questions } = summary
  const answered = correct + wrong
  const pct = Math.round(accuracy * 100)
  const title = isPerfect ? 'Gabaritou!' : accuracy >= 0.5 ? 'Boa evolução.' : 'Faz parte do processo.'
  const sub = isPerfect ? `${topicName} está quase dominado.` : `${correct} de ${answered + summary.skipped} certas.${wrong > 0 ? ' Revise as que você errou antes de seguir.' : ''}`
  const review = questions.filter((question) => reviewTab === 'all' || (reviewTab === 'wrong' ? !question.isCorrect : question.isCorrect))

  return (
    <div className="qz">
      {accuracy >= 0.75 && !reducedMotion && <Confetti />}
      <div className="qz-result">
        <KuaaMascotLogo size={104} radius={28} />
        <p className="qz-eyebrow">SESSÃO CONCLUÍDA</p>
        <h1>{title}</h1>
        <p className="qz-result-sub">{sub}</p>

        <div className="qz-tiles">
          <div><strong style={{ color: '#7FE0B0' }}>{correct}</strong><small>acertos</small></div>
          <div><strong style={{ color: '#FF8FA3' }}>{wrong}</strong><small>erros</small></div>
          <div><strong>{pct}%</strong><small>de acerto</small></div>
        </div>

        <div className="qz-panel qz-xp-row">
          <strong>+{xpCount}</strong>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#BFAFC5', marginBottom: 8 }}><span>Domínio em {topicName}</span><span className="k-mono">{newMasteryLevel}/5</span></div>
            <div className="qz-bar"><span style={{ width: animating ? `${(newMasteryLevel / 5) * 100}%` : '0%' }} /></div>
          </div>
        </div>

        {summary.skipped > 0 && <p className="qz-result-sub" style={{ fontSize: 13 }}>{summary.skipped} questão(ões) em branco. O percentual considera todas as questões da sessão.</p>}
        {summary.generation?.targetSatisfied === false && <p className="qz-result-sub" style={{ fontSize: 13 }}>A dificuldade das questões disponíveis nesta sessão ficou fora da faixa planejada.</p>}
        {levelUp && <div className="qz-panel" style={{ border: '1px solid #531A61' }}><h2>Você subiu para o Nível {newLevel}!</h2></div>}
        {newAchievements.map((achievement) => (
          <div key={achievement.slug} className="qz-panel" style={{ borderLeft: '3px solid var(--k-amarelo)' }}>
            <h2 style={{ color: 'var(--k-amarelo)', display: 'flex', justifyContent: 'space-between', gap: 8 }}>{achievement.name}{achievement.xpBonus > 0 && <span className="qz-xp">+{achievement.xpBonus} XP</span>}</h2>
            <p>{achievement.description}</p>
          </div>
        ))}
        {summary.performance && (
          <section className="qz-panel" aria-label="Evolução neste tópico">
            <h2>{summary.performance.decision === 'advance' ? 'Você avançou neste tópico' : summary.performance.decision === 'reinforce' ? 'Próximo passo: reforçar' : summary.performance.decision === 'collect' ? 'Construindo seu diagnóstico' : 'Consolidando seu domínio'}</h2>
            <p>{summary.performance.reason}</p>
            <p style={{ marginTop: 8, color: '#A797AE', fontSize: 13 }}>Domínio: {summary.performance.previousLevel}/5 → {summary.performance.newLevel}/5 · {summary.performance.evidenceCount} resposta(s) consideradas.</p>
          </section>
        )}

        <div className="qz-result-actions">
          <button type="button" className="qz-btn-ghost" onClick={() => setShowReview((open) => !open)} aria-expanded={showReview}><i className="bi bi-list-check" aria-hidden="true" />{showReview ? 'Esconder revisão' : 'Revisar questões'}</button>
          {summary.guideAvailable && (wrong > 0 || summary.skipped > 0) && (
            <button type="button" className="qz-btn-ghost" onClick={() => navigate(`/estudar/${summary.topicId}`)}><i className="bi bi-book" aria-hidden="true" />Estudar dúvidas</button>
          )}
          <button type="button" className="k-btn k-btn-yellow" style={{ minHeight: 52, padding: '0 28px' }} onClick={() => navigate(`/trilha/${vestibularSlug}`)}>Próximo tópico <i className="bi bi-arrow-right" aria-hidden="true" /></button>
        </div>

        {showReview && (
          <div className="qz-review">
            <div className="qz-review-tabs" role="group" aria-label="Filtrar revisão">
              {([['all', 'Todas'], ['wrong', 'Erros'], ['right', 'Acertos']] as const).map(([id, label]) => (
                <button key={id} type="button" aria-pressed={reviewTab === id} onClick={() => setReviewTab(id)}>{label}</button>
              ))}
            </div>
            {review.map((question) => {
              const mine = question.options.find((option) => option.id === question.userAnswerId)
              const right = question.options.find((option) => option.isCorrect)
              const dot = question.isCorrect ? '#7FE0B0' : '#FF8FA3'
              return (
                <div key={question.id} className="qz-review-item">
                  <span className="qz-review-dot" style={{ background: dot }}><i className={`bi ${question.isCorrect ? 'bi-check-lg' : 'bi-x-lg'}`} aria-hidden="true" /></span>
                  <div>
                    <div className="qz-review-q">{question.body}</div>
                    <div className="qz-review-ans">Você: <span style={{ color: dot }}>{mine ? `${mine.id}) ${mine.text}` : 'Em branco'}</span> · Correta: <span style={{ color: '#7FE0B0' }}>{right ? `${right.id}) ${right.text}` : '—'}</span></div>
                    <div className="qz-review-exp">{question.explanation}</div>
                  </div>
                </div>
              )
            })}
            {review.length === 0 && <p className="qz-sub">Nenhuma questão neste filtro.</p>}
            <button type="button" className="k-link-btn" style={{ color: 'var(--k-amarelo)', marginTop: 8 }}
              onClick={() => navigate(`/revisao/${sessionId}`, { state: { questions, topicId: summary.topicId, topicName, vestibularSlug, correct, total: correct + wrong + summary.skipped, accuracy } })}>
              Abrir revisão completa e praticar erros<i className="bi bi-arrow-right" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
