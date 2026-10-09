import type { TrailSubject, TrailTopic } from '../../types/trail'
import { getIcon } from '../../utils/iconMap'
import ProgressBar from '../ui/ProgressBar'
import './SubjectSection.css'

interface SubjectSectionProps {
  subject: TrailSubject
  activeTopicId: string | null
  onTopicClick: (topic: TrailTopic, subject: TrailSubject) => void
}

export default function SubjectSection({ subject, activeTopicId, onTopicClick }: SubjectSectionProps) {
  const completedCount = subject.topics.filter((topic) => topic.progress.completed).length
  const answeredCount = subject.topics.filter((topic) => topic.progress.sessionsCount > 0 || topic.progress.answeredQuestionsCount > 0).length
  const totalCount = subject.topics.length
  const progressScore = subject.topics.reduce((sum, topic) => sum + (topic.progress.completed ? 1 : topic.progress.sessionsCount > 0 || topic.progress.answeredQuestionsCount > 0 ? 0.5 : 0), 0)
  const progressPercent = totalCount > 0 ? Math.round((progressScore / totalCount) * 100) : 0
  const currentId = activeTopicId ?? subject.topics.find((topic) => topic.progress.unlocked && !topic.progress.completed)?.id

  return (
    <section className="study-path" aria-label={`Trilha de ${subject.name}`}>
      <header className="study-path-heading">
        <div className="study-path-heading-title">
          <i className={`bi ${getIcon(subject.iconSlug)}`} aria-hidden="true" />
          <h3>{subject.name}</h3>
          <span>{completedCount}/{totalCount} etapas</span>
        </div>
        <ProgressBar value={progressPercent} color="vinho" size="sm" />
        <p>{answeredCount} {answeredCount === 1 ? 'tópico respondido' : 'tópicos respondidos'}</p>
      </header>
      <ol className="study-path-stages">
        {subject.topics.map((topic, index) => {
          const { progress } = topic
          const current = topic.id === currentId && progress.unlocked
          const answered = progress.answeredQuestionsCount > 0
          const state = progress.completed ? 'complete' : !progress.unlocked ? 'locked' : current ? 'current' : 'available'
          const status = progress.completed ? 'Concluído' : !progress.unlocked ? 'Próxima etapa' : answered ? 'Em andamento' : current ? 'Comece aqui' : 'Disponível'
          const icon = progress.completed ? 'bi-check-lg' : !progress.unlocked ? 'bi-lock' : current ? 'bi-arrow-right' : 'bi-book'
          const contents = <>
            <span className="study-path-marker"><i className={`bi ${icon}`} aria-hidden="true" /><span className="study-path-number">{String(index + 1).padStart(2, '0')}</span></span>
            <span className="study-path-caption">
              <span className="study-path-status">{status}</span>
              <strong>{topic.name}</strong>
              {answered ? <small>{progress.correctAnswersCount}/{progress.answeredQuestionsCount} acertos{progress.accuracy !== null ? ` · ${Math.round(progress.accuracy)}%` : ''}</small> : !progress.unlocked ? <small>Conclua a etapa anterior</small> : null}
              {current && <span className="study-path-action">{answered ? 'Continuar' : 'Estudar'} <i className="bi bi-arrow-up-right" aria-hidden="true" /></span>}
            </span>
          </>
          return <li key={topic.id} className={`study-path-stage is-${state} ${index % 2 ? 'is-right' : 'is-left'}`}>
            {index < totalCount - 1 && <svg className="study-path-connector" viewBox="0 0 400 168" preserveAspectRatio="none" aria-hidden="true">
              <path d={index % 2 ? 'M288 40 C288 122 112 86 112 208' : 'M112 40 C112 122 288 86 288 208'} />
            </svg>}
            {progress.unlocked ? <button type="button" className="study-path-step" aria-current={current ? 'step' : undefined} onClick={() => onTopicClick(topic, subject)}>{contents}</button> : <div className="study-path-step">{contents}</div>}
          </li>
        })}
      </ol>
      <div className="study-path-end"><i className="bi bi-flag" aria-hidden="true" /><span>{completedCount === totalCount ? 'Percurso concluído' : `Seu percurso em ${subject.name}`}</span></div>
    </section>
  )
}
