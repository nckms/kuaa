import { AnimatePresence, motion } from 'framer-motion'
import type { TrailSubject, TrailTopic } from '../../types/trail'
import { getIcon } from '../../utils/iconMap'
import ProgressBar from '../ui/ProgressBar'
import { useGenerateQuiz } from '../../hooks/useQuiz'

interface TopicModalProps {
  topic: TrailTopic | null
  subject: TrailSubject | null
  onClose: () => void
}

export default function TopicModal({ topic, subject, onClose }: TopicModalProps) {
  const generateMutation = useGenerateQuiz()
  const answeredQuestions = topic?.progress.answeredQuestionsCount ?? 0
  const correctAnswers = topic?.progress.correctAnswersCount ?? 0
  const wrongAnswers = topic?.progress.wrongAnswersCount ?? 0
  const accuracy = topic?.progress.accuracy ?? null

  function getButtonLabel(): string {
    if (!topic) return ''
    if (topic.progress.sessionsCount === 0) return 'Iniciar topico'
    if (topic.progress.completed) return 'Revisar topico'
    return 'Continuar topico'
  }

  async function handleStart() {
    if (!topic) return
    onClose()
    generateMutation.mutate({ topicId: topic.id, count: 5 })
  }

  return (
    <AnimatePresence>
      {topic && (
        <>
          <motion.div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(26,8,38,.55)', zIndex: 40, backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 50 }}>
            <motion.div
              className="card border-0 shadow-lg"
              style={{
                width: '90vw',
                maxWidth: 420,
                borderRadius: 8,
                fontFamily: 'Inter, Arial, sans-serif',
              }}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-body p-4">
                <button
                  className="btn btn-sm btn-light border position-absolute d-grid"
                  onClick={onClose}
                  style={{ top: 16, right: 16, width: 34, height: 34, placeItems: 'center', color: 'var(--muted)' }}
                  aria-label="Fechar"
                >
                  <i className="bi bi-x-lg" />
                </button>

                {subject && (
                  <span className="badge rounded-pill d-inline-flex align-items-center gap-2 mb-3" style={{ backgroundColor: 'var(--roxo-light)', color: '#531A61', fontWeight: 600 }}>
                    <i className={`bi ${getIcon(subject.iconSlug)}`} />
                    {subject.name}
                  </span>
                )}

                <h2 className="mb-3 pe-5" style={{ fontFamily: "'Questrial', sans-serif", fontSize: 22, color: 'var(--text)', lineHeight: 1.2 }}>
                  {topic.name}
                </h2>

                <div className="d-flex gap-2 mb-3 flex-wrap">
                  <span className="badge rounded-pill d-inline-flex align-items-center gap-1" style={{ background: 'rgba(255,220,92,.24)', color: '#531A61' }}>
                    <i className="bi bi-lightning-charge-fill" />
                    +{topic.xpReward} XP
                  </span>
                  <span className="badge rounded-pill d-inline-flex align-items-center gap-1" style={{ background: 'var(--roxo-light)', color: '#531A61' }}>
                    <i className="bi bi-bar-chart-fill" />
                    Nivel {topic.progress.masteryLevel}/5
                  </span>
                  <span className="badge rounded-pill d-inline-flex align-items-center gap-1" style={{ background: 'var(--bg-soft)', color: 'var(--muted)' }}>
                    <i className="bi bi-journal-text" />
                    {topic.progress.sessionsCount} sessoes
                  </span>
                </div>

                <ProgressBar value={(topic.progress.masteryLevel / 5) * 100} color="roxo" size="sm" />
                <p className="text-muted mt-2 mb-3" style={{ fontSize: 12 }}>Progresso neste topico</p>

                {answeredQuestions > 0 && (
                  <div className="row g-2 mb-3">
                    <div className="col-4">
                      <div className="rounded-3 text-center py-2" style={{ background: 'rgba(16,185,129,.1)' }}>
                        <p className="mb-0 fw-bold" style={{ color: '#047857' }}>{correctAnswers}</p>
                        <p className="mb-0 text-muted" style={{ fontSize: 10 }}>acertos</p>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="rounded-3 text-center py-2" style={{ background: 'rgba(132,0,51,.08)' }}>
                        <p className="mb-0 fw-bold" style={{ color: '#840033' }}>{wrongAnswers}</p>
                        <p className="mb-0 text-muted" style={{ fontSize: 10 }}>erros</p>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="rounded-3 text-center py-2" style={{ background: 'var(--bg-soft)' }}>
                        <p className="mb-0 fw-bold" style={{ color: '#531A61' }}>{accuracy ?? 0}%</p>
                        <p className="mb-0 text-muted" style={{ fontSize: 10 }}>acerto</p>
                      </div>
                    </div>
                  </div>
                )}

                <hr className="my-3" />

                <button
                  className="btn w-100 rounded-pill d-flex align-items-center justify-content-center gap-2 text-white fw-bold"
                  onClick={handleStart}
                  disabled={generateMutation.isPending}
                  style={{ backgroundColor: generateMutation.isPending ? 'var(--muted)' : '#840033', minHeight: 46 }}
                >
                  {generateMutation.isPending ? (
                    <>
                      <i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite' }} />
                      Gerando questoes...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-play-fill" />
                      {getButtonLabel()}
                    </>
                  )}
                </button>
                <p className="text-muted text-center mb-0 mt-2" style={{ fontSize: 12 }}>
                  Voce ganha +{topic.xpReward} XP ao completar
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
