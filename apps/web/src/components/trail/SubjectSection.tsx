import type { TrailSubject, TrailTopic } from '../../types/trail'
import { getIcon } from '../../utils/iconMap'
import ProgressBar from '../ui/ProgressBar'

interface SubjectSectionProps {
  subject: TrailSubject
  activeTopicId: string | null
  onTopicClick: (topic: TrailTopic, subject: TrailSubject) => void
}

const BRAND = '#531A61'
const WINE = '#840033'
const LINE = '#dee2e6'
const SOFT = '#f3eaf7'

function getTopicStatus(topic: TrailTopic) {
  const { progress } = topic
  const hasActivity = progress.sessionsCount > 0 || progress.answeredQuestionsCount > 0

  if (!progress.unlocked) {
    return {
      label: 'Bloqueado',
      action: 'Bloqueado',
      icon: 'bi-lock',
      color: '#6b7280',
      background: '#f8f9fa',
      disabled: true,
    }
  }

  if (progress.completed) {
    return {
      label: 'Concluido',
      action: 'Revisar',
      icon: 'bi-check-lg',
      color: BRAND,
      background: SOFT,
      disabled: false,
    }
  }

  if (hasActivity) {
    return {
      label: 'Em andamento',
      action: 'Continuar',
      icon: 'bi-play-fill',
      color: WINE,
      background: 'rgba(132,0,51,.08)',
      disabled: false,
    }
  }

  return {
    label: 'Disponivel',
    action: 'Iniciar',
    icon: 'bi-circle',
    color: BRAND,
    background: SOFT,
    disabled: false,
  }
}

