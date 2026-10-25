import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTrail } from '../../hooks/useTrail'
import { useMyEnrollments } from '../../hooks/useEnrollments'
import AppLayout from '../../components/layout/AppLayout'
import SubjectSection from '../../components/trail/SubjectSection'
import SubjectNavigation from '../../components/trail/SubjectNavigation'
import TopicModal from '../../components/trail/TopicModal'
import { subjectTheme, subjectThemeByName } from '../../utils/subjectTheme'
import { topicProgressScore } from '../../utils/kuaaIndex'
import type { TrailSubject, TrailTopic } from '../../types/trail'
import './TrailPage.css'

function TrailSkeleton() {
  return (
    <div className="trail-skeleton" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => <span key={i} style={{ transform: `translateX(${[0, 60, 0, -60][i]}px)` }} />)}
    </div>
  )
}

function TrailContextPanel({ vestibularSlug }: { vestibularSlug: string }) {
  const navigate = useNavigate()
  const { data: trail } = useTrail(vestibularSlug)
  const { data: enrollments } = useMyEnrollments()
  if (!trail) return null
  const { summary } = trail
  const progressValue = summary.totalTopics ? Math.round(((summary.completedTopics + summary.inProgressTopics * 0.5) / summary.totalTopics) * 100) : 0

  return (
    <div className="trail-panel">
      <div>
        <div className="k-muted" style={{ fontSize: 13 }}>Progresso geral</div>
        <div className="trail-panel-big"><strong className="k-num">{progressValue}%</strong><span>{summary.completedTopics} de {summary.totalTopics} tópicos</span></div>
        <div className="k-track is-md" style={{ marginTop: 12 }}><span style={{ width: `${progressValue}%` }} /></div>
      </div>
      <div className="trail-panel-tiles">
        <div style={{ background: 'var(--k-verde-soft)' }}><strong style={{ color: 'var(--k-verde)' }}>{summary.correctAnswers}</strong><small style={{ color: '#3F6B58' }}>acertos</small></div>
        <div style={{ background: 'var(--k-vinho-soft)' }}><strong style={{ color: 'var(--k-vinho)' }}>{summary.wrongAnswers}</strong><small style={{ color: '#7A3049' }}>erros</small></div>
        <div style={{ background: 'var(--k-roxo-soft)' }}><strong style={{ color: 'var(--k-roxo)' }}>{summary.accuracy ?? 0}%</strong><small style={{ color: '#5E3A69' }}>acerto</small></div>
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Pontos de atenção</div>
        {summary.knowledgeGaps.length ? summary.knowledgeGaps.slice(0, 3).map((gap, index) => (
          <div key={gap.topicId} className="trail-panel-gap">
            <span style={{ background: subjectThemeByName(gap.subjectName, index).color }} />
            <span><span>{gap.topicName}</span><small>{gap.subjectName}</small></span>
            <span className="k-mono">{gap.accuracy}%</span>
          </div>
        )) : <p className="k-muted" style={{ fontSize: 13, margin: '8px 0 0', lineHeight: 1.45 }}>Seus pontos de atenção aparecerão após algumas questões.</p>}
      </div>
      {(enrollments?.length ?? 0) > 1 && (
        <label className="k-field">
          <span style={{ fontSize: 13 }}>Trocar vestibular</span>
          <select className="k-input" style={{ height: 44 }} value={vestibularSlug} onChange={(event) => navigate(`/trilha/${event.target.value}`)}>
            {enrollments?.map((item) => <option key={item.enrollment.vestibularId} value={item.vestibular.slug}>{item.vestibular.name}</option>)}
          </select>
        </label>
      )}
      <Link to={`/diagnostico/${vestibularSlug}`} className="trail-panel-diag"><i className="bi bi-search" aria-hidden="true" />Refazer diagnóstico</Link>
    </div>
  )
}

