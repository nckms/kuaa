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
  const answeredCount = subject.topics.filter((t) => t.progress.sessionsCount > 0 || t.progress.answeredQuestionsCount > 0).length
  const totalCount = subject.topics.length
  const progressScore = subject.topics.reduce((sum, topic) => {
    if (topic.progress.completed) return sum + 1
    if (topic.progress.sessionsCount > 0 || topic.progress.answeredQuestionsCount > 0) return sum + 0.5
    return sum
  }, 0)
  const progressPercent = totalCount > 0 ? Math.round((progressScore / totalCount) * 100) : 0
  const subjectIcon = getIcon(subject.iconSlug)

  return (
    <section style={{ paddingBottom: 40 }}>
      <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: 520, borderRadius: 8 }}>
        <div className="card-body">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-3 d-grid flex-shrink-0" style={{ width: 48, height: 48, placeItems: 'center', backgroundColor: 'var(--roxo-light)', color: '#531A61' }}>
              <i className={`bi ${subjectIcon}`} style={{ fontSize: 24 }} />
            </div>
            <div className="flex-grow-1 min-w-0">
              <div className="d-flex justify-content-between align-items-center gap-3 mb-2">
                <h3 className="mb-0 text-truncate" style={{ fontFamily: "'Questrial', sans-serif", fontSize: 20, color: 'var(--text)' }}>{subject.name}</h3>
                <span className="text-muted flex-shrink-0" style={{ fontSize: 12 }}>{completedCount}/{totalCount}</span>
              </div>
              <ProgressBar value={progressPercent} color="vinho" size="sm" />
              {answeredCount > 0 && (
                <p className="mb-0 text-muted mt-1" style={{ fontSize: 11 }}>{answeredCount} topico(s) respondido(s)</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex flex-column align-items-center pt-4">
        {subject.topics.map((topic, index) => {
          const prevTopic = index > 0 ? subject.topics[index - 1] : null
          const connectorColor = prevTopic?.progress.completed
            ? (topic.progress.unlocked ? '#531A61' : '#dfe3e8')
            : '#dfe3e8'
          const offset = index % 2 === 0 ? -28 : 28

          return (
            <div key={topic.id} className="d-flex flex-column align-items-center">
              {index > 0 && (
                <div style={{ width: 2, height: 38, borderLeft: `2px dashed ${connectorColor}` }} />
              )}
              <div className="trail-topic-offset" style={{ transform: `translateX(${offset}px)` }}>
                <TopicNode
                  topic={topic}
                  icon={subjectIcon}
                  isActive={activeTopicId === topic.id}
                  onClick={(t) => onTopicClick(t, subject)}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
