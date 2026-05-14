import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { TrailTopic, TrailSubject } from '../../types/trail'
import { getIcon } from '../../utils/iconMap'
import ProgressBar from '../ui/ProgressBar'

interface TopicModalProps {
  topic: TrailTopic | null
  subject: TrailSubject | null
  onClose: () => void
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
          <motion.div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(42,13,51,.7)', zIndex: 40, backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div
              style={{ backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '90vw', maxWidth: 400, position: 'relative', boxShadow: '0 24px 48px rgba(0,0,0,.2)', fontFamily: 'Arial, sans-serif' }}
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>×</button>

              {subject && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f3eaf7', color: '#531A61', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 999, marginBottom: 16 }}>
                  <span>{getIcon(subject.iconSlug)}</span>
                  <span>{subject.name}</span>
                </div>
              )}

              <h2 style={{ fontFamily: "'Questrial', sans-serif", fontSize: 22, color: '#1a1a1a', marginBottom: 16 }}>{topic.name}</h2>

              {/* Stats chips */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ backgroundColor: 'rgba(255,220,92,.2)', color: '#531A61', fontSize: 13, padding: '5px 12px', borderRadius: 999, fontWeight: 600 }}>⚡ +{topic.xpReward} XP</span>
                <span style={{ backgroundColor: '#f3eaf7', color: '#531A61', fontSize: 13, padding: '5px 12px', borderRadius: 999 }}>📊 Nível {topic.progress.masteryLevel}/5</span>
                <span style={{ backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: 13, padding: '5px 12px', borderRadius: 999 }}>🎯 {topic.progress.sessionsCount} sessões</span>
              </div>

              <ProgressBar value={topic.progress.masteryLevel / 5 * 100} color="roxo" size="sm" />
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6, marginBottom: 20 }}>Seu progresso neste tópico</p>

              <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', marginBottom: 20 }} />

              <button
                onClick={handleStart}
                style={{ width: '100%', padding: '15px', borderRadius: 12, backgroundColor: '#840033', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}
              >
                {getButtonLabel()}
              </button>
              <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 10 }}>
                Você ganha +{topic.xpReward} XP ao completar
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
