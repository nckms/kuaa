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
  return (
    <div className="flex gap-0.5 mt-1 justify-center">
      {[1, 2, 3].map((i) => (
        <span key={i} className="text-xs" style={{ color: i <= count ? '#FFDC5C' : '#d1d5db' }}>
          ★
        </span>
      ))}
    </div>
  )
}

function ProgressRing({ masteryLevel }: { masteryLevel: number }) {
  const r = 26
  const circumference = 2 * Math.PI * r
  const offset = circumference - (masteryLevel / 5) * circumference
  return (
    <svg className="absolute inset-0 -rotate-90" width="64" height="64" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="#531A61"
        strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
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

  function handleClick() {
    if (!isLocked) onClick(topic)
  }

  const activeRing: React.CSSProperties = isActive
    ? { outline: '3px solid #FFDC5C', outlineOffset: '3px', borderRadius: '50%' }
    : {}

  if (isLocked) {
    return (
      <div className="flex flex-col items-center" title="Complete o tópico anterior para desbloquear">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#f3f4f6', border: '2px solid #d1d5db', cursor: 'not-allowed' }}
        >
          <span className="text-2xl text-gray-400">🔒</span>
        </div>
        <p className="text-xs text-gray-400 mt-1 text-center max-w-[72px] leading-tight">{topic.name}</p>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center cursor-pointer" onClick={handleClick} style={activeRing}>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#531A61' }}
        >
          <span className="text-white text-2xl font-bold">✓</span>
        </div>
        <Stars masteryLevel={progress.masteryLevel} />
        <p className="text-xs text-gray-600 mt-1 text-center max-w-[72px] leading-tight">{topic.name}</p>
      </div>
    )
  }

  if (isInProgress) {
    return (
      <div className="flex flex-col items-center cursor-pointer" onClick={handleClick} style={activeRing}>
        <div className="relative w-16 h-16">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#f3eaf7' }}
          >
            <span className="text-2xl">{icon}</span>
          </div>
          <ProgressRing masteryLevel={progress.masteryLevel} />
        </div>
        <p className="text-xs text-gray-600 mt-1 text-center max-w-[72px] leading-tight">{topic.name}</p>
      </div>
    )
  }

  if (isAvailable) {
    return (
      <div className="flex flex-col items-center" onClick={handleClick} style={{ cursor: 'pointer', ...activeRing }}>
        <div className="relative">
          <span
            className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ backgroundColor: '#FFDC5C', color: '#531A61' }}
          >
            NOVO
          </span>
          <motion.div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#531A61' }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-2xl">{icon}</span>
          </motion.div>
        </div>
        <p className="text-xs text-white font-medium mt-2 text-center max-w-[72px] leading-tight"
           style={{ color: '#531A61' }}>
          {topic.name}
        </p>
      </div>
    )
  }

  return null
}
