import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTrail } from '../../hooks/useTrail'
import { useMyEnrollments } from '../../hooks/useEnrollments'
import AppLayout from '../../components/layout/AppLayout'
import ProgressBar from '../../components/ui/ProgressBar'
import SubjectSection from '../../components/trail/SubjectSection'
import SubjectNavigation from '../../components/trail/SubjectNavigation'
import TopicModal from '../../components/trail/TopicModal'
import { getIcon } from '../../utils/iconMap'
import type { TrailSubject, TrailTopic } from '../../types/trail'

function TrailSkeleton() {
  return (
    <div className="d-flex flex-column align-items-center gap-4 py-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="d-flex flex-column align-items-center gap-2">
          <div className="placeholder-glow rounded-circle" style={{ width: 72, height: 72, backgroundColor: '#f3eaf7' }} />
          <div className="placeholder-glow rounded-2" style={{ width: 88, height: 10, backgroundColor: '#f3eaf7' }} />
        </div>
      ))}
    </div>
  )
}

function SummaryMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone: 'success' | 'danger' | 'neutral'
}) {
  const color = tone === 'success' ? '#047857' : tone === 'danger' ? '#840033' : '#531A61'
  const background = tone === 'success' ? 'rgba(16,185,129,.1)' : tone === 'danger' ? 'rgba(132,0,51,.08)' : 'var(--bg-soft)'

  return (
    <div className="rounded-3 text-center py-2 px-2" style={{ background }}>
      <p className="mb-0 fw-bold" style={{ color, fontSize: 16 }}>{value}</p>
      <p className="mb-0 text-muted" style={{ fontSize: 10 }}>{label}</p>
    </div>
  )
}

