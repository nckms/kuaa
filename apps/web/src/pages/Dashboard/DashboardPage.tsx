import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { useAuthStore } from '../../stores/auth.store'
import { useTrail } from '../../hooks/useTrail'
import { useIndex } from '../../hooks/useIndex'
import { useGenerateQuiz } from '../../hooks/useQuiz'
import { subjectTheme, subjectThemeByName } from '../../utils/subjectTheme'
import { formatStudyTime, indexBand, sparkPoints, topicProgressScore } from '../../utils/kuaaIndex'
import './DashboardPage.css'

const DAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
const WEEK_TARGET = 5

function greeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
}

export default function DashboardPage() {
  const { user, firstVestibularSlug, enrollments } = useAuthStore()
  const { data: trail, isLoading, isError, refetch } = useTrail(firstVestibularSlug ?? '')
  const { data: indexData } = useIndex(firstVestibularSlug ?? '')
  const generateQuiz = useGenerateQuiz()
  const navigate = useNavigate()
  const trailHref = firstVestibularSlug ? `/trilha/${firstVestibularSlug}` : '/trilha'
  const topics = useMemo(() => trail?.subjects.flatMap((subject) => subject.topics) ?? [], [trail])
  const recommendation = topics.find((topic) => topic.id === trail?.recommendation?.topicId)
  const summary = trail?.summary
  const week = summary?.weeklyAnsweredQuestions ?? [0, 0, 0, 0, 0, 0, 0]
  const weekTotal = week.reduce((sum, value) => sum + value, 0)
  const weekMax = Math.max(...week, 1)
  const todayIndex = (new Date().getDay() + 6) % 7
  const activeDays = week.filter((value) => value > 0).length
  const gaps = summary?.knowledgeGaps ?? []
  const examName = trail?.vestibular.name ?? enrollments.find((item) => item.vestibular.slug === firstVestibularSlug)?.vestibular.name ?? 'Sua prova'
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' }).replace('.', '')
  const hasIndex = (indexData?.subjectBreakdown.length ?? 0) > 0
  const band = indexData ? indexBand(indexData.score) : null
  const history = indexData?.history.map((point) => point.score) ?? []

  const subjects = (trail?.subjects ?? []).map((subject, index) => {
    const total = subject.topics.length
    const pct = total ? Math.round((subject.topics.reduce((sum, topic) => sum + topicProgressScore(topic), 0) / total) * 100) : 0
    return { id: subject.id, name: subject.name, pct, ...subjectTheme(subject.slug, index) }
  })

  function start(topicId?: string) {
    if (topicId) generateQuiz.mutate({ topicId, count: 5 })
    else navigate(trailHref)
  }

  if (isLoading || isError) {
    return <AppLayout><div className="k-page"><div className="k-state" role={isError ? 'alert' : 'status'}>
      <p style={{ margin: 0 }}>{isError ? 'Não foi possível carregar seu progresso.' : 'Carregando seu progresso...'}</p>
      {isError && <button className="k-btn k-btn-primary is-sm" onClick={() => void refetch()}>Tentar novamente</button>}
    </div></div></AppLayout>
  }

  return <AppLayout><div className="k-page dash">
    <header className="k-page-head">
      <div><p className="k-eyebrow">{examName} · {today}</p><h1 className="k-h1">{greeting()}, {user?.name.split(' ')[0] ?? 'estudante'}.</h1></div>
      {user && <div className="dash-chips">
        <span className="k-chip"><i className="bi bi-fire" style={{ color: '#D97706' }} aria-hidden="true" />{user.streakDays} {user.streakDays === 1 ? 'dia seguido' : 'dias seguidos'}</span>
        <span className="k-chip"><i className="bi bi-lightning-charge-fill" style={{ color: 'var(--k-roxo)' }} aria-hidden="true" />{user.xp} XP</span>
      </div>}
    </header>

    <div className="k-row">
      <section className="dash-hero" aria-labelledby="next-study">
        <div className="dash-hero-blob" aria-hidden="true" />
        <div className="dash-hero-copy">
          <span className="dash-hero-tag"><i className="bi bi-bullseye" aria-hidden="true" />Seu próximo passo</span>
          <h2 id="next-study">{recommendation?.name ?? (summary?.totalTopics ? 'Trilha concluída' : 'Comece sua trilha')}</h2>
          <p>{trail?.recommendation?.reason ?? 'Abra a trilha para escolher por onde começar.'}</p>
        </div>
        <div className="dash-hero-actions">
          <button className="k-btn k-btn-yellow" onClick={() => start(recommendation?.id)} disabled={generateQuiz.isPending}>
            <i className="bi bi-play-fill" aria-hidden="true" />{generateQuiz.isPending ? 'Preparando...' : recommendation ? 'Praticar agora' : 'Abrir trilha'}
          </button>
          <Link to={trailHref} className="k-btn k-btn-ghost-light">Ver trilha</Link>
        </div>
        {generateQuiz.isError && <p role="alert" className="dash-hero-error">Não foi possível preparar a sessão. Tente novamente.</p>}
      </section>

      <section className="k-card dash-week" aria-labelledby="week-goal">
        <div className="dash-card-top"><strong id="week-goal">Meta da semana</strong><span>{user?.preferences?.dailyStudyMinutes ?? 30} min/dia</span></div>
        <div className="dash-ring-row">
          <div className="dash-ring">
            <svg viewBox="0 0 120 120" width="112" height="112" aria-hidden="true">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--k-track)" strokeWidth="12" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--k-verde)" strokeWidth="12" strokeLinecap="round" pathLength={100} strokeDasharray={`${Math.min(100, (activeDays / WEEK_TARGET) * 100)} 100`} />
            </svg>
            <span className="k-num">{activeDays}/{WEEK_TARGET}</span>
          </div>
          <p>{activeDays >= WEEK_TARGET ? 'Semana fechada. Mandou bem!' : `Estude em mais ${WEEK_TARGET - activeDays} ${WEEK_TARGET - activeDays === 1 ? 'dia' : 'dias'} pra fechar a semana. Uma sessão de prática resolve.`}</p>
        </div>
        <div className="dash-dots" aria-label="Dias com estudo nesta semana">
          {week.map((value, index) => <div key={index}><span style={{ background: value > 0 ? 'var(--k-verde)' : index === todayIndex ? '#CDE5D9' : '#EFEAED' }} title={`${value} questões`} /><small>{DAYS[index]}</small></div>)}
        </div>
      </section>
    </div>

    <div className="k-grid" style={{ ['--min' as string]: '200px' }}>
      {[
        { label: 'Questões', value: String(summary?.answeredQuestions ?? 0), sub: `${weekTotal} nesta semana`, icon: 'bi-list-check' },
        { label: 'Acerto', value: `${summary?.accuracy ?? 0}%`, sub: `${summary?.correctAnswers ?? 0} acertos`, icon: 'bi-bullseye' },
        { label: 'Tempo de estudo', value: formatStudyTime(summary?.studyTimeMs ?? 0), sub: `${summary?.finishedSessions ?? 0} sessões`, icon: 'bi-clock' },
        { label: 'Tópicos dominados', value: String(summary?.completedTopics ?? 0), sub: `de ${summary?.totalTopics ?? 0}`, icon: 'bi-check2-all' },
      ].map((stat) => (
        <div key={stat.label} className="k-card is-sm dash-stat">
          <div><span>{stat.label}</span><i className={`bi ${stat.icon}`} aria-hidden="true" /></div>
          <div><strong className="k-num">{stat.value}</strong><small>{stat.sub}</small></div>
        </div>
      ))}
    </div>

    <div className="k-row">
      <section className="k-card dash-activity" aria-labelledby="activity-title">
        <div className="k-card-head" style={{ marginBottom: 0 }}><h3 id="activity-title" className="k-h3">Atividade da semana</h3><span className="k-muted" style={{ fontSize: 13 }}>{weekTotal} questões</span></div>
        <div className="dash-bars">
          {week.map((value, index) => (
            <div key={index}>
              <span className="k-mono">{value || ''}</span>
              <div style={{ height: `${Math.max(4, (value / weekMax) * 120)}px`, background: index === todayIndex ? 'var(--k-roxo)' : value ? '#E4D7EA' : '#F1ECEF' }} />
              <small style={{ color: index === todayIndex ? 'var(--k-roxo)' : undefined }}>{DAYS[index]}</small>
            </div>
          ))}
        </div>
      </section>
      <section className="k-card dash-index" aria-labelledby="index-title">
        <div className="dash-card-top"><h3 id="index-title" className="k-h3">Índice Kuaa</h3><Link to="/indice" className="k-link-btn" style={{ fontSize: 13 }}>Detalhes<i className="bi bi-arrow-up-right" aria-hidden="true" /></Link></div>
        <div className="dash-index-score">
          <strong className="k-num">{hasIndex ? indexData!.score : '—'}</strong>
          {hasIndex && indexData!.delta7d !== 0 && <span style={{ color: indexData!.delta7d > 0 ? 'var(--k-verde)' : 'var(--k-vinho)' }}>{indexData!.delta7d > 0 ? '↑' : '↓'} {Math.abs(indexData!.delta7d)} em 7 dias</span>}
        </div>
        {history.length >= 2
          ? <svg viewBox="0 0 280 70" width="100%" height="70" preserveAspectRatio="none" aria-hidden="true"><polyline points={sparkPoints(history, 280, 70)} fill="none" stroke="var(--k-roxo)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" /></svg>
          : <p className="k-muted" style={{ fontSize: 13, margin: 0 }}>{hasIndex ? 'O gráfico aparece após dois meses de atividade.' : 'Responda questões para ver seu índice.'}</p>}
        {hasIndex && band && <div className="dash-index-foot"><span>Faixa {band.name}</span>{band.next && <span>Faltam {band.next.from - indexData!.score} pts p/ {band.next.name}</span>}</div>}
      </section>
    </div>

    <div className="k-row">
      <section className="k-card dash-subjects" aria-labelledby="subjects-title">
        <h3 id="subjects-title" className="k-h3" style={{ marginBottom: 20 }}>Progresso por matéria</h3>
        <div className="dash-subject-grid">
          {subjects.map((subject) => (
            <button key={subject.id} type="button" onClick={() => navigate(trailHref, { state: { subjectId: subject.id } })}>
              <span className="dash-subject-head"><span><span className="dash-dot" style={{ background: subject.color }} />{subject.name}</span><span className="k-mono">{subject.pct}%</span></span>
              <span className="k-track"><span style={{ width: `${Math.max(subject.pct, 2)}%`, background: subject.color }} /></span>
            </button>
          ))}
        </div>
      </section>
      <div className="dash-side">
        <section className="k-card is-md dash-gaps" aria-labelledby="attention-title">
          <h3 id="attention-title" className="k-h3" style={{ marginBottom: 8 }}>Pontos de atenção</h3>
          {gaps.length ? gaps.slice(0, 3).map((gap, index) => (
            <button key={gap.topicId} type="button" disabled={generateQuiz.isPending} onClick={() => start(gap.topicId)} aria-label={`Reforçar ${gap.topicName}`}>
              <span className="dash-gap-bar" style={{ background: subjectThemeByName(gap.subjectName, index).color }} />
              <span className="dash-gap-text"><strong>{gap.topicName}</strong><small>{gap.subjectName} · {gap.wrongAnswers} de {gap.totalAnswers} erradas</small></span>
              <span className="k-mono dash-gap-acc">{gap.accuracy}%</span>
            </button>
          )) : <p className="k-muted" style={{ fontSize: 14, margin: '8px 0 0' }}>Nenhum ponto de atenção ainda. Eles aparecem depois de algumas questões.</p>}
        </section>
        <section className="dash-simulado" aria-labelledby="simulado-title">
          <div><span>Simulado semanal</span><span className="k-badge">Disponível</span></div>
          <strong id="simulado-title">Até 45 questões · 90 min</strong>
          <Link to="/simulado" className="k-btn is-sm" style={{ background: '#fff', color: 'var(--k-ink)', alignSelf: 'flex-start' }}>Fazer agora<i className="bi bi-arrow-right" aria-hidden="true" /></Link>
        </section>
      </div>
    </div>
  </div></AppLayout>
}
