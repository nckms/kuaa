import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import ProgressBar from '../../components/ui/ProgressBar'
import { useAuthStore } from '../../stores/auth.store'
import { useTrail } from '../../hooks/useTrail'

function BarChart({ days }: { days: number[] }) {
  const max = Math.max(...days, 1)
  const DAY_LABELS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']
  const todayIdx = (new Date().getDay() + 6) % 7

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 90 }}>
      {days.map((val, i) => {
        const heightPct = max > 0 ? (val / max) * 100 : 6
        const isToday = i === todayIdx
        const isHighest = val === max && val > 0

        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
            {isHighest && val > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#b347d9', fontFamily: 'Inter, Arial, sans-serif' }}>{val}h</span>
            )}
            <div
              style={{
                width: '100%', maxWidth: 28,
                height: `${Math.max(heightPct, 6)}%`,
                borderRadius: 8,
                background: isHighest
                  ? 'linear-gradient(180deg, #b347d9, #531A61)'
                  : 'var(--roxo-light, #f3eaf7)',
                boxShadow: isHighest ? '0 0 0 1px rgba(179,71,217,.3), 0 4px 16px -4px rgba(179,71,217,.5)' : 'none',
                outline: isToday ? '2px solid #FFDC5C' : 'none',
                outlineOffset: 1,
                transition: 'height 0.4s ease',
              }}
            />
            <span style={{ fontSize: 10, color: 'var(--muted, #6b7280)', fontFamily: 'Inter, Arial, sans-serif', letterSpacing: '.04em' }}>{DAY_LABELS[i]}</span>
          </div>
        )
      })}
    </div>
  )
}

