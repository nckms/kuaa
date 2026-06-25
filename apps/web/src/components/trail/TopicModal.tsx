import { motion, AnimatePresence } from 'framer-motion'
import type { TrailTopic, TrailSubject } from '../../types/trail'
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
    if (topic.progress.sessionsCount === 0) return 'Iniciar tópico'
    if (topic.progress.completed) return 'Revisar tópico'
    return 'Continuar tópico'
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
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(26,8,38,.65)', zIndex: 40, backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: 28,
                padding: 28,
                width: '90vw',
                maxWidth: 400,
                position: 'relative',
                boxShadow: 'var(--shadow-lg)',
                fontFamily: 'Inter, Arial, sans-serif',
              }}
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onClose}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'var(--bg-soft)', border: 'none',
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'grid', placeItems: 'center',
                  cursor: 'pointer', color: 'var(--muted)',
                  fontSize: 16, lineHeight: 1,
                }}
              >
                <i className="bi bi-x-lg" />
              </button>

              {subject && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'var(--roxo-light)', color: '#531A61', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 999, marginBottom: 14 }}>
                  <span>{getIcon(subject.iconSlug)}</span>
                  <span>{subject.name}</span>
                </div>
              )}

              <h2 style={{ fontFamily: "'Questrial', sans-serif", fontSize: 22, color: 'var(--text)', marginBottom: 16, lineHeight: 1.2 }}>{topic.name}</h2>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,220,92,.2)', color: '#531A61', fontSize: 12, padding: '5px 12px', borderRadius: 999, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <i className="bi bi-lightning-charge-fill" />
                  +{topic.xpReward} XP
                </span>
                <span style={{ background: 'var(--roxo-light)', color: '#531A61', fontSize: 12, padding: '5px 12px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <i className="bi bi-bar-chart-fill" />
                  Nível {topic.progress.masteryLevel}/5
                </span>
                <span style={{ background: 'var(--bg-soft)', color: 'var(--muted)', fontSize: 12, padding: '5px 12px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <i className="bi bi-journal-text" />
                  {topic.progress.sessionsCount} sessões
                </span>
              </div>

              <ProgressBar value={topic.progress.masteryLevel / 5 * 100} color="roxo" size="sm" />
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, marginBottom: 20 }}>Seu progresso neste tópico</p>

              {answeredQuestions > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
                  <div style={{ background: 'rgba(16,185,129,.1)', borderRadius: 14, padding: '10px 8px', textAlign: 'center' }}>
                    <p style={{ fontSize: 16, color: '#047857', fontWeight: 800 }}>{correctAnswers}</p>
                    <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>acertos</p>
                  </div>
                  <div style={{ background: 'rgba(132,0,51,.08)', borderRadius: 14, padding: '10px 8px', textAlign: 'center' }}>
                    <p style={{ fontSize: 16, color: '#840033', fontWeight: 800 }}>{wrongAnswers}</p>
                    <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>erros</p>
                  </div>
                  <div style={{ background: 'var(--bg-soft)', borderRadius: 14, padding: '10px 8px', textAlign: 'center' }}>
                    <p style={{ fontSize: 16, color: '#531A61', fontWeight: 800 }}>{accuracy ?? 0}%</p>
                    <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>acerto</p>
                  </div>
                </div>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid var(--line-soft)', marginBottom: 20 }} />

              <button
                onClick={handleStart}
                disabled={generateMutation.isPending}
                style={{
                  width: '100%', padding: '14px',
                  borderRadius: 999,
                  backgroundColor: generateMutation.isPending ? 'var(--muted)' : '#840033',
                  color: '#fff', fontWeight: 700, fontSize: 15, border: 'none',
                  cursor: generateMutation.isPending ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, Arial, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: generateMutation.isPending ? 'none' : '0 4px 14px -4px rgba(132,0,51,.45)',
                  transition: 'all .15s',
                }}
              >
                {generateMutation.isPending ? (
                  <>
                    <i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite' }} />
                    Gerando questões...
                  </>
                ) : (
                  <>
                    <i className="bi bi-play-fill" />
                    {getButtonLabel()}
                  </>
                )}
              </button>
              <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>
                Você ganha +{topic.xpReward} XP ao completar
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
