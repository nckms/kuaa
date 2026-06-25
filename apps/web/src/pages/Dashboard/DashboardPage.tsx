import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import ProgressBar from '../../components/ui/ProgressBar'
import { useAuthStore } from '../../stores/auth.store'
import { useTrail } from '../../hooks/useTrail'
import { useGenerateQuiz } from '../../hooks/useQuiz'
import type { TrailTopic } from '../../types/trail'

const EMPTY_WEEK = [0, 0, 0, 0, 0, 0, 0]
const DAY_LABELS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM']

function topicScore(topic: TrailTopic): number {
  if (topic.progress.completed) return 1
  if (topic.progress.sessionsCount > 0 || topic.progress.answeredQuestionsCount > 0) return 0.5
  return 0
}

function BarChart({ days }: { days: number[] }) {
  const max = Math.max(...days, 1)
  const todayIdx = (new Date().getDay() + 6) % 7

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 90 }}>
      {days.map((val, i) => {
        const heightPct = val > 0 ? (val / max) * 100 : 6
        const isToday = i === todayIdx
        const isHighest = val === max && val > 0

        return (
          <div key={DAY_LABELS[i]} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
            {isHighest && <span style={{ fontSize: 10, fontWeight: 700, color: '#b347d9' }}>{val}q</span>}
            <div
              style={{
                width: '100%',
                maxWidth: 28,
                height: `${Math.max(heightPct, 6)}%`,
                borderRadius: 8,
                background: isHighest ? 'linear-gradient(180deg, #b347d9, #531A61)' : 'var(--roxo-light, #f3eaf7)',
                boxShadow: isHighest ? '0 4px 16px -4px rgba(179,71,217,.5)' : 'none',
                outline: isToday ? '2px solid #FFDC5C' : 'none',
                outlineOffset: 1,
              }}
            />
            <span style={{ fontSize: 10, color: 'var(--muted, #6b7280)', letterSpacing: '.04em' }}>{DAY_LABELS[i]}</span>
          </div>
        )
      })}
    </div>
  )
}

