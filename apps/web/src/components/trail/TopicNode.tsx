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
    <div className="d-flex justify-content-center gap-1 mt-1" aria-label={`${count} estrelas`}>
      {Array.from({ length: count }).map((_, i) => (
        <i key={i} className="bi bi-star-fill" style={{ color: '#d6a322', fontSize: 12 }} />
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
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#531A61"
        strokeWidth="4"
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
  const hasActivity = progress.sessionsCount > 0 || progress.answeredQuestionsCount > 0
  const isInProgress = progress.unlocked && !progress.completed && hasActivity
  const isAvailable = progress.unlocked && !progress.completed && !hasActivity

  const nodeSize = 72
  const activeRing: React.CSSProperties = isActive
    ? { outline: '3px solid rgba(255,220,92,.85)', outlineOffset: 4, borderRadius: 999 }
    : {}

  const titleStyle: React.CSSProperties = {
    fontSize: 13,
    color: isLocked ? '#9ca3af' : '#531A61',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 118,
    lineHeight: 1.3,
    fontFamily: 'Inter, Arial, sans-serif',
    fontWeight: isLocked ? 500 : 600,
  }

  if (isLocked) {
    return (
      <div className="d-flex flex-column align-items-center" title="Complete o topico anterior para desbloquear">
        <div
          className="rounded-circle d-grid border"
          style={{ width: nodeSize, height: nodeSize, placeItems: 'center', backgroundColor: '#f1f3f5', color: '#9ca3af', cursor: 'not-allowed' }}
        >
          <i className="bi bi-lock" style={{ fontSize: 22 }} />
        </div>
        <p style={titleStyle}>{topic.name}</p>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <button className="trail-topic-node border-0 bg-transparent d-flex flex-column align-items-center p-0" style={{ cursor: 'pointer', ...activeRing }} onClick={() => onClick(topic)}>
        <span className="badge rounded-pill text-bg-success mb-2" style={{ fontSize: 10, letterSpacing: '.04em' }}>Concluido</span>
        <div className="rounded-circle d-grid" style={{ width: nodeSize, height: nodeSize, placeItems: 'center', backgroundColor: '#531A61', color: '#fff' }}>
          <i className="bi bi-check-lg" style={{ fontSize: 28 }} />
        </div>
        <Stars masteryLevel={progress.masteryLevel} />
        <p style={titleStyle}>{topic.name}</p>
      </button>
    )
  }

  if (isInProgress) {
    const label = progress.sessionsCount > 0 ? 'Respondido' : 'Em andamento'
    const detail = progress.sessionsCount > 0
      ? `${progress.sessionsCount} sessao${progress.sessionsCount > 1 ? 's' : ''}`
      : `${progress.answeredQuestionsCount} resposta${progress.answeredQuestionsCount > 1 ? 's' : ''}`

    return (
      <button className="trail-topic-node border-0 bg-transparent d-flex flex-column align-items-center p-0" style={{ cursor: 'pointer', ...activeRing }} onClick={() => onClick(topic)}>
        <span className="badge rounded-pill mb-2" style={{ backgroundColor: '#FFDC5C', color: '#531A61', fontSize: 10, letterSpacing: '.04em' }}>{label}</span>
        <div style={{ position: 'relative', width: nodeSize, height: nodeSize }}>
          <div className="rounded-circle d-grid" style={{ width: nodeSize, height: nodeSize, placeItems: 'center', backgroundColor: '#f3eaf7', color: '#531A61', position: 'absolute', inset: 0 }}>
            <i className={`bi ${icon}`} style={{ fontSize: 24 }} />
          </div>
          <ProgressRing masteryLevel={progress.masteryLevel} />
        </div>
        <p style={titleStyle}>{topic.name}</p>
        <p className="text-muted mb-0" style={{ fontSize: 11, textAlign: 'center', maxWidth: 118 }}>{detail}</p>
      </button>
    )
  }

  if (isAvailable) {
    return (
      <button className="trail-topic-node border-0 bg-transparent d-flex flex-column align-items-center p-0" style={{ cursor: 'pointer', ...activeRing }} onClick={() => onClick(topic)}>
        <span className="badge rounded-pill mb-2" style={{ backgroundColor: '#FFDC5C', color: '#531A61', fontSize: 10, letterSpacing: '.04em' }}>Novo</span>
        <div
          className="rounded-circle d-grid"
          style={{
            width: nodeSize,
            height: nodeSize,
            placeItems: 'center',
            backgroundColor: '#531A61',
            color: '#fff',
            boxShadow: '0 8px 18px -10px rgba(83,26,97,.8)',
          }}
        >
          <i className={`bi ${icon}`} style={{ fontSize: 27 }} />
        </div>
        <p style={titleStyle}>{topic.name}</p>
      </button>
    )
  }

  return null
}