export default function TrailPage() {
  const { vestibularSlug = '' } = useParams<{ vestibularSlug: string }>()
  const location = useLocation()
  const { data: trail, isLoading, isError, refetch } = useTrail(vestibularSlug)
  const { data: enrollments } = useMyEnrollments()
  const navigate = useNavigate()

  const [activeSubjectId, setActiveSubjectId] = useState<string | null>((location.state as { subjectId?: string } | null)?.subjectId ?? null)
  const [modalTopic, setModalTopic] = useState<TrailTopic | null>(null)
  const [modalSubject, setModalSubject] = useState<TrailSubject | null>(null)

  const recommendedSubjectId =
    trail?.subjects.find((subject) => subject.topics.some((topic) => topic.id === trail.recommendation?.topicId))?.id
    ?? trail?.subjects.find((subject) => subject.topics.some((topic) => topic.progress.unlocked))?.id
    ?? trail?.subjects[0]?.id
    ?? null
  const currentSubjectId = trail?.subjects.some((subject) => subject.id === activeSubjectId) ? activeSubjectId : recommendedSubjectId
  const subjectIndex = Math.max(0, trail?.subjects.findIndex((subject) => subject.id === currentSubjectId) ?? 0)
  const activeSubject = trail?.subjects[subjectIndex]
  const theme = subjectTheme(activeSubject?.slug, subjectIndex)

  const recTopic = activeSubject?.topics.find((topic) => topic.id === trail?.recommendation?.topicId)
  const nextTopic = recTopic ?? activeSubject?.topics.find((topic) => topic.progress.unlocked && !topic.progress.completed)
  const recLabel = recTopic
    ? trail?.recommendation?.kind === 'reinforcement' ? 'Revise este tópico' : trail?.recommendation?.kind === 'advance' ? 'Hora de avançar' : 'Continue aqui'
    : 'Continue aqui'
  const recMeta = recTopic ? trail?.recommendation?.reason : nextTopic?.progress.answeredQuestionsCount ? `${nextTopic.progress.correctAnswersCount}/${nextTopic.progress.answeredQuestionsCount} acertos até agora` : 'Primeiro passo nessa matéria · ~8 min'

  function handleTopicClick(topic: TrailTopic, subject: TrailSubject) {
    setModalTopic(topic)
    setModalSubject(subject)
  }

  return (
    <AppLayout rightSidebar={<TrailContextPanel vestibularSlug={vestibularSlug} />}>
      <div className="trail-sticky">
        <div className="trail-sticky-top">
          <div>
            <p className="k-eyebrow">Trilha · {trail?.vestibular.name ?? '…'}</p>
            {(enrollments?.length ?? 0) > 1 ? (
              <select className="trail-exam-select" aria-label="Vestibular" value={vestibularSlug} onChange={(event) => navigate(`/trilha/${event.target.value}`)}>
                {enrollments?.map((item) => <option key={item.enrollment.vestibularId} value={item.vestibular.slug}>Minha trilha · {item.vestibular.name}</option>)}
              </select>
            ) : <h1 className="trail-title">Minha trilha</h1>}
          </div>
          {trail && <span className="k-mono trail-count">{trail.summary.completedTopics}/{trail.summary.totalTopics} tópicos dominados</span>}
        </div>
        {trail && (
          <SubjectNavigation activeId={currentSubjectId}>
            {trail.subjects.map((subject, index) => {
              const total = subject.topics.length
              const pct = total ? Math.round((subject.topics.reduce((sum, topic) => sum + topicProgressScore(topic), 0) / total) * 100) : 0
              const on = currentSubjectId === subject.id
              const tabTheme = subjectTheme(subject.slug, index)
              return (
                <button key={subject.id} type="button" aria-pressed={on} className="trail-tab" onClick={() => setActiveSubjectId(subject.id)}
                  style={on ? { background: tabTheme.color, borderColor: tabTheme.color, color: '#fff' } : undefined}>
                  <span className="trail-tab-dot" style={{ background: on ? '#fff' : tabTheme.color }} />{subject.name}<span className="k-mono trail-tab-pct">{pct}%</span>
                </button>
              )
            })}
          </SubjectNavigation>
        )}
      </div>

      <div className="trail-body">
        {isLoading && <TrailSkeleton />}
        {isError && (
          <div className="k-state">
            <p style={{ margin: 0 }}>Erro ao carregar a trilha.</p>
            <button onClick={() => refetch()} className="k-btn k-btn-primary is-sm">Tentar novamente</button>
          </div>
        )}
        {activeSubject && (
          <>
            {nextTopic && (
              <section className="trail-rec" style={{ background: theme.color }}>
                <div>
                  <div className="trail-rec-label"><i className="bi bi-bullseye" aria-hidden="true" />{recLabel}</div>
                  <div className="trail-rec-name">{nextTopic.name}</div>
                  {recMeta && <div className="trail-rec-meta">{recMeta}</div>}
                </div>
                <button type="button" aria-label={`Abrir ${nextTopic.name}`} onClick={() => handleTopicClick(nextTopic, activeSubject)}><i className="bi bi-arrow-right" aria-hidden="true" /></button>
              </section>
            )}
            <SubjectSection subject={activeSubject} subjectIndex={subjectIndex} activeTopicId={trail?.recommendation?.topicId ?? null} onTopicClick={handleTopicClick} />
            <Link to={`/diagnostico/${vestibularSlug}`} className="trail-diag-mobile"><i className="bi bi-search" aria-hidden="true" />Refazer diagnóstico</Link>
          </>
        )}
      </div>

      <TopicModal topic={modalTopic} subject={modalSubject} subjectIndex={trail?.subjects.findIndex((subject) => subject.id === modalSubject?.id) ?? 0} onClose={() => { setModalTopic(null); setModalSubject(null) }} />
    </AppLayout>
  )
}