function TopicRow({
  topic,
  subject,
  index,
  total,
  active,
  onTopicClick,
}: {
  topic: TrailTopic
  subject: TrailSubject
  index: number
  total: number
  active: boolean
  onTopicClick: (topic: TrailTopic, subject: TrailSubject) => void
}) {
  const status = getTopicStatus(topic)
  const accuracy = topic.progress.accuracy
  const answered = topic.progress.answeredQuestionsCount
  const sessions = topic.progress.sessionsCount
  const isFirst = index === 0
  const isLast = index === total - 1
  const lineTopColor = topic.progress.unlocked ? BRAND : LINE
  const lineBottomColor = topic.progress.completed ? BRAND : LINE

  return (
    <button
      type="button"
      disabled={status.disabled}
      onClick={() => onTopicClick(topic, subject)}
      className={`trail-topic-row list-group-item list-group-item-action border-0 d-flex align-items-stretch gap-3 text-start ${active ? 'is-active' : ''}`}
      style={{
        padding: '0 18px 0 14px',
        cursor: status.disabled ? 'not-allowed' : 'pointer',
        backgroundColor: active ? '#faf7fb' : '#fff',
        opacity: status.disabled ? 0.76 : 1,
      }}
    >
      <div className="trail-step-rail d-flex flex-column align-items-center flex-shrink-0" aria-hidden="true">
        <span style={{ width: 2, flex: 1, minHeight: 18, backgroundColor: isFirst ? 'transparent' : lineTopColor }} />
        <span
          className="trail-step-marker rounded-circle d-grid"
          style={{
            width: 30,
            height: 30,
            placeItems: 'center',
            backgroundColor: topic.progress.unlocked ? status.background : '#f8f9fa',
            border: `1.5px solid ${topic.progress.unlocked ? status.color : LINE}`,
            color: status.color,
          }}
        >
          <i className={`bi ${status.icon}`} style={{ fontSize: 13 }} />
        </span>
        <span style={{ width: 2, flex: 1, minHeight: 18, backgroundColor: isLast ? 'transparent' : lineBottomColor }} />
      </div>

      <div className="trail-topic-body flex-grow-1 min-w-0 py-3">
        <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
          <span
            className="badge rounded-pill border"
            style={{
              color: status.color,
              backgroundColor: status.background,
              borderColor: `${status.color}33`,
              fontWeight: 650,
            }}
          >
            {status.label}
          </span>
          <span className="text-muted" style={{ fontSize: 12 }}>Etapa {index + 1}</span>
          <span className="text-muted" style={{ fontSize: 12 }}>Nivel {topic.progress.masteryLevel}/5</span>
          {accuracy !== null && <span className="text-muted" style={{ fontSize: 12 }}>{accuracy}% acerto</span>}
        </div>
        <p className="mb-1 fw-semibold text-truncate" style={{ color: 'var(--text)', fontSize: 15 }}>{topic.name}</p>
        <p className="mb-0 text-muted text-truncate" style={{ fontSize: 12 }}>
          {sessions > 0 ? `${sessions} sessao${sessions > 1 ? 'es' : ''}` : 'Sem sessoes'}
          {answered > 0 ? ` - ${answered} questoes respondidas` : ''}
        </p>
      </div>

      <div className="trail-topic-action flex-shrink-0 d-flex align-items-center gap-2 py-3">
        <span className="d-none d-sm-inline text-muted" style={{ fontSize: 12 }}>{topic.xpReward} XP</span>
        <span
          className="btn btn-sm rounded-pill px-3"
          style={{
            border: `1px solid ${status.disabled ? '#d1d5db' : BRAND}`,
            color: status.disabled ? '#6b7280' : BRAND,
            backgroundColor: '#fff',
            fontWeight: 600,
          }}
        >
          {status.action}
        </span>
      </div>
    </button>
  )
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
    <section className="trail-study-plan mx-auto px-3 px-md-4" style={{ maxWidth: 860, paddingBottom: 40 }}>
      <div className="card border-0 shadow-sm" style={{ borderRadius: 6 }}>
        <div className="card-body p-3 p-md-4">
          <div className="d-flex align-items-start gap-3">
            <div className="rounded-3 d-grid flex-shrink-0" style={{ width: 44, height: 44, placeItems: 'center', backgroundColor: SOFT, color: BRAND }}>
              <i className={`bi ${subjectIcon}`} style={{ fontSize: 22 }} />
            </div>
            <div className="flex-grow-1 min-w-0">
              <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                <div>
                  <p className="text-uppercase text-muted fw-semibold mb-1" style={{ fontSize: 11, letterSpacing: '.08em' }}>Materia</p>
                  <h2 className="mb-0" style={{ fontFamily: "'Questrial', sans-serif", fontSize: 22, color: 'var(--text)' }}>{subject.name}</h2>
                </div>
                <span className="badge rounded-pill border flex-shrink-0" style={{ color: BRAND, backgroundColor: SOFT, borderColor: `${BRAND}26` }}>{completedCount}/{totalCount}</span>
              </div>
              <ProgressBar value={progressPercent} color="vinho" size="sm" />
              <p className="mb-0 text-muted mt-2" style={{ fontSize: 12 }}>
                {progressPercent}% concluido - {answeredCount} topico(s) com atividade
              </p>
            </div>
          </div>
        </div>

        <div className="list-group list-group-flush trail-continuous-list">
          {subject.topics.map((topic, index) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              subject={subject}
              index={index}
              total={subject.topics.length}
              active={activeTopicId === topic.id}
              onTopicClick={onTopicClick}
            />
          ))}
        </div>
      </div>

      <style>{`
        .trail-topic-row {
          transition: background-color .15s ease, box-shadow .15s ease;
        }

        .trail-topic-row:not(:disabled):hover {
          background-color: #fbf8fc !important;
        }

        .trail-topic-row.is-active {
          box-shadow: inset 3px 0 0 #531A61;
        }

        .trail-topic-row + .trail-topic-row .trail-topic-body {
          border-top: 1px solid #edf0f2;
        }

        .trail-step-rail {
          width: 34px;
        }

        @media (max-width: 575px) {
          .trail-study-plan {
            padding-left: 10px !important;
            padding-right: 10px !important;
          }

          .trail-topic-row {
            padding-left: 8px !important;
            padding-right: 10px !important;
            gap: 8px !important;
          }

          .trail-topic-body {
            padding-top: 13px !important;
            padding-bottom: 13px !important;
          }

          .trail-step-rail {
            width: 28px;
          }

          .trail-step-marker {
            width: 26px !important;
            height: 26px !important;
          }

          .trail-topic-action {
            align-self: stretch;
            flex-direction: column;
            justify-content: center;
          }

          .trail-topic-action .btn {
            padding-left: 10px !important;
            padding-right: 10px !important;
            font-size: 12px;
          }
        }
      `}</style>
    </section>
  )
}
