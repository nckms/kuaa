import type { TrailSubject, TrailTopic } from '../../types/trail'
import { subjectTheme } from '../../utils/subjectTheme'
import './SubjectSection.css'

interface SubjectSectionProps {
  subject: TrailSubject
  subjectIndex: number
  activeTopicId: string | null
  onTopicClick: (topic: TrailTopic, subject: TrailSubject) => void
}

const OFFSETS = [0, 70, 100, 70, 0, -70, -100, -70]

export default function SubjectSection({ subject, subjectIndex, activeTopicId, onTopicClick }: SubjectSectionProps) {
  const theme = subjectTheme(subject.slug, subjectIndex)
  const completedCount = subject.topics.filter((topic) => topic.progress.completed).length
  const totalCount = subject.topics.length
  const activeInSubject = subject.topics.some((topic) => topic.id === activeTopicId && topic.progress.unlocked)
  const currentId = activeInSubject ? activeTopicId : subject.topics.find((topic) => topic.progress.unlocked && !topic.progress.completed)?.id

  return (
    <section className="path" aria-label={`Trilha de ${subject.name}`} style={{ ['--subject' as string]: theme.color }}>
      <header className="path-head">
        <div><span className="path-swatch" /><h2>{subject.name}</h2></div>
        <span>{completedCount}/{totalCount} etapas</span>
      </header>
      <ol className="path-nodes">
        {subject.topics.map((topic, index) => {
          const { progress } = topic
          const state = progress.completed ? 'done' : !progress.unlocked ? 'locked' : topic.id === currentId ? 'current' : 'available'
          const label = { done: 'Dominado', current: progress.answeredQuestionsCount > 0 ? 'Continue aqui' : 'Comece aqui', available: progress.answeredQuestionsCount > 0 ? 'Em andamento' : 'Disponível', locked: 'Bloqueado' }[state]
          const icon = { done: 'bi-check-lg', current: 'bi-play-fill', available: 'bi-book', locked: 'bi-lock' }[state]
          const lineDone = index === 0 ? false : subject.topics[index - 1]!.progress.completed
          return (
            <li key={topic.id} className={`path-node is-${state}`} style={{ ['--x' as string]: OFFSETS[index % OFFSETS.length] }}>
              {index > 0 && <span className={`path-line${lineDone ? ' is-done' : ''}`} aria-hidden="true" />}
              <button type="button" className="path-step" aria-current={state === 'current' ? 'step' : undefined} onClick={() => onTopicClick(topic, subject)}>
                <span className="path-circle-wrap">
                  {state === 'current' && <span className="path-pulse" aria-hidden="true" />}
                  <span className="path-circle"><i className={`bi ${icon}`} aria-hidden="true" /></span>
                </span>
                <span className="path-caption">
                  <span className="path-state">{label}</span>
                  <strong>{topic.name}</strong>
                  <span className="path-bars" aria-label={`Domínio ${progress.masteryLevel} de 5`}>
                    {[0, 1, 2, 3, 4].map((bar) => <span key={bar} className={bar < progress.masteryLevel ? 'is-on' : ''} />)}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
