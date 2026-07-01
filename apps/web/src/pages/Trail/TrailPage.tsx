import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTrail } from '../../hooks/useTrail'
import { useAuthStore } from '../../stores/auth.store'
import { useMyEnrollments } from '../../hooks/useEnrollments'
import AppLayout from '../../components/layout/AppLayout'
import ProgressBar from '../../components/ui/ProgressBar'
import StatChip from '../../components/ui/StatChip'
import SubjectSection from '../../components/trail/SubjectSection'
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
  const user = useAuthStore((s) => s.user)

  if (!user) return null

  const xpBar = Math.round(user.xp % 100)
  const correctAnswers = trail?.summary.correctAnswers ?? 0
  const wrongAnswers = trail?.summary.wrongAnswers ?? 0
  const accuracy = trail?.summary.accuracy ?? null
  const knowledgeGaps = trail?.summary.knowledgeGaps ?? []
  const progressValue = trail?.summary.totalTopics
    ? Math.round(((trail.summary.completedTopics + trail.summary.inProgressTopics * 0.5) / trail.summary.totalTopics) * 100)
    : 0

  return (
    <div className="trail-right-sidebar d-flex flex-column gap-3 p-4 h-100 overflow-auto" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <div className="d-flex align-items-center gap-3">
        <div className="rounded-circle d-grid flex-shrink-0" style={{ width: 44, height: 44, placeItems: 'center', backgroundColor: '#531A61', color: '#fff' }}>
          <span className="fw-bold">{user.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="min-w-0">
          <p className="mb-0 fw-semibold text-truncate" style={{ color: 'var(--text)', fontSize: 14 }}>{user.name}</p>
          <p className="mb-0 text-muted text-truncate" style={{ fontSize: 12 }}>{user.email}</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm" style={{ borderRadius: 8 }}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-semibold" style={{ color: '#531A61' }}>Nivel {user.level}</span>
            <span className="text-muted" style={{ fontSize: 12 }}>{user.xp} XP</span>
          </div>
          <ProgressBar value={xpBar} color="roxo" size="sm" />
          <div className="row g-2 mt-3">
            <div className="col-6">
              <div className="border rounded-3 p-2 text-center">
                <p className="mb-0 fw-bold" style={{ color: '#840033' }}><i className="bi bi-fire me-1" />{user.streakDays}</p>
                <p className="mb-0 text-muted" style={{ fontSize: 11 }}>dias</p>
              </div>
            </div>
            <div className="col-6">
              <div className="border rounded-3 p-2 text-center">
                <p className="mb-0 fw-bold" style={{ color: '#840033' }}><i className="bi bi-heart-fill me-1" />{user.hearts}</p>
                <p className="mb-0 text-muted" style={{ fontSize: 11 }}>vidas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {trail && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 8 }}>
          <div className="card-body">
            <p className="text-uppercase fw-semibold text-muted mb-2" style={{ fontSize: 11, letterSpacing: '.08em' }}>Progresso</p>
            <div className="d-flex align-items-end gap-2 mb-2">
              <p className="mb-0 fw-bold" style={{ fontSize: 30, color: '#531A61', lineHeight: 1 }}>
                {trail.summary.answeredTopics}/{trail.summary.totalTopics}
              </p>
              <p className="mb-1 text-muted" style={{ fontSize: 12 }}>topicos respondidos</p>
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
            <p className="text-uppercase fw-semibold text-muted mb-3" style={{ fontSize: 11, letterSpacing: '.08em' }}>Pontos de atencao</p>
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
              <p className="mb-0 text-muted" style={{ fontSize: 12, lineHeight: 1.45 }}>Responda mais questoes para formar o diagnostico.</p>
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
  const user = useAuthStore((s) => s.user)

  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null)
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null)
  const [modalTopic, setModalTopic] = useState<TrailTopic | null>(null)
  const [modalSubject, setModalSubject] = useState<TrailSubject | null>(null)

  const recommendedSubjectId =
    trail?.subjects.find((subject) => subject.topics.some((topic) => topic.progress.unlocked && !topic.progress.completed))?.id
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
            <p className="mb-0" style={{ fontFamily: "'Questrial', sans-serif", fontSize: 20, color: 'var(--text)' }}>{trail?.vestibular.name ?? '...'}</p>
          </div>
          {user && (
            <div className="trail-stats d-flex gap-2">
              <StatChip icon="bi-lightning-charge-fill" value={user.xp} label="XP" />
              <StatChip icon="bi-fire" value={user.streakDays} label="dias" />
            </div>
          )}
        </div>

        {trail && (
          <div className="trail-subject-tabs d-flex gap-2 overflow-auto pb-1">
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
                  className={`trail-subject-tab btn btn-sm d-inline-flex align-items-center gap-2 rounded-pill flex-shrink-0 ${isActive ? 'active' : ''}`}
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
          </div>
        )}
      </div>

      <div className="trail-content" style={{ padding: '36px 0 120px', minHeight: '100%' }}>
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
              activeTopicId={activeTopicId}
              onTopicClick={handleTopicClick}
            />
          ) : null
        })()}
      </div>

      <TopicModal topic={modalTopic} subject={modalSubject} onClose={handleCloseModal} />

      <style>{`
        .trail-subject-tabs {
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
            flex: 1 1 calc(50% - 8px) !important;
            justify-content: center !important;
            min-width: 0;
          }

          .trail-subject-tabs {
            flex-wrap: wrap !important;
            overflow-x: visible !important;
          }

          .trail-subject-tab span:nth-child(2) {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .trail-content {
            padding-top: 28px !important;
            padding-bottom: 160px !important;
          }
        }
      `}</style>
    </AppLayout>
  )
}
