import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

interface Latest { area: string; label: string; score: number; year: number; attemptId: string }

/** Última nota TRI estimada por área, das provas anteriores completas (Índice Kuaa). */
export default function TriScoresCard() {
  const q = useQuery({ queryKey: ['exam-scores-latest'], queryFn: async () => (await api.get<{ scores: Latest[] }>('/exams/scores/latest')).data.scores })
  const scores = q.data ?? []
  return (
    <section className="k-card is-md ix-tri" aria-labelledby="ix-tri-title">
      <h2 id="ix-tri-title" className="k-h3">Última prova anterior completa</h2>
      {scores.length ? <>
        <div className="ix-tri-grid">{scores.map((s) => (
          <Link key={s.area} to={`/provas/${s.attemptId}`}><small>{s.label}</small><strong>{s.score.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</strong><span>prova de {s.year}</span></Link>
        ))}</div>
        <p className="k-muted" style={{ fontSize: 13, margin: '10px 0 0' }}>Nota de cada área na prova inteira, do jeito que o INEP calcula (em branco conta como erro).</p>
      </> : <p className="k-muted" style={{ fontSize: 14, margin: '4px 0 0' }}>
        Faça uma <Link to="/provas">prova anterior completa</Link> para ver a nota de cada área em condições de prova: 45 questões, no tempo do ENEM.
      </p>}
    </section>
  )
}
