import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import AppLayout from '../../components/layout/AppLayout'
import { api } from '../../services/api'
import './SecondPhase.css'

interface Item { id: string; exam: string; year: number; subject: string; number: number; title: string; attempts: number; bestScore: number | null }

/** 2ª fase: questões dissertativas da Fuvest, por matéria. */
export default function SecondPhaseListPage() {
  const q = useQuery({ queryKey: ['second-phase'], queryFn: async () => (await api.get<{ questions: Item[] }>('/second-phase')).data.questions })
  const subjects = [...new Set((q.data ?? []).map((x) => x.subject))]
  return (
    <AppLayout>
      <div className="k-page">
        <p className="k-eyebrow">Fuvest 2025 · 2ª fase</p>
        <h1 className="sim-title">Questões dissertativas</h1>
        <p className="sim-lead">As questões reais da 2ª fase da Fuvest, com a resposta esperada oficial. No Kuaa Plus, você escreve sua resposta e recebe a correção item a item, pelo critério da banca.</p>
        {q.isLoading && <div className="k-state">Carregando…</div>}
        {q.isError && <div className="k-state" role="alert">Não foi possível carregar as questões.</div>}
        {subjects.map((s) => (
          <section key={s} className="sp2-subject" aria-labelledby={`sp2-${s}`}>
            <h2 id={`sp2-${s}`} className="k-h3">{s}</h2>
            <ul className="sp2-list">{(q.data ?? []).filter((x) => x.subject === s).map((x) => (
              <li key={x.id}><Link to={`/segunda-fase/${x.id}`} className="k-card is-sm">
                <span className="k-mono">{String(x.number).padStart(2, '0')}</span><strong>{x.title}</strong>
                <small>{x.attempts ? `${x.attempts} ${x.attempts === 1 ? 'tentativa' : 'tentativas'}${x.bestScore != null ? ` · melhor: ${x.bestScore.toLocaleString('pt-BR')}` : ''}` : 'Não feita'}</small>
              </Link></li>
            ))}</ul>
          </section>
        ))}
      </div>
    </AppLayout>
  )
}
