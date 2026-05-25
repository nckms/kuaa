import type { TrailSubject, TrailTopic } from '../../types/trail'
import { getIcon } from '../../utils/iconMap'
import TopicNode from './TopicNode'
import ProgressBar from '../ui/ProgressBar'

interface SubjectSectionProps {
  subject: TrailSubject
  activeTopicId: string | null
  onTopicClick: (topic: TrailTopic, subject: TrailSubject) => void
}

export default function SubjectSection({ subject, activeTopicId, onTopicClick }: SubjectSectionProps) {
  const completedCount = subject.topics.filter((t) => t.progress.completed).length
  const totalCount = subject.topics.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header matéria */}
      <div style={{ padding: '24px 24px 16px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <span style={{ fontSize: 36 }}>{getIcon(subject.iconSlug)}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h3 style={{ fontFamily: "'Questrial', sans-serif", fontSize: 20, color: 'var(--text)' }}>{subject.name}</h3>
              <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'Inter, Arial, sans-serif', fontWeight: 500 }}>{completedCount}/{totalCount}</span>
            </div>
            <ProgressBar value={progressPercent} color="vinho" size="sm" />
          </div>
        </div>
      </div>

      {/* Trilha de nós */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0' }}>
        {subject.topics.map((topic, index) => {
          const prevTopic = index > 0 ? subject.topics[index - 1] : null
          const connectorColor = prevTopic?.progress.completed
            ? (topic.progress.unlocked ? '#531A61' : '#e5e7eb')
            : '#e5e7eb'
          const offset = index % 2 === 0 ? -32 : 32

          return (
            <div key={topic.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Conector */}
              {index > 0 && (
                <div style={{ width: 2, height: 40, borderLeft: `2px dashed ${connectorColor}` }} />
              )}
              {/* Nó com zigzag */}
              <div style={{ transform: `translateX(${offset}px)` }}>
                <TopicNode
                  topic={topic}
                  icon={getIcon(subject.iconSlug)}
                  isActive={activeTopicId === topic.id}
                  onClick={(t) => onTopicClick(t, subject)}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
