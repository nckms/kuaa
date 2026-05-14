import { motion } from 'framer-motion'
import type { TrailTopic } from '../../types/trail'

interface TopicNodeProps {
  topic: TrailTopic
  icon: string
  isActive: boolean
  onClick: (topic: TrailTopic) => void
}

function Stars({ masteryLevel }: { masteryLevel: number }) {
  const count = masteryLevel >= 5 ? 3 : masteryLevel >= 4 ? 2 : masteryLevel >= 2 ? 1 : 0
  if (count === 0) return null
  return (
    <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 4 }}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ color: '#FFDC5C', fontSize: 14 }}>⭐</span>
      ))}
    </div>
  )
}

function ProgressRing({ masteryLevel }: { masteryLevel: number }) {
  const size = 72
  const r = 30
  const circumference = 2 * Math.PI * r
  const offset = circumference - (masteryLevel / 5) * circumference
  return (
    <svg
      style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
      width={size} height={size} viewBox={`0 0 ${size} ${size}`}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#531A61" strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

export default function TopicNode({ topic, icon, isActive, onClick }: TopicNodeProps) {
  const { progress } = topic
  const isLocked = !progress.unlocked
  const isCompleted = progress.completed
  const isInProgress = progress.unlocked && !progress.completed && progress.sessionsCount > 0
  const isAvailable = progress.unlocked && !progress.completed && progress.sessionsCount === 0

  const activeRing: React.CSSProperties = isActive
    ? { outline: '3px solid #FFDC5C', outlineOffset: '4px', borderRadius: '50%', boxShadow: '0 0 0 6px rgba(255,220,92,.25)' }
    : {}

  const nodeSize = 72

  if (isLocked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} title="Complete o tópico anterior para desbloquear">
        <div style={{ width: nodeSize, height: nodeSize, borderRadius: '50%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed' }}>
          <span style={{ fontSize: 24, filter: 'grayscale(1)', opacity: 0.5 }}>🔒</span>
        </div>
        <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6, textAlign: 'center', maxWidth: 100, lineHeight: 1.3, fontFamily: 'Arial, sans-serif' }}>{topic.name}</p>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', ...activeRing }} onClick={() => onClick(topic)}>
        <div style={{ width: nodeSize, height: nodeSize, borderRadius: '50%', backgroundColor: '#531A61', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontSize: 28, fontWeight: 900 }}>✓</span>
        </div>
        <Stars masteryLevel={progress.masteryLevel} />
        <p style={{ fontSize: 13, color: '#531A61', marginTop: 6, textAlign: 'center', maxWidth: 100, lineHeight: 1.3, fontFamily: 'Arial, sans-serif', fontWeight: 500 }}>{topic.name}</p>
      </div>
    )
  }

  if (isInProgress) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', ...activeRing }} onClick={() => onClick(topic)}>
        <div style={{ position: 'relative', width: nodeSize, height: nodeSize }}>
          <div style={{ width: nodeSize, height: nodeSize, borderRadius: '50%', backgroundColor: '#f3eaf7', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', inset: 0 }}>
            <span style={{ fontSize: 24 }}>{icon}</span>
          </div>
          <ProgressRing masteryLevel={progress.masteryLevel} />
        </div>
        <p style={{ fontSize: 13, color: '#531A61', marginTop: 6, textAlign: 'center', maxWidth: 100, lineHeight: 1.3, fontFamily: 'Arial, sans-serif', fontWeight: 500 }}>{topic.name}</p>
      </div>
    )
  }

  if (isAvailable) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', ...activeRing }} onClick={() => onClick(topic)}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
            backgroundColor: '#FFDC5C', color: '#531A61', fontSize: 10, fontWeight: 700,
            padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap',
            fontFamily: 'Arial, sans-serif', letterSpacing: '.04em',
          }}>NOVO</span>
          <motion.div
            style={{ width: nodeSize, height: nodeSize, borderRadius: '50%', background: 'linear-gradient(135deg, #531A61, #840033)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(83,26,97,.4)' }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span style={{ fontSize: 28 }}>{icon}</span>
          </motion.div>
        </div>
        <p style={{ fontSize: 13, color: '#531A61', marginTop: 10, textAlign: 'center', maxWidth: 100, lineHeight: 1.3, fontFamily: 'Arial, sans-serif', fontWeight: 500 }}>{topic.name}</p>
      </div>
    )
  }

  return null
}
