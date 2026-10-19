import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
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

export default function StudyPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const [choice, setChoice] = useState<number | null>(null)
  const generate = useGenerateQuiz()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['study-guide', topicId], enabled: Boolean(topicId),
    queryFn: async () => (await api.get<StudyData>(`/study/topics/${topicId}`)).data,
  })

  if (isLoading) return <main className="study-page"><p>Carregando estudo...</p></main>
  if (isError || !data) return <main className="study-page"><p>Não foi possível carregar este material.</p><button onClick={() => navigate(-1)}>Voltar</button></main>

  const { topic, guide, mistakes } = data
  const answered = choice !== null
  return (
    <main className="study-page">
      <div className="study-inner">
        <button className="study-back" onClick={() => navigate(`/trilha/${topic.vestibularSlug}`)}>
          <i className="bi bi-arrow-left" aria-hidden="true" /> Voltar à trilha
        </button>
        <header className="study-header">
          <p>{topic.subjectName}</p>
          <h1>{topic.name}</h1>
          <div className="study-objective"><strong>Ao terminar, você deve conseguir:</strong> {guide.objective}</div>
        </header>

        <section className="study-section" aria-labelledby="study-concept">
          <h2 id="study-concept">Entenda o conceito</h2>
          {guide.explanation.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </section>

        <section className="study-section study-example" aria-labelledby="study-example">
          <h2 id="study-example">Exemplo resolvido</h2>
          <p><strong>Situação:</strong> {guide.example.prompt}</p>
          <ol>{guide.example.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
          <p className="study-answer"><strong>Resposta:</strong> {guide.example.answer}</p>
        </section>

        <section className="study-section" aria-labelledby="study-mistake">
          <h2 id="study-mistake">Atenção a este erro</h2>
          <p>{guide.commonMistake}</p>
        </section>

        {mistakes.length > 0 && (
          <section className="study-section" aria-labelledby="study-own-errors">
            <h2 id="study-own-errors">Suas dúvidas recentes</h2>
            <p>Retome estas explicações antes de tentar outra sessão.</p>
            <div className="study-errors">{mistakes.map((mistake) => (
              <article key={mistake.id}>
                <h3>{mistake.body}</h3>
                <p>{mistake.explanation}</p>
              </article>
            ))}</div>
          </section>
        )}

        <section className="study-section" aria-labelledby="study-check">
          <h2 id="study-check">Confira se entendeu</h2>
          <p>{guide.check.question}</p>
          <div className="study-options" role="group" aria-label="Alternativas da checagem">
            {guide.check.options.map((option, index) => (
              <button key={option} type="button" onClick={() => setChoice(index)}
                aria-pressed={choice === index} className={choice === index ? 'selected' : ''}>
                {option}
              </button>
            ))}
          </div>
          {answered && <p className="study-feedback" role="status">
            <strong>{choice === guide.check.correctIndex ? 'Correto.' : 'Ainda não.'}</strong> {guide.check.feedback}
          </p>}
        </section>

        <footer className="study-actions">
          <button type="button" onClick={() => generate.mutate({ topicId: topic.id, count: 5 })} disabled={generate.isPending}>
            {generate.isPending ? 'Preparando questões...' : 'Praticar este tópico'} <i className="bi bi-arrow-right" aria-hidden="true" />
          </button>
          {generate.isError && <p role="alert">Não foi possível preparar as questões. Tente novamente.</p>}
        </footer>
      </div>
    </main>
  )
}
