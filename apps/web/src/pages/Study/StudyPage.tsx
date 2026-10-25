import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import AppLayout from '../../components/layout/AppLayout'
import { useGenerateQuiz } from '../../hooks/useQuiz'
import { api } from '../../services/api'
import './StudyPage.css'

interface Guide {
  objective: string
  explanation: string[]
  example: { prompt: string; steps: string[]; answer: string }
  commonMistake: string
  check: { question: string; options: string[]; correctIndex: number; feedback: string }
}

interface StudyData {
  topic: { id: string; name: string; subjectName: string; vestibularSlug: string }
  guide: Guide
  mistakes: Array<{ id: string; body: string; explanation: string }>
}

function SectionTitle({ n, id, children }: { n: string; id: string; children: string }) {
  return <h2 id={id} className="study-h2"><span className="k-mono">{n}</span>{children}</h2>
}

export default function StudyPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const [choice, setChoice] = useState<number | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const generate = useGenerateQuiz()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['study-guide', topicId], enabled: Boolean(topicId),
    queryFn: async () => (await api.get<StudyData>(`/study/topics/${topicId}`)).data,
  })

  useEffect(() => { setChoice(null); setAttempts(0); setShowAnswer(false) }, [topicId])

  if (isLoading) return <AppLayout><div className="k-page"><div className="k-state">Carregando estudo...</div></div></AppLayout>
  if (isError || !data) return <AppLayout><div className="k-page"><div className="k-state"><p style={{ margin: 0 }}>Não foi possível carregar este material.</p><button className="k-btn k-btn-primary is-sm" onClick={() => navigate(-1)}>Voltar</button></div></div></AppLayout>

  const { topic, guide, mistakes } = data
  const answered = choice !== null
  const correct = choice === guide.check.correctIndex
  const revealAnswer = correct || attempts >= 2
  const words = [...guide.explanation, guide.example.prompt, ...guide.example.steps, guide.commonMistake].join(' ').split(/\s+/).length
  const readMinutes = Math.max(2, Math.round(words / 180))
  const sections = mistakes.length ? 5 : 4

  return (
    <AppLayout>
      <article className="k-page is-slim study">
        <nav aria-label="Breadcrumb" className="study-crumbs">
          <button type="button" className="k-link-btn" onClick={() => navigate(`/trilha/${topic.vestibularSlug}`)}><i className="bi bi-arrow-left" aria-hidden="true" />Trilha</button>
          <i className="bi bi-chevron-right" aria-hidden="true" /><span>{topic.subjectName}</span>
          <i className="bi bi-chevron-right" aria-hidden="true" /><span style={{ color: 'var(--k-ink)' }}>{topic.name}</span>
        </nav>
        <h1 className="study-title">{topic.name}</h1>
        <div className="study-meta"><span><i className="bi bi-clock" aria-hidden="true" />{readMinutes} min de leitura</span><span><i className="bi bi-layers" aria-hidden="true" />{sections} seções</span></div>
        <div className="k-tip"><i className="bi bi-bullseye" aria-hidden="true" /><div><strong>Ao terminar, você deve conseguir:</strong> {guide.objective}</div></div>

        <section aria-labelledby="study-concept">
          <SectionTitle n="01" id="study-concept">Explicação</SectionTitle>
          {guide.explanation.map((paragraph, index) => <p key={index} className="study-p">{paragraph}</p>)}
        </section>

        <section aria-labelledby="study-example">
          <SectionTitle n="02" id="study-example">Exemplo resolvido</SectionTitle>
          <div className="k-card is-sm study-example">
            <div className="study-example-q">{guide.example.prompt}</div>
            <button type="button" className="k-link-btn" aria-expanded={showAnswer} onClick={() => setShowAnswer((open) => !open)}>
              {showAnswer ? 'Esconder resolução' : 'Ver resolução'}<i className={`bi ${showAnswer ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true" />
            </button>
            {showAnswer && <div className="study-solution">
              <ol>{guide.example.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
              <p><strong>Resposta:</strong> {guide.example.answer}</p>
            </div>}
          </div>
        </section>

        <section aria-labelledby="study-mistake">
          <SectionTitle n="03" id="study-mistake">Erro comum</SectionTitle>
          <div className="k-card is-flush">
            <div className="study-err"><span><i className="bi bi-x-lg" aria-hidden="true" /></span><div>{guide.commonMistake}</div></div>
          </div>
        </section>

        {mistakes.length > 0 && (
          <section aria-labelledby="study-own-errors">
            <SectionTitle n="04" id="study-own-errors">Suas dúvidas recentes</SectionTitle>
            <p className="study-p" style={{ fontSize: 16 }}>Retome estas explicações antes de tentar outra sessão.</p>
            <div className="k-card is-flush">
              {mistakes.map((mistake) => (
                <div key={mistake.id} className="study-err"><span><i className="bi bi-arrow-counterclockwise" aria-hidden="true" /></span><div><strong>{mistake.body}</strong><p>{mistake.explanation}</p></div></div>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="study-check">
          <SectionTitle n={mistakes.length ? '05' : '04'} id="study-check">Confira se entendeu</SectionTitle>
          <p className="study-p">{guide.check.question}</p>
          <div className="study-options" role="group" aria-label="Alternativas da checagem">
            {guide.check.options.map((option, index) => {
              const state = choice === index ? (correct ? ' is-correct' : ' is-wrong') : revealAnswer && index === guide.check.correctIndex ? ' is-correct' : ''
              return (
                <button key={option} type="button" className={`k-option${state}`} onClick={() => { setChoice(index); setAttempts((current) => current + 1) }}
                  aria-pressed={choice === index} disabled={revealAnswer || choice === index}>
                  <span className="k-letter">{'ABCDE'[index]}</span><span style={{ flex: 1 }}>{option}</span>
                </button>
              )
            })}
          </div>
          {answered && <div className={`study-feedback${revealAnswer && correct ? ' is-ok' : ''}`} role="status">
            {revealAnswer ? <p><strong>{correct ? 'Isso mesmo.' : `Resposta: ${guide.check.options[guide.check.correctIndex]}.`}</strong> {guide.check.feedback}</p>
              : <p><strong>Tente outra vez.</strong> {guide.commonMistake}</p>}
          </div>}
        </section>
        {generate.isError && <p role="alert" className="k-alert">Não foi possível preparar as questões. Tente novamente.</p>}
      </article>

      <div className="study-float">
        <div>
          <span>Pronto pra praticar?</span>
          <button type="button" className="k-btn k-btn-yellow" onClick={() => generate.mutate({ topicId: topic.id, count: 5 })} disabled={generate.isPending}>
            <i className="bi bi-play-fill" aria-hidden="true" />{generate.isPending ? 'Preparando...' : 'Praticar agora'}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
