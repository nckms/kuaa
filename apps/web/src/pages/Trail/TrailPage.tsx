import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTrail } from '../../hooks/useTrail'
import { useAuthStore } from '../../stores/auth.store'
import SubjectSection from '../../components/trail/SubjectSection'
import TopicModal from '../../components/trail/TopicModal'
import TrailSidebar from '../../components/trail/TrailSidebar'
import BottomNav from '../../components/layout/BottomNav'
import { getIcon } from '../../utils/iconMap'
import type { TrailTopic, TrailSubject } from '../../types/trail'

function TrailSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 p-8 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
          <div className="w-20 h-3 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  )
}

export default function TrailPage() {
  const { vestibularSlug = '' } = useParams<{ vestibularSlug: string }>()
  const { data: trail, isLoading, isError, refetch } = useTrail(vestibularSlug)
  const user = useAuthStore((state) => state.user)

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

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      {/* Sidebar esquerda — desktop */}
      <aside
        className="hidden lg:flex flex-col w-60 border-r border-gray-100 flex-shrink-0"
        style={{ backgroundColor: '#faf8ff' }}
      >
        <div className="p-5 border-b border-gray-100">
          <span className="text-xl font-bold" style={{ color: '#531A61' }}>🦅 KUAA</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 px-2">Menu</p>
          {[
            { label: '📚 Trilha', path: '/trilha' },
            { label: '👤 Perfil', path: '/perfil' },
            { label: '🏆 Ranking', path: '/ranking' },
          ].map((item) => (
            <a
              key={item.path}
              href={item.path}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition hover:opacity-80"
              style={{ color: '#531A61' }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Conteúdo central */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header sticky */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Estudando</p>
              <h1 className="font-bold text-base" style={{ color: '#531A61' }}>
                {trail?.vestibular.name ?? '…'}
              </h1>
            </div>
            {user && (
              <div className="flex items-center gap-4 text-sm">
                <span style={{ color: '#531A61' }}>⚡ {user.xp} XP</span>
                <span style={{ color: '#840033' }}>🔥 {user.streakDays}</span>
              </div>
            )}
          </div>

          {/* Tabs das matérias */}
          {trail && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
              {trail.subjects.map((subject) => {
                const completed = subject.topics.filter((t) => t.progress.completed).length
                const total = subject.topics.length
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0
                const isActive = currentSubjectId === subject.id
                return (
                  <button
                    key={subject.id}
                    onClick={() => setActiveSubjectId(subject.id)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    style={{
                      backgroundColor: isActive ? '#531A61' : 'transparent',
                      color: isActive ? '#fff' : '#531A61',
                      border: `1px solid ${isActive ? '#531A61' : '#531A61' + '44'}`,
                    }}
                  >
                    <span>{getIcon(subject.iconSlug)}</span>
                    <span>{subject.name}</span>
                    <span className="opacity-60">{pct}%</span>
                  </button>
                )
              })}
            </div>
          )}
        </header>

        {/* Área de scroll da trilha */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && <TrailSkeleton />}

          {isError && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <p className="text-gray-500 text-sm">Erro ao carregar a trilha.</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#531A61', color: '#fff' }}
              >
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
      </main>

      {/* Sidebar direita — desktop */}
      <aside
        className="hidden lg:block w-72 border-l border-gray-100 flex-shrink-0"
        style={{ backgroundColor: '#faf8ff' }}
      >
        <TrailSidebar summary={trail?.summary} />
      </aside>

      {/* Bottom nav — mobile */}
      <BottomNav vestibularSlug={vestibularSlug} />

      {/* Modal */}
      <TopicModal topic={modalTopic} subject={modalSubject} onClose={handleCloseModal} />
    </div>
  )
}
