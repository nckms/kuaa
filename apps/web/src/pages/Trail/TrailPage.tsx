import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTrail } from '../../hooks/useTrail'
import { useAuthStore } from '../../stores/auth.store'
import { useMyEnrollments } from '../../hooks/useEnrollments'
import AppLayout from '../../components/layout/AppLayout'
import ProgressBar from '../../components/ui/ProgressBar'
import StatChip from '../../components/ui/StatChip'
import SubjectSection from '../../components/trail/SubjectSection'
import TopicModal from '../../components/trail/TopicModal'
import { getIcon } from '../../utils/iconMap'
import type { TrailTopic, TrailSubject } from '../../types/trail'

function TrailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: 40 }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: '#f3eaf7', animation: 'pulse 2s infinite' }} />
          <div style={{ width: 80, height: 10, borderRadius: 6, backgroundColor: '#f3eaf7' }} />
        </div>
      ))}
    </div>
  )
}

function TrailRightSidebarWrapper({ vestibularSlug }: { vestibularSlug: string }) {
  const navigate = useNavigate()
  const { data: trail } = useTrail(vestibularSlug)
  const { data: enrollments } = useMyEnrollments()
  const user = useAuthStore((s) => s.user)

  if (!user) return null

  const xpBar = Math.round((user.xp % 100))

  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto', fontFamily: 'Inter, Arial, sans-serif', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
          background: 'conic-gradient(from 180deg, #b347d9, #FFDC5C, #840033, #b347d9)',
          padding: 2,
        }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#531A61', display: 'grid', placeItems: 'center' }}>
            <span style={{ fontFamily: "'Unbounded', cursive", fontWeight: 700, fontSize: 14, color: '#fff' }}>
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div style={{ overflow: 'hidden' }}>
          <p style={{ fontFamily: "'Questrial', sans-serif", fontSize: 15, color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>{user.email}</p>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--line-soft)' }} />

      {/* Nível e XP */}
      <div>
        <div style={{ backgroundColor: 'var(--roxo-light)', borderRadius: 16, padding: 16, boxShadow: 'var(--shadow-xs)' }}>
          <p style={{ fontFamily: "'Questrial', sans-serif", fontSize: 16, color: '#531A61', marginBottom: 8 }}>Nível {user.level}</p>
          <ProgressBar value={xpBar} color="roxo" size="sm" />
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{user.xp} XP total</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <div style={{ backgroundColor: 'rgba(255,220,92,.18)', borderRadius: 14, padding: '10px 12px', textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--dark)' }}>
              <i className="bi bi-fire" style={{ color: '#840033', marginRight: 4 }} />
              {user.streakDays}
            </p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>dias seguidos</p>
          </div>
          <div style={{ backgroundColor: 'var(--vinho-light)', borderRadius: 14, padding: '10px 12px', textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#840033' }}>
              <i className="bi bi-heart-fill" style={{ marginRight: 4 }} />
              {user.hearts}
            </p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>corações</p>
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--line-soft)' }} />

      {/* Progresso da trilha */}
      {trail && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.1em' }}>Progresso da trilha</p>
          <p style={{ fontFamily: "'Unbounded', cursive", fontSize: 32, fontWeight: 700, color: '#531A61', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {trail.summary.answeredTopics}/{trail.summary.totalTopics}
          </p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>topicos respondidos · {trail.summary.completedTopics} concluidos</p>
          <ProgressBar value={trail.summary.totalTopics > 0 ? Math.round(((trail.summary.completedTopics + trail.summary.inProgressTopics * 0.5) / trail.summary.totalTopics) * 100) : 0} color="roxo" />
        </div>
      )}

      {/* Seletor de vestibular */}
      {(enrollments?.length ?? 0) > 1 && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--line-soft)' }} />
          <div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600 }}>Trocar vestibular</p>
            <select
              value={vestibularSlug}
              onChange={(e) => navigate(`/trilha/${e.target.value}`)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 14, border: '1.5px solid var(--line-soft)', fontSize: 14, color: 'var(--text)', backgroundColor: 'var(--surface)', outline: 'none', fontFamily: 'Inter, Arial, sans-serif' }}
            >
              {enrollments?.map((e) => (
                <option key={e.enrollment.vestibularId} value={e.vestibular.slug}>{e.vestibular.name}</option>
              ))}
            </select>
          </div>
        </>
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

  function handleTopicClick(topic: TrailTopic, subject: TrailSubject) {
    setActiveTopicId(topic.id)
    setModalTopic(topic)
    setModalSubject(subject)
  }

  function handleCloseModal() {
    setModalTopic(null)
    setModalSubject(null)
  }

  const rightSidebar = <TrailRightSidebarWrapper vestibularSlug={vestibularSlug} />

  return (
    <AppLayout rightSidebar={rightSidebar}>
      {/* Header sticky — DS v2 */}
      <div className="trail-header" style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'linear-gradient(135deg, #2a0d33 0%, #531A61 100%)',
        padding: '14px 24px',
        boxShadow: '0 4px 24px -8px rgba(83,26,97,.45)',
      }}>
        <div className="trail-header-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: trail ? 12 : 0 }}>
          <div>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,.45)', letterSpacing: '.2em', textTransform: 'uppercase', fontFamily: 'Inter, Arial, sans-serif', fontWeight: 600 }}>Estudando</p>
            <p style={{ fontFamily: "'Questrial', sans-serif", fontSize: 18, color: '#fff', marginTop: 2 }}>{trail?.vestibular.name ?? '…'}</p>
          </div>
          {user && (
            <div className="trail-stats" style={{ display: 'flex', gap: 8 }}>
              <StatChip icon="⚡" value={user.xp} label="XP" variant="dark" />
              <StatChip icon="🔥" value={user.streakDays} label="dias" variant="dark" />
            </div>
          )}
        </div>

        {/* Tabs de matérias */}
        {trail && (
          <div className="trail-subject-tabs" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
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
                  className="trail-subject-tab"
                  key={subject.id}
                  onClick={() => setActiveSubjectId(subject.id)}
                  style={{
                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
                    backgroundColor: isActive ? '#fff' : 'rgba(255,255,255,.12)',
                    color: isActive ? '#531A61' : 'rgba(255,255,255,.72)',
                    fontSize: 13, fontWeight: isActive ? 600 : 500,
                    fontFamily: 'Inter, Arial, sans-serif',
                    transition: 'all .15s',
                    boxShadow: isActive ? '0 2px 8px -2px rgba(83,26,97,.3)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 14 }}>{getIcon(subject.iconSlug)}</span>
                  <span>{subject.name}</span>
                  <span style={{ opacity: 0.65, fontSize: 11 }}>{pct}%</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Trilha */}
      <div className="trail-content" style={{ padding: '40px 0 120px', minHeight: '100%' }}>
        {isLoading && <TrailSkeleton />}

        {isError && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Erro ao carregar a trilha.</p>
            <button onClick={() => refetch()} style={{ backgroundColor: '#531A61', color: '#fff', padding: '11px 24px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, Arial, sans-serif', boxShadow: '0 4px 12px -3px rgba(83,26,97,.4)' }}>
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
            gap: 12px !important;
          }

          .trail-stats {
            flex-wrap: wrap !important;
            justify-content: flex-end !important;
          }

          .trail-subject-tab {
            flex: 1 1 calc(50% - 6px) !important;
            max-width: none !important;
            padding: 6px 11px !important;
            font-size: 12px !important;
            justify-content: center !important;
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
