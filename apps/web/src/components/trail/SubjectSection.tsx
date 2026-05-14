import type { TrailSubject, TrailTopic } from '../../types/trail'
import { getIcon } from '../../utils/iconMap'
import TopicNode from './TopicNode'

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
    <div className="pb-8">
      {/* Header da matéria */}
      <div className="flex items-center gap-3 mb-2 px-4">
        <span className="text-2xl">{getIcon(subject.iconSlug)}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base" style={{ color: '#531A61' }}>
              {subject.name}
            </h3>
            <span className="text-xs text-gray-500">
              {completedCount}/{totalCount} tópicos
            </span>
          </div>
          {/* Barra de progresso */}
          <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ backgroundColor: '#531A61', width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Caminho vertical com nós */}
      <div className="flex flex-col items-center gap-0 mt-6 px-4">
        {subject.topics.map((topic, index) => {
          const prevCompleted = index === 0 || subject.topics[index - 1].progress.completed
          return (
            <div key={topic.id} className="flex flex-col items-center">
              {/* Linha de conexão acima (exceto primeiro) */}
              {index > 0 && (
                <div
                  className="w-0.5 h-8"
                  style={{
                    borderLeft: `2px dashed ${prevCompleted ? '#531A61' : '#e5e7eb'}`,
                  }}
                />
              )}

              {/* Nó com zigue-zague */}
              <div
                style={{
                  transform: `translateX(${index % 2 === 0 ? '-20px' : '20px'})`,
                }}
              >
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
