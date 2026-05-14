import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { TrailTopic, TrailSubject } from '../../types/trail'
import { getIcon } from '../../utils/iconMap'

interface TopicModalProps {
  topic: TrailTopic | null
  subject: TrailSubject | null
  onClose: () => void
}

function MasteryDots({ level }: { level: number }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: i <= level ? '#531A61' : '#e5e7eb' }}
        />
      ))}
    </div>
  )
}

export default function TopicModal({ topic, subject, onClose }: TopicModalProps) {
  const navigate = useNavigate()

  function getButtonLabel(): string {
    if (!topic) return ''
    if (topic.progress.sessionsCount === 0) return 'Iniciar tópico →'
    if (topic.progress.completed) return 'Revisar tópico →'
    return 'Continuar tópico →'
  }

  function handleStart() {
    if (!topic) return
    navigate(`/quiz/${topic.id}`)
    onClose()
  }

  return (
    <AnimatePresence>
      {topic && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Fechar */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Fechar"
              >
                ×
              </button>

              {/* Subject badge */}
              {subject && (
                <div
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full mb-4"
                  style={{ backgroundColor: '#f3eaf7', color: '#531A61' }}
                >
                  <span>{getIcon(subject.iconSlug)}</span>
                  <span>{subject.name}</span>
                </div>
              )}

              {/* Topic name */}
              <h2 className="text-xl font-bold mb-1" style={{ color: '#531A61' }}>
                {topic.name}
              </h2>
              <p className="text-sm text-gray-500 mb-5">{topic.description}</p>

              {/* Stats */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">XP a ganhar</span>
                  <span className="font-bold text-sm" style={{ color: '#531A61' }}>
                    ⚡ +{topic.xpReward} XP
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Nível de maestria</span>
                  <MasteryDots level={topic.progress.masteryLevel} />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Seu progresso</span>
                    <span className="font-medium" style={{ color: '#531A61' }}>
                      {topic.progress.masteryLevel}/5
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        backgroundColor: '#531A61',
                        width: `${(topic.progress.masteryLevel / 5) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sessões realizadas</span>
                  <span className="font-medium text-sm">{topic.progress.sessionsCount}</span>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={handleStart}
                className="w-full py-3 rounded-xl font-bold text-sm transition hover:opacity-90"
                style={{ backgroundColor: '#531A61', color: '#FFDC5C' }}
              >
                {getButtonLabel()}
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