function TrailRightSidebarWrapper({ vestibularSlug }: { vestibularSlug: string }) {
  const navigate = useNavigate()
  const { data: trail } = useTrail(vestibularSlug)
  const { data: enrollments } = useMyEnrollments()
  const correctAnswers = trail?.summary.correctAnswers ?? 0
  const wrongAnswers = trail?.summary.wrongAnswers ?? 0
  const accuracy = trail?.summary.accuracy ?? null
  const knowledgeGaps = trail?.summary.knowledgeGaps ?? []
  const progressValue = trail?.summary.totalTopics
    ? Math.round(((trail.summary.completedTopics + trail.summary.inProgressTopics * 0.5) / trail.summary.totalTopics) * 100)
    : 0

  return (
    <div className="trail-right-sidebar d-flex flex-column gap-3 p-4 h-100 overflow-auto">

      {trail && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 8 }}>
          <div className="card-body">
              <p className="fw-semibold text-muted mb-2" style={{ fontSize: 12 }}>Seu progresso</p>
            <div className="d-flex align-items-end gap-2 mb-2">
              <p className="mb-0 fw-bold" style={{ fontSize: 30, color: '#531A61', lineHeight: 1 }}>
                {trail.summary.answeredTopics}/{trail.summary.totalTopics}
              </p>
              <p className="mb-1 text-muted" style={{ fontSize: 12 }}>tópicos respondidos</p>
            </div>
            <ProgressBar value={progressValue} color="roxo" />

            <div className="row g-2 mt-3">
              <div className="col-4"><SummaryMetric label="acertos" value={correctAnswers} tone="success" /></div>
              <div className="col-4"><SummaryMetric label="erros" value={wrongAnswers} tone="danger" /></div>
              <div className="col-4"><SummaryMetric label="acerto" value={`${accuracy ?? 0}%`} tone="neutral" /></div>
            </div>
          </div>
        </div>
      )}

      {trail && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 8 }}>
          <div className="card-body">
            <p className="fw-semibold text-muted mb-3" style={{ fontSize: 12 }}>Pontos de atenção</p>
            {knowledgeGaps.length > 0 ? (
              <div className="d-flex flex-column gap-2">
                {knowledgeGaps.slice(0, 3).map((gap) => (
                  <div key={gap.topicId} className="border rounded-3 p-2">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div className="min-w-0">
                        <p className="mb-0 fw-semibold text-truncate" style={{ fontSize: 12 }}>{gap.topicName}</p>
                        <p className="mb-0 text-muted" style={{ fontSize: 10 }}>{gap.subjectName} - {gap.wrongAnswers}/{gap.totalAnswers} erros</p>
                      </div>
                      <span className="fw-bold flex-shrink-0" style={{ fontSize: 12, color: gap.accuracy >= 70 ? '#531A61' : '#840033' }}>{gap.accuracy}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-0 text-muted" style={{ fontSize: 12, lineHeight: 1.45 }}>Seus pontos de atenção aparecerão após algumas questões.</p>
            )}
          </div>
        </div>
      )}

      {(enrollments?.length ?? 0) > 1 && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 8 }}>
          <div className="card-body">
            <label className="form-label text-uppercase fw-semibold text-muted" style={{ fontSize: 11, letterSpacing: '.08em' }}>Trocar vestibular</label>
            <select
              className="form-select form-select-sm"
              value={vestibularSlug}
              onChange={(e) => navigate(`/trilha/${e.target.value}`)}
            >
              {enrollments?.map((e) => (
                <option key={e.enrollment.vestibularId} value={e.vestibular.slug}>{e.vestibular.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TrailPage() {
  const { vestibularSlug = '' } = useParams<{ vestibularSlug: string }>()
  const { data: trail, isLoading, isError, refetch } = useTrail(vestibularSlug)
  const { data: enrollments } = useMyEnrollments()
  const navigate = useNavigate()

  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null)
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null)
  const [modalTopic, setModalTopic] = useState<TrailTopic | null>(null)
  const [modalSubject, setModalSubject] = useState<TrailSubject | null>(null)

  const recommendedSubjectId =
    trail?.subjects.find((subject) => subject.topics.some((topic) => topic.id === trail.recommendation?.topicId))?.id
    ?? trail?.subjects.find((subject) => subject.topics.some((topic) => topic.progress.unlocked))?.id
    ?? trail?.subjects[0]?.id
    ?? null
  const currentSubjectId = activeSubjectId ?? recommendedSubjectId
  const rightSidebar = <TrailRightSidebarWrapper vestibularSlug={vestibularSlug} />

  function handleTopicClick(topic: TrailTopic, subject: TrailSubject) {
    setActiveTopicId(topic.id)
    setModalTopic(topic)
    setModalSubject(subject)
  }

  function handleCloseModal() {
    setModalTopic(null)
    setModalSubject(null)
  }

  return (
    <AppLayout rightSidebar={rightSidebar}>
      <div className="trail-header bg-white border-bottom" style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        padding: '14px 24px',
        boxShadow: '0 8px 24px -20px rgba(26,10,31,.35)',
      }}>
        <div className="trail-header-top d-flex align-items-center justify-content-between gap-3" style={{ marginBottom: trail ? 12 : 0 }}>
          <div>
            <p className="text-uppercase fw-semibold mb-1" style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.14em' }}>Trilha de estudo</p>
            {(enrollments?.length ?? 0) > 1 ? (
              <select className="trail-exam-select" aria-label="Vestibular" value={vestibularSlug} onChange={(event) => navigate(`/trilha/${event.target.value}`)}>
                {enrollments?.map((item) => <option key={item.enrollment.vestibularId} value={item.vestibular.slug}>{item.vestibular.name}</option>)}
              </select>
            ) : <p className="mb-0" style={{ fontFamily: "'Questrial', sans-serif", fontSize: 20, color: 'var(--text)' }}>{trail?.vestibular.name ?? '...'}</p>}
          </div>
          {trail && <span className="trail-header-count">{trail.summary.completedTopics}/{trail.summary.totalTopics} concluídos</span>}
        </div>

        {trail && (
          <SubjectNavigation activeId={currentSubjectId}>
            {trail.subjects.map((subject) => {
              const total = subject.topics.length
              const score = subject.topics.reduce((sum, topic) => {
                if (topic.progress.completed) return sum + 1
                if (topic.progress.sessionsCount > 0 || topic.progress.answeredQuestionsCount > 0) return sum + 0.5
                return sum
              }, 0)
              const pct = total > 0 ? Math.round((score / total) * 100) : 0
              const isActive = currentSubjectId === subject.id

              return (
                <button
                  key={subject.id}
                  className={`trail-subject-tab btn btn-sm d-inline-flex align-items-center gap-2 flex-shrink-0 ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveSubjectId(subject.id)}
                  style={{
                    backgroundColor: isActive ? '#531A61' : '#fff',
                    border: isActive ? '1px solid #531A61' : '1px solid var(--line-soft)',
                    color: isActive ? '#fff' : 'var(--text)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 13,
                    boxShadow: isActive ? '0 4px 10px -7px rgba(83,26,97,.45)' : 'none',
                  }}
                >
                  <i className={`bi ${getIcon(subject.iconSlug)}`} />
                  <span>{subject.name}</span>
                  <span style={{ opacity: 0.68, fontSize: 11 }}>{pct}%</span>
                </button>
              )
            })}
          </SubjectNavigation>
        )}
      </div>

      <div className="trail-content" style={{ padding: '24px 0 40px' }}>
        {trail?.recommendation && (() => {
          const subject = trail.subjects.find((item) => item.topics.some((topic) => topic.id === trail.recommendation!.topicId))
          const topic = subject?.topics.find((item) => item.id === trail.recommendation!.topicId)
          return topic && subject ? (
            <section className="trail-recommendation">
              <div><p className="trail-recommendation-label">Seu próximo estudo</p><h2>{topic.name}</h2></div>
              <button aria-label={`Estudar ${topic.name}`} title="Estudar agora" onClick={() => {
                setActiveSubjectId(subject.id)
                handleTopicClick(topic, subject)
              }}><i className="bi bi-arrow-right" aria-hidden="true" /></button>
            </section>
          ) : null
        })()}
        {trail && <div className="trail-diagnostic"><Link to={`/diagnostico/${vestibularSlug}`}>Fazer diagnóstico <i className="bi bi-arrow-up-right" aria-hidden="true" /></Link></div>}
        {isLoading && <TrailSkeleton />}

        {isError && (
          <div className="d-flex flex-column align-items-center justify-content-center gap-3" style={{ minHeight: 300 }}>
            <p className="text-muted mb-0" style={{ fontSize: 14 }}>Erro ao carregar a trilha.</p>
            <button onClick={() => refetch()} className="btn btn-sm text-white rounded-pill px-4" style={{ backgroundColor: '#531A61' }}>
              Tentar novamente
            </button>
          </div>
        )}

        {trail && (() => {
          const activeSubject = trail.subjects.find((s) => s.id === currentSubjectId) ?? trail.subjects[0]
          return activeSubject ? (
            <SubjectSection
              subject={activeSubject}
              activeTopicId={activeTopicId ?? trail.recommendation?.topicId ?? null}
              onTopicClick={handleTopicClick}
            />
          ) : null
        })()}
      </div>

      <TopicModal topic={modalTopic} subject={modalSubject} onClose={handleCloseModal} />

      <style>{`
        .trail-recommendation { max-width: 720px; margin: 0 auto 16px; padding: 18px 20px; display: flex; align-items: center; gap: 16px; background: #531A61; color: #fff; border-radius: 8px; }
        .trail-recommendation > div { min-width: 0; flex: 1; }
        .trail-recommendation-label { font-size: 12px; color: #FFDC5C; margin: 0 0 4px; font-weight: 600; }
        .trail-recommendation h2 { font-size: 18px; line-height: 1.4; margin: 0; color: #fff; }
        .trail-recommendation button { width: 44px; height: 44px; flex-shrink: 0; border: 0; background: #FFDC5C; border-radius: 6px; color: #531a61; }
        .trail-diagnostic { max-width: 720px; margin: 0 auto 20px; padding: 0 4px; text-align: right; font-size: 13px; }
        .trail-diagnostic a { color: #531A61; font-weight: 600; text-decoration: none; }
        .trail-header-count { color: #531A61; font-size: 12px; font-weight: 700; white-space: nowrap; }
        .trail-exam-select { width: auto; max-width: min(260px, 62vw); border: 1px solid var(--line-soft); border-radius: 6px; padding: 7px 30px 7px 9px; font-size: 16px; font-weight: 700; }
        .trail-subject-tab { border-radius: 6px !important; }
        .trail-subject-navigation { display: flex; align-items: center; gap: 6px; min-width: 0; }
        .trail-subject-arrow { flex: 0 0 36px; height: 40px; border: 1px solid var(--line-soft); border-radius: 6px; background: white; color: #531a61; }
        .trail-subject-arrow:disabled { opacity: .3; }
        .trail-subject-tabs {
          min-width: 0;
          flex: 1;
          overflow-x: auto !important;
          flex-wrap: nowrap !important;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .trail-subject-tabs::-webkit-scrollbar {
          display: none;
        }

        @media (max-width: 768px) {
          .trail-header {
            padding: 12px 14px !important;
          }

          .trail-header-top {
            align-items: flex-start !important;
          }

          .trail-stats {
            flex-wrap: wrap !important;
            justify-content: flex-end !important;
          }

          .trail-subject-tab {
            flex: 0 0 auto !important;
            justify-content: center !important;
            min-width: 0;
          }

          .trail-subject-tabs {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
          }

          .trail-subject-tab span:nth-child(2) {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .trail-content {
            padding-top: 20px !important;
            padding-bottom: 32px !important;
          }
        }
      `}</style>
    </AppLayout>
  )
}
