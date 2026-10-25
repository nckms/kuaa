import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { TrailSubject, TrailTopic } from '../../types/trail'
import { useGenerateQuiz } from '../../hooks/useQuiz'
import { subjectTheme } from '../../utils/subjectTheme'

interface TopicModalProps {
  topic: TrailTopic | null
  subject: TrailSubject | null
  subjectIndex?: number
  onClose: () => void
}

export default function TopicModal({ topic, subject, subjectIndex = 0, onClose }: TopicModalProps) {
  const navigate = useNavigate()
  const { vestibularSlug } = useParams<{ vestibularSlug: string }>()
  const generateMutation = useGenerateQuiz()

  useEffect(() => {
    if (!topic) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [topic, onClose])

  if (!topic) return null
  const theme = subjectTheme(subject?.slug, subjectIndex)
  const { progress } = topic
  const locked = !progress.unlocked
  const description = locked
    ? 'Esse tópico abre assim que você avançar no anterior. Assim você constrói a base na ordem certa.'
    : topic.description || 'Teoria direta ao ponto, exemplos resolvidos e questões no formato da sua prova.'
  const practiceLabel = progress.sessionsCount === 0 ? 'Praticar' : progress.completed ? 'Revisar' : 'Continuar'

  return (
    <div className="k-overlay is-sheet" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="topic-modal-title" className="k-dialog" onClick={(event) => event.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            {subject && <span className="k-tag" style={{ color: theme.color, background: theme.soft }}>{subject.name}</span>}
            <h3 id="topic-modal-title" className="k-h3" style={{ fontSize: 22, letterSpacing: '-.04em', marginTop: 12 }}>{topic.name}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="topic-close"><i className="bi bi-x-lg" aria-hidden="true" /></button>
        </div>
        <p style={{ margin: 0, fontFamily: 'var(--k-read)', fontSize: 15, lineHeight: 1.55, color: 'var(--k-muted)' }}>{description}</p>
        <div className="topic-stats">
          <div><strong className="k-num">{progress.accuracy == null ? '—' : `${progress.accuracy}%`}</strong><small>acerto</small></div>
          <div><strong className="k-num">{progress.answeredQuestionsCount}</strong><small>questões</small></div>
          <div><strong className="k-num">{progress.masteryLevel}/5</strong><small>domínio</small></div>
        </div>
        {locked ? (
          <div className="topic-locked"><i className="bi bi-lock" aria-hidden="true" />Conclua o tópico anterior para liberar.</div>
        ) : (
          <>
            {subject?.slug === 'redacao' && vestibularSlug && (
              <button type="button" className="k-btn k-btn-outline is-block" onClick={() => navigate(`/redacao/${vestibularSlug}`)}>
                <i className="bi bi-pen" aria-hidden="true" />Escrever redação
              </button>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              {topic.guideAvailable && (
                <button type="button" className="k-btn k-btn-outline" style={{ flex: 1, minHeight: 52, fontWeight: 600 }} onClick={() => navigate(`/estudar/${topic.id}`)}>
                  <i className="bi bi-book" aria-hidden="true" />Estudar
                </button>
              )}
              <button type="button" className="k-btn k-btn-primary" style={{ flex: 1, minHeight: 52 }} disabled={generateMutation.isPending}
                onClick={() => generateMutation.mutate({ topicId: topic.id, count: 5 })}>
                {generateMutation.isPending
                  ? <><i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />Gerando...</>
                  : <><i className="bi bi-play-fill" aria-hidden="true" />{practiceLabel}</>}
              </button>
            </div>
            {generateMutation.isError && <p role="alert" className="k-alert" style={{ margin: 0 }}>Não foi possível preparar a sessão. Tente novamente.</p>}
          </>
        )}
      </div>
      <style>{`
        .topic-close { width: 36px; height: 36px; flex: none; border-radius: 10px; border: 0; background: var(--k-bg); font-size: 15px; display: grid; place-items: center; color: var(--k-muted); }
        .topic-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
        .topic-stats > div { background: var(--k-bg); border-radius: 14px; padding: 14px; }
        .topic-stats strong { display: block; font-size: 18px; }
        .topic-stats small { display: block; font-size: 12px; color: var(--k-muted-2); margin-top: 4px; }
        .topic-locked { display: flex; gap: 10px; align-items: center; background: var(--k-bg); border-radius: 14px; padding: 14px; font-size: 14px; color: var(--k-muted); }
      `}</style>
    </div>
  )
}
