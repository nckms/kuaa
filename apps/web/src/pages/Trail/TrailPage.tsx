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
    <div style={{ padding: 24, height: '100%', overflowY: 'auto', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#531A61', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ fontFamily: "'Questrial', sans-serif", fontSize: 15, color: '#1a1a1a', fontWeight: 500 }}>{user.name}</p>
          <p style={{ fontSize: 13, color: '#9ca3af' }}>{user.email}</p>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6' }} />

      {/* Nível e XP */}
      <div>
        <div style={{ backgroundColor: '#f3eaf7', borderRadius: 14, padding: 16 }}>
          <p style={{ fontFamily: "'Questrial', sans-serif", fontSize: 17, color: '#531A61', marginBottom: 10 }}>Nível {user.level}</p>
          <ProgressBar value={xpBar} color="roxo" size="sm" />
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>{user.xp} XP total</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <div style={{ backgroundColor: 'rgba(255,220,92,.2)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>🔥 {user.streakDays}</p>
            <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>dias seguidos</p>
          </div>
          <div style={{ backgroundColor: 'rgba(132,0,51,.08)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#840033' }}>❤️ {user.hearts}</p>
            <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>corações</p>
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6' }} />

      {/* Progresso da trilha */}
      {trail && (
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Progresso da trilha</p>
          <p style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 28, fontWeight: 700, color: '#531A61', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {trail.summary.completedTopics}/{trail.summary.totalTopics}
          </p>
          <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>tópicos concluídos</p>
          <ProgressBar value={trail.summary.totalTopics > 0 ? Math.round(trail.summary.completedTopics / trail.summary.totalTopics * 100) : 0} color="roxo" />
        </div>
      )}

      {/* Seletor de vestibular */}
      {(enrollments?.length ?? 0) > 1 && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6' }} />
          <div>
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Trocar vestibular</p>
            <select
              value={vestibularSlug}
              onChange={(e) => navigate(`/trilha/${e.target.value}`)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, color: '#1a1a1a', backgroundColor: '#fff', outline: 'none', fontFamily: 'Arial, sans-serif' }}
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

  const currentSubjectId = activeSubjectId ?? trail?.subjects[0]?.id ?? null

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
      {/* Header sticky roxo */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#531A61', padding: '14px 24px', boxShadow: '0 2px 8px rgba(83,26,97,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: trail ? 12 : 0 }}>
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>Estudando</p>
            <p style={{ fontFamily: "'Questrial', sans-serif", fontSize: 18, color: '#fff' }}>{trail?.vestibular.name ?? '…'}</p>
          </div>
          {user && (
            <div style={{ display: 'flex', gap: 8 }}>
              <StatChip icon="⚡" value={user.xp} label="XP" variant="dark" />
              <StatChip icon="🔥" value={user.streakDays} label="dias" variant="dark" />
            </div>
          )}
        </div>

        {/* Tabs de matérias */}
        {trail && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {trail.subjects.map((subject) => {
              const completed = subject.topics.filter((t) => t.progress.completed).length
              const total = subject.topics.length
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0
              const isActive = currentSubjectId === subject.id
              return (
                <button
                  key={subject.id}
                  onClick={() => setActiveSubjectId(subject.id)}
                  style={{
                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                    backgroundColor: isActive ? '#fff' : 'rgba(255,255,255,.1)',
                    color: isActive ? '#531A61' : 'rgba(255,255,255,.7)',
                    fontSize: 13, fontWeight: isActive ? 600 : 400, fontFamily: 'Arial, sans-serif',
                    transition: 'background-color .15s',
                  }}
                >
                  <span>{getIcon(subject.iconSlug)}</span>
                  <span>{subject.name}</span>
                  <span style={{ opacity: 0.65, fontSize: 11 }}>{pct}%</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Trilha */}
      <div style={{ padding: '40px 0 120px', minHeight: '100%' }}>
        {isLoading && <TrailSkeleton />}

        {isError && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Erro ao carregar a trilha.</p>
            <button onClick={() => refetch()} style={{ backgroundColor: '#531A61', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'Arial, sans-serif' }}>
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
    </AppLayout>
  )
}