function AgendaCard({ borderColor, label, sublabel, time, badge }: { borderColor: string; label: string; sublabel: string; time: string; badge?: string }) {
  return (
    <div style={{ borderLeft: `3px solid ${borderColor}`, backgroundColor: 'var(--surface, #fff)', borderRadius: '0 16px 16px 0', padding: '14px 18px', minWidth: 210, boxShadow: 'var(--shadow-xs)' }}>
      <p style={{ fontSize: 11, color: 'var(--muted, #6b7280)', fontFamily: 'Inter, Arial, sans-serif', marginBottom: 4, fontWeight: 500 }}>{time}</p>
      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text, #1a1a1a)', fontFamily: "'Questrial', sans-serif", marginBottom: 6 }}>{label}</p>
      {badge ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#840033', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999, fontFamily: 'Inter, Arial, sans-serif', letterSpacing: '.06em', textTransform: 'uppercase' }}>{badge}</span>
      ) : (
        <span style={{ fontSize: 12, color: 'var(--muted, #6b7280)', fontFamily: 'Inter, Arial, sans-serif' }}>{sublabel}</span>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { user, firstVestibularSlug, enrollments } = useAuthStore()
  const { data: trail } = useTrail(firstVestibularSlug ?? '')
  const [chartPeriod, setChartPeriod] = useState<'7d' | 'mes' | 'tri'>('7d')

  const progressPercent = useMemo(() => {
    if (!trail) return 0
    const { completedTopics, totalTopics } = trail.summary
    return totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0
  }, [trail])

  const vestibularName = trail?.vestibular.name ?? (enrollments[0]?.vestibular.name ?? 'ENEM')
  const subtitleMessage = !trail || trail.summary.completedTopics === 0
    ? 'Você ainda não começou sua trilha. Que tal agora?'
    : trail.summary.completedTopics < 5
    ? 'Você está nos primeiros passos. Continue!'
    : 'Você está no ritmo certo. Não pare agora.'

  const now = new Date()
  const dayName = now.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase()
  const dateStr = now.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }).toUpperCase()

  // Mock semanal (substituir por dados reais futuramente)
  const weekData = [0, 0, 0, 0, 0, 0, 0]

  const nextTopic = trail?.subjects.flatMap((s) => s.topics).find((t) => t.progress.unlocked && !t.progress.completed)
  const firstTopic = trail?.subjects.flatMap((s) => s.topics).find((t) => t.progress.unlocked)

  const trailHref = firstVestibularSlug ? `/trilha/${firstVestibularSlug}` : '/trilha'

  return (
    <AppLayout>
      <div style={{ padding: '32px 28px 80px', minHeight: '100%', fontFamily: 'Inter, Arial, sans-serif', background: 'var(--bg)' }}>

        {/* ROW 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 20 }} className="dashboard-grid">

          {/* Hero card */}
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: 24, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
            <p style={{ fontSize: 11, color: '#9ca3af', letterSpacing: '.1em', marginBottom: 8 }}>{dayName}, {dateStr}</p>
            <h1 style={{ fontFamily: "'Questrial', sans-serif", fontSize: 26, color: '#1a1a1a', marginBottom: 6, lineHeight: 1.2 }}>
              {user ? `Bom dia, ${user.name.split(' ')[0]}.` : 'Bom dia!'}
            </h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20, lineHeight: 1.5 }}>{subtitleMessage}</p>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 72, fontWeight: 700, color: '#531A61', lineHeight: 0.9, letterSpacing: '-0.045em' }}>
                  {progressPercent}%
                </div>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, letterSpacing: '.08em' }}>
                  DA TRILHA · {vestibularName.toUpperCase()}
                </p>
              </div>
              <div style={{ color: '#531A61', opacity: 0.12 }}>
                <svg width="80" height="68" viewBox="0 0 28 24" fill="none">
                  <path d="M2 20 C6 12 14 8 26 4 C20 10 18 16 20 22 C14 18 8 18 2 20Z" fill="currentColor" opacity="0.9"/>
                  <path d="M2 20 C8 16 14 14 20 22 C14 22 8 22 2 20Z" fill="currentColor" opacity="0.5"/>
                </svg>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <ProgressBar value={progressPercent} color="vinho" size="md" />
            </div>

            <Link
              to={nextTopic ? `/quiz/${nextTopic.id}` : trailHref}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, backgroundColor: '#840033', color: '#fff', padding: '12px 24px', borderRadius: 999, fontSize: 14, fontWeight: 600, textDecoration: 'none', fontFamily: 'Inter, Arial, sans-serif', boxShadow: '0 4px 12px -3px rgba(132,0,51,.4)' }}
            >
              <i className="bi bi-arrow-right" />
              Continuar de onde parei
            </Link>
          </div>

          {/* Índice Kuaa */}
          <div style={{ backgroundColor: '#FFDC5C', borderRadius: 24, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: 'rgba(83,26,97,.6)', letterSpacing: '.1em', textTransform: 'uppercase' }}>ÍNDICE KUAA</p>
              <span style={{ backgroundColor: '#840033', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, fontFamily: 'Arial, sans-serif', letterSpacing: '.04em' }}>TOP —%</span>
            </div>
            <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 64, fontWeight: 700, color: '#531A61', lineHeight: 0.9, letterSpacing: '-0.045em', marginBottom: 8 }}>
              {user?.xp ?? 0}
            </div>
            <p style={{ fontSize: 13, color: 'rgba(83,26,97,.7)', marginBottom: 20 }}>+0 em 7 dias</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {['Redação', 'Exatas', 'Humanas'].map((m) => (
                <div key={m} style={{ backgroundColor: 'rgba(83,26,97,.08)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <p style={{ fontSize: 17, fontWeight: 700, color: '#531A61', fontFamily: "'Unbounded', sans-serif", letterSpacing: '-0.02em' }}>—%</p>
                  <p style={{ fontSize: 10, color: 'rgba(83,26,97,.6)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.06em' }}>{m}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROW 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 20 }} className="dashboard-grid">

          {/* Gráfico semanal */}
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: 24, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div>
                <p style={{ fontSize: 11, color: '#9ca3af', letterSpacing: '.1em', textTransform: 'uppercase' }}>FOCO · SEMANA</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', fontFamily: "'Questrial', sans-serif", marginTop: 2 }}>0h estudadas</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['7d', 'mes', 'tri'] as const).map((p) => (
                  <button key={p} onClick={() => setChartPeriod(p)}
                    style={{ padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'Inter, Arial, sans-serif', letterSpacing: '.06em',
                      backgroundColor: chartPeriod === p ? '#1a0826' : 'transparent',
                      color: chartPeriod === p ? '#fff' : 'var(--muted)',
                      boxShadow: chartPeriod === p ? '0 2px 8px -2px rgba(26,8,38,.25)' : 'none',
                      transition: 'all .15s',
                    }}>
                    {p === '7d' ? '7 DIAS' : p === 'mes' ? 'MÊS' : 'TRIM.'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <BarChart days={weekData} />
            </div>

            {weekData.every((d) => d === 0) && (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 12 }}>Nenhuma sessão esta semana. Comece agora!</p>
            )}
          </div>

          {/* Trilhas recomendadas */}
          <div style={{ backgroundColor: '#2a0d33', borderRadius: 24, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p style={{ fontFamily: "'Questrial', sans-serif", fontSize: 18, color: '#fff' }}>Trilhas recomendadas</p>
              <Link to={trailHref} style={{ fontSize: 12, color: '#FFDC5C', textDecoration: 'none', fontWeight: 600 }}>VER TODAS →</Link>
            </div>

            {trail ? (() => {
              const allTopics = trail.subjects.flatMap((s) => s.topics.map((t) => ({ ...t, subjectName: s.name })))
              const focusTopic = allTopics.find((t) => t.progress.unlocked && !t.progress.completed && t.progress.sessionsCount > 0) ?? allTopics.find((t) => t.progress.unlocked && !t.progress.completed)
              const trendTopic = allTopics.find((t) => t.progress.unlocked && !t.progress.completed && t !== focusTopic)
              const recoverTopic = allTopics.find((t) => t.progress.completed && t.progress.masteryLevel < 3)

              const recs = [
                { topic: focusTopic, label: 'FOCO DA SEMANA', color: '#10b981', barColor: '#10b981' },
                { topic: trendTopic, label: 'TENDÊNCIA', color: '#FFDC5C', barColor: '#FFDC5C' },
                { topic: recoverTopic, label: 'RECUPERAR', color: '#840033', barColor: '#840033' },
              ]

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recs.map(({ topic, label, color, barColor }) => (
                    topic ? (
                      <div key={topic.id} style={{ backgroundColor: 'rgba(255,255,255,.05)', borderRadius: 12, padding: '12px 14px' }}>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                          <p style={{ fontSize: 14, color: '#fff', fontFamily: "'Questrial', sans-serif", fontWeight: 500 }}>{topic.name}</p>
                          <span style={{ fontSize: 13, fontWeight: 700, color, flexShrink: 0, fontFamily: 'Arial, sans-serif' }}>
                            {Math.round(topic.progress.masteryLevel / 5 * 100)}%
                          </span>
                        </div>
                        <div style={{ marginTop: 8, height: 3, backgroundColor: 'rgba(255,255,255,.1)', borderRadius: 999 }}>
                          <div style={{ width: `${Math.round(topic.progress.masteryLevel / 5 * 100)}%`, height: '100%', backgroundColor: barColor, borderRadius: 999 }} />
                        </div>
                      </div>
                    ) : null
                  ))}
                  {recs.every((r) => !r.topic) && (
                    <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Continue estudando para ver recomendações</p>
                  )}
                </div>
              )
            })() : (
              <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Selecione uma trilha para ver recomendações</p>
            )}
          </div>
        </div>

        {/* ROW 3 — Agenda */}
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: 24, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontFamily: "'Questrial', sans-serif", fontSize: 18, color: '#1a1a1a' }}>Sua agenda · hoje</p>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>📅 {now.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</p>
          </div>
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4 }}>
            <AgendaCard borderColor="#840033" label={firstTopic?.name ?? 'Iniciar primeiro tópico'} sublabel="AULA DISPONÍVEL" time="Agora" badge="INICIAR" />
            <AgendaCard borderColor="#FFDC5C" label="Simulado em breve" sublabel="EM BREVE" time="—" />
            <AgendaCard borderColor="#531A61" label="Monitoria em breve" sublabel="EM BREVE" time="—" />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppLayout>
  )
}
