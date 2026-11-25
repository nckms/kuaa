import axios from 'axios'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

/** Painel: contagem regressiva até a prova e, no Plus, quantas tarefas o plano tem para hoje. */
export default function PlanCountdownCard({ slug }: { slug: string }) {
  const q = useQuery({
    queryKey: ['study-plan-card', slug], staleTime: 5 * 60_000,
    queryFn: async () => {
      try {
        const p = (await api.get<{ daysLeft: number; today: unknown[] }>('/plan', { params: { vestibularSlug: slug } })).data
        return { daysLeft: p.daysLeft, tasks: p.today.length, plus: true }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 402) return { daysLeft: (err.response.data as { teaser: { daysLeft: number } }).teaser.daysLeft, tasks: 0, plus: false }
        throw err
      }
    },
  })
  if (!q.data) return null
  return (
    <Link to="/plano" className="k-card is-md dash-review">
      <i className="bi bi-calendar-check" aria-hidden="true" />
      <span><strong>Faltam {q.data.daysLeft} dias para a prova</strong>
        <small>{q.data.plus ? `${q.data.tasks} ${q.data.tasks === 1 ? 'tarefa' : 'tarefas'} no seu plano de hoje` : 'Plano diário até a prova no Kuaa Plus'}</small></span>
      <i className="bi bi-chevron-right" aria-hidden="true" />
    </Link>
  )
}
