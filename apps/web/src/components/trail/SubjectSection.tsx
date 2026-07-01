import type { TrailSubject, TrailTopic } from '../../types/trail'
import { getIcon } from '../../utils/iconMap'
import ProgressBar from '../ui/ProgressBar'

interface SubjectSectionProps {
  subject: TrailSubject
  activeTopicId: string | null
  onTopicClick: (topic: TrailTopic, subject: TrailSubject) => void
}

function getTopicStatus(topic: TrailTopic) {
  const { progress } = topic
  const hasActivity = progress.sessionsCount > 0 || progress.answeredQuestionsCount > 0

  if (!progress.unlocked) {
    return {
      label: 'Bloqueado',
      action: 'Bloqueado',
      icon: 'bi-lock',
      className: 'text-bg-light',
      disabled: true,
    }
  }

  if (progress.completed) {
    return {
      label: 'Concluido',
      action: 'Revisar',
      icon: 'bi-check-circle-fill',
      className: 'text-bg-success',
      disabled: false,
    }
  }

  if (hasActivity) {
    return {
      label: 'Em andamento',
      action: 'Continuar',
      icon: 'bi-play-circle',
      className: 'text-bg-warning',
      disabled: false,
    }
  }

  return {
    label: 'Disponivel',
    action: 'Iniciar',
    icon: 'bi-circle',
    className: 'text-bg-primary',
    disabled: false,
  }
}

function TopicRow({
  topic,
  subject,
  index,
  active,
  onTopicClick,
}: {
  topic: TrailTopic
  subject: TrailSubject
  index: number
  active: boolean
  onTopicClick: (topic: TrailTopic, subject: TrailSubject) => void
}) {
  const status = getTopicStatus(topic)
  const accuracy = topic.progress.accuracy
  const answered = topic.progress.answeredQuestionsCount
  const sessions = topic.progress.sessionsCount

  return (
    <button
      type="button"
      disabled={status.disabled}
      onClick={() => onTopicClick(topic, subject)}
      className={`trail-topic-row list-group-item list-group-item-action border-0 border-top d-flex align-items-center gap-3 text-start ${active ? 'is-active' : ''}`}
      style={{
        padding: '16px 18px',
        cursor: status.disabled ? 'not-allowed' : 'pointer',
        backgroundColor: active ? '#f8f2fb' : '#fff',
        opacity: status.disabled ? 0.72 : 1,
      }}
    >
      <div className="trail-topic-index flex-shrink-0 d-grid rounded-3 border" style={{ width: 40, height: 40, placeItems: 'center', color: status.disabled ? '#9ca3af' : '#531A61', backgroundColor: status.disabled ? '#f8f9fa' : '#fff' }}>
        <span className="fw-semibold" style={{ fontSize: 13 }}>{String(index + 1).padStart(2, '0')}</span>
      </div>

      <div className="flex-grow-1 min-w-0">
        <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
          <span className={`badge rounded-pill ${status.className}`} style={{ fontWeight: 600 }}>
            <i className={`bi ${status.icon} me-1`} />
            {status.label}
          </span>
          <span className="text-muted" style={{ fontSize: 12 }}>Nivel {topic.progress.masteryLevel}/5</span>
          {accuracy !== null && <span className="text-muted" style={{ fontSize: 12 }}>{accuracy}% acerto</span>}
        </div>
        <p className="mb-1 fw-semibold text-truncate" style={{ color: 'var(--text)', fontSize: 15 }}>{topic.name}</p>
        <p className="mb-0 text-muted text-truncate" style={{ fontSize: 12 }}>
          {sessions > 0 ? `${sessions} sessao${sessions > 1 ? 'es' : ''}` : 'Sem sessoes'}
          {answered > 0 ? ` · ${answered} questoes respondidas` : ''}
        </p>
      </div>

      <div className="trail-topic-action flex-shrink-0 d-flex align-items-center gap-2">
        <span className="d-none d-sm-inline text-muted" style={{ fontSize: 12 }}>{topic.xpReward} XP</span>
        <span className={`btn btn-sm rounded-pill px-3 ${status.disabled ? 'btn-outline-secondary' : 'btn-outline-primary'}`} style={status.disabled ? undefined : { borderColor: '#531A61', color: '#531A61' }}>
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
            <div className="rounded-3 d-grid flex-shrink-0" style={{ width: 44, height: 44, placeItems: 'center', backgroundColor: 'var(--roxo-light)', color: '#531A61' }}>
              <i className={`bi ${subjectIcon}`} style={{ fontSize: 22 }} />
            </div>
            <div className="flex-grow-1 min-w-0">
              <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                <div>
                  <p className="text-uppercase text-muted fw-semibold mb-1" style={{ fontSize: 11, letterSpacing: '.08em' }}>Materia</p>
                  <h2 className="mb-0" style={{ fontFamily: "'Questrial', sans-serif", fontSize: 22, color: 'var(--text)' }}>{subject.name}</h2>
                </div>
                <span className="badge rounded-pill text-bg-light border flex-shrink-0">{completedCount}/{totalCount}</span>
              </div>
              <ProgressBar value={progressPercent} color="vinho" size="sm" />
              <p className="mb-0 text-muted mt-2" style={{ fontSize: 12 }}>
                {progressPercent}% concluido · {answeredCount} topico(s) com atividade
              </p>
            </div>
          </div>
        </div>

        <div className="list-group list-group-flush">
          {subject.topics.map((topic, index) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              subject={subject}
              index={index}
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

        @media (max-width: 575px) {
          .trail-study-plan {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }

          .trail-topic-row {
            align-items: flex-start !important;
            padding: 14px 12px !important;
          }

          .trail-topic-index {
            width: 34px !important;
            height: 34px !important;
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