function AgendaCard({ borderColor, label, sublabel, time, badge }: { borderColor: string; label: string; sublabel: string; time: string; badge?: string }) {
  return (
    <div className="agenda-card" style={{ borderLeft: `3px solid ${borderColor}`, backgroundColor: 'var(--surface, #fff)', borderRadius: '0 16px 16px 0', padding: '14px 18px', minWidth: 210, boxShadow: 'var(--shadow-xs)' }}>
      <p style={{ fontSize: 11, color: 'var(--muted, #6b7280)', marginBottom: 4, fontWeight: 500 }}>{time}</p>
      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text, #1a1a1a)', fontFamily: "'Questrial', sans-serif", marginBottom: 6 }}>{label}</p>
      {badge ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#840033', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999, letterSpacing: '.06em', textTransform: 'uppercase' }}>{badge}</span>
      ) : (
        <span style={{ fontSize: 12, color: 'var(--muted, #6b7280)' }}>{sublabel}</span>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { user, firstVestibularSlug, enrollments } = useAuthStore()
  const { data: trail } = useTrail(firstVestibularSlug ?? '')
  const navigate = useNavigate()
  const generateQuiz = useGenerateQuiz()

  const allTopics = useMemo(
    () => trail?.subjects.flatMap((subject) => subject.topics.map((topic) => ({ ...topic, subjectName: subject.name }))) ?? [],
    [trail],
  )

  const progressPercent = useMemo(() => {
    if (!trail || trail.summary.totalTopics === 0) return 0
    const score = allTopics.reduce((sum, topic) => sum + topicScore(topic), 0)
    return Math.round((score / trail.summary.totalTopics) * 100)
  }, [allTopics, trail])

  const weekData = trail?.summary.weeklyAnsweredQuestions ?? EMPTY_WEEK
  const weekAnsweredQuestions = weekData.reduce((sum, val) => sum + val, 0)
  const totalAnsweredQuestions = trail?.summary.answeredQuestions ?? 0
  const totalSessions = trail?.summary.totalSessions ?? 0
  const finishedSessions = trail?.summary.finishedSessions ?? 0
  const answeredTopics = trail?.summary.answeredTopics ?? 0
  const completedTopics = trail?.summary.completedTopics ?? 0

  const subjectMetrics = useMemo(() => (
    trail?.subjects.slice(0, 3).map((subject) => {
      const total = subject.topics.length
      const score = subject.topics.reduce((sum, topic) => sum + topicScore(topic), 0)
      return { name: subject.name, percent: total > 0 ? Math.round((score / total) * 100) : 0 }
    }) ?? []
  ), [trail])

  const vestibularName = trail?.vestibular.name ?? (enrollments[0]?.vestibular.name ?? 'ENEM')
  const subtitleMessage = !trail || answeredTopics === 0
    ? 'Voce ainda nao comecou sua trilha. Que tal agora?'
    : completedTopics === 0
    ? 'Voce ja respondeu uma sessao. Continue para consolidar o topico.'
    : completedTopics < 5
    ? 'Voce esta nos primeiros passos. Continue!'
    : 'Voce esta no ritmo certo. Nao pare agora.'

  const now = new Date()
  const dayName = now.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase()
  const dateStr = now.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }).toUpperCase()
  const trailHref = firstVestibularSlug ? `/trilha/${firstVestibularSlug}` : '/trilha'

  const currentTopic = allTopics.find((topic) => topic.progress.unlocked && !topic.progress.completed)
  const inProgressTopic = allTopics.find((topic) => topic.progress.unlocked && !topic.progress.completed && (topic.progress.sessionsCount > 0 || topic.progress.answeredQuestionsCount > 0))
  const recommendedTopic = inProgressTopic ?? currentTopic

  function handleContinueStudy() {
    if (currentTopic) {
      generateQuiz.mutate({ topicId: currentTopic.id, count: 5 })
      return
    }

    navigate(trailHref)
  }

  return (
    <AppLayout>
      <div className="dashboard-page" style={{ padding: '32px 28px 80px', minHeight: '100%', fontFamily: 'Inter, Arial, sans-serif', background: 'var(--bg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 20 }} className="dashboard-grid">
          <div className="dashboard-card" style={{ backgroundColor: 'var(--surface)', borderRadius: 24, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
            <p style={{ fontSize: 11, color: '#9ca3af', letterSpacing: '.1em', marginBottom: 8 }}>{dayName}, {dateStr}</p>
            <h1 style={{ fontFamily: "'Questrial', sans-serif", fontSize: 26, color: '#1a1a1a', marginBottom: 6, lineHeight: 1.2 }}>
              {user ? `Bom dia, ${user.name.split(' ')[0]}.` : 'Bom dia!'}
            </h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20, lineHeight: 1.5 }}>{subtitleMessage}</p>

            <div className="dashboard-hero-progress-row" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <div className="dashboard-progress-number" style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 72, fontWeight: 700, color: '#531A61', lineHeight: 0.9, letterSpacing: '-0.045em' }}>
                  {progressPercent}%
                </div>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, letterSpacing: '.08em' }}>
                  DA TRILHA · {vestibularName.toUpperCase()}
                </p>
              </div>
              <div className="dashboard-hero-icon" style={{ color: '#531A61', opacity: 0.12 }}>
                <svg width="80" height="68" viewBox="0 0 28 24" fill="none">
                  <path d="M2 20 C6 12 14 8 26 4 C20 10 18 16 20 22 C14 18 8 18 2 20Z" fill="currentColor" opacity="0.9"/>
                  <path d="M2 20 C8 16 14 14 20 22 C14 22 8 22 2 20Z" fill="currentColor" opacity="0.5"/>
                </svg>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <ProgressBar value={progressPercent} color="vinho" size="md" />
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              <span style={{ backgroundColor: 'rgba(83,26,97,.08)', color: '#531A61', fontSize: 12, padding: '5px 12px', borderRadius: 999, fontWeight: 600 }}>{answeredTopics} topico(s) respondido(s)</span>
              <span style={{ backgroundColor: 'rgba(83,26,97,.08)', color: '#531A61', fontSize: 12, padding: '5px 12px', borderRadius: 999, fontWeight: 600 }}>{completedTopics} concluido(s)</span>
              <span style={{ backgroundColor: 'rgba(83,26,97,.08)', color: '#531A61', fontSize: 12, padding: '5px 12px', borderRadius: 999, fontWeight: 600 }}>{totalAnsweredQuestions} questao(oes)</span>
            </div>

            <button
              onClick={handleContinueStudy}
              disabled={generateQuiz.isPending}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, backgroundColor: generateQuiz.isPending ? 'rgba(132,0,51,.55)' : '#840033', color: '#fff', padding: '12px 24px', borderRadius: 999, fontSize: 14, fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 12px -3px rgba(132,0,51,.4)', border: 'none', cursor: generateQuiz.isPending ? 'not-allowed' : 'pointer' }}
            >
              <i className="bi bi-arrow-right" />
              {generateQuiz.isPending ? 'Preparando...' : 'Continuar de onde parei'}
            </button>
          </div>

          <div className="dashboard-card" style={{ backgroundColor: '#FFDC5C', borderRadius: 24, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: 'rgba(83,26,97,.6)', letterSpacing: '.1em', textTransform: 'uppercase' }}>INDICE KUAA</p>
              <span style={{ backgroundColor: '#840033', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, letterSpacing: '.04em' }}>ATUAL</span>
            </div>
            <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 64, fontWeight: 700, color: '#531A61', lineHeight: 0.9, letterSpacing: '-0.045em', marginBottom: 8 }}>
              {user?.xp ?? 0}
            </div>
            <p style={{ fontSize: 13, color: 'rgba(83,26,97,.7)', marginBottom: 20 }}>{finishedSessions} sessoes finalizadas · {totalSessions} iniciadas</p>

            <div className="dashboard-metric-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {subjectMetrics.map((metric) => (
                <div key={metric.name} style={{ backgroundColor: 'rgba(83,26,97,.08)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <p style={{ fontSize: 17, fontWeight: 700, color: '#531A61', fontFamily: "'Unbounded', sans-serif", letterSpacing: '-0.02em' }}>{metric.percent}%</p>
                  <p style={{ fontSize: 10, color: 'rgba(83,26,97,.6)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.06em' }}>{metric.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 20 }} className="dashboard-grid">
          <div className="dashboard-card" style={{ backgroundColor: 'var(--surface)', borderRadius: 24, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
            <div className="dashboard-chart-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div>
                <p style={{ fontSize: 11, color: '#9ca3af', letterSpacing: '.1em', textTransform: 'uppercase' }}>FOCO · SEMANA</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', fontFamily: "'Questrial', sans-serif", marginTop: 2 }}>{weekAnsweredQuestions} questao(oes) respondida(s)</p>
              </div>
              <span style={{ padding: '6px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '.06em', backgroundColor: '#1a0826', color: '#fff' }}>7 DIAS</span>
            </div>

            <div style={{ marginTop: 24 }}>
              <BarChart days={weekData} />
            </div>

            {weekAnsweredQuestions === 0 && (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 12 }}>Nenhuma questao respondida esta semana.</p>
            )}
          </div>

          <div className="dashboard-card" style={{ backgroundColor: '#2a0d33', borderRadius: 24, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p style={{ fontFamily: "'Questrial', sans-serif", fontSize: 18, color: '#fff' }}>Trilhas recomendadas</p>
              <Link to={trailHref} style={{ fontSize: 12, color: '#FFDC5C', textDecoration: 'none', fontWeight: 600 }}>VER TODAS</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recommendedTopic ? (
                <div style={{ backgroundColor: 'rgba(255,255,255,.05)', borderRadius: 12, padding: '12px 14px' }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>{inProgressTopic ? 'CONTINUAR' : 'PROXIMO TOPICO'}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <p style={{ fontSize: 14, color: '#fff', fontFamily: "'Questrial', sans-serif", fontWeight: 500 }}>{recommendedTopic.name}</p>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#FFDC5C', flexShrink: 0 }}>
                      {Math.round(topicScore(recommendedTopic) * 100)}%
                    </span>
                  </div>
                  <div style={{ marginTop: 8, height: 3, backgroundColor: 'rgba(255,255,255,.1)', borderRadius: 999 }}>
                    <div style={{ width: `${Math.round(topicScore(recommendedTopic) * 100)}%`, height: '100%', backgroundColor: '#FFDC5C', borderRadius: 999 }} />
                  </div>
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Trilha concluida.</p>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-card" style={{ backgroundColor: 'var(--surface)', borderRadius: 24, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
          <div className="dashboard-agenda-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontFamily: "'Questrial', sans-serif", fontSize: 18, color: '#1a1a1a' }}>Sua agenda · hoje</p>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>{now.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</p>
          </div>
          <div className="dashboard-agenda-list" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4 }}>
            <AgendaCard borderColor="#840033" label={currentTopic?.name ?? 'Trilha concluida'} sublabel={inProgressTopic ? 'CONTINUAR TOPICO' : 'AULA DISPONIVEL'} time="Agora" badge={inProgressTopic ? 'CONTINUAR' : 'INICIAR'} />
            <AgendaCard borderColor="#FFDC5C" label={`${weekAnsweredQuestions} questao(oes) esta semana`} sublabel="ATIVIDADE REAL" time="Semana" />
            <AgendaCard borderColor="#531A61" label={`${finishedSessions}/${totalSessions} sessoes finalizadas`} sublabel="PROGRESSO" time="Geral" />
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-page,
        .dashboard-page * {
          box-sizing: border-box;
        }

        @media (max-width: 1024px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 768px) {
          .dashboard-page {
            padding: 20px 16px 140px !important;
          }

          .dashboard-card {
            border-radius: 18px !important;
            padding: 20px !important;
          }

          .dashboard-hero-progress-row,
          .dashboard-chart-head,
          .dashboard-agenda-head {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }

          .dashboard-progress-number {
            font-size: 58px !important;
            letter-spacing: 0 !important;
          }

          .dashboard-hero-icon {
            display: none !important;
          }

          .dashboard-metric-grid {
            grid-template-columns: 1fr !important;
          }

          .dashboard-agenda-list {
            flex-direction: column !important;
            overflow-x: visible !important;
            gap: 10px !important;
            padding-bottom: 0 !important;
          }

          .agenda-card {
            min-width: 0 !important;
            width: 100% !important;
            border-radius: 0 14px 14px 0 !important;
          }
        }

        @media (max-width: 380px) {
          .dashboard-page {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
        }
      `}</style>
    </AppLayout>
  )
}
