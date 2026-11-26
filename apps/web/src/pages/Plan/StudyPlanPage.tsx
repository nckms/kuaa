import { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AppLayout from '../../components/layout/AppLayout'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth.store'
import { useGenerateQuiz } from '../../hooks/useQuiz'
import './StudyPlan.css'

interface Task { kind: string; title: string; detail: string; minutes: number; href?: string; topicId?: string }
interface Plan {
  examDate: string; estimatedDate: boolean; daysLeft: number; weeksLeft: number; phase: string; phaseText: string; dailyMinutes: number
  target: number | null; today: Task[]; week: { day: number; label: string; focus: string; today: boolean }[]
  areas: { area: string; label: string; score: number | null; accuracy: number | null; target: number | null }[]
}
type Result = { kind: 'ok'; plan: Plan } | { kind: 'plus'; examDate: string; daysLeft: number }
const ICON: Record<string, string> = { review: 'bi-arrow-repeat', practice: 'bi-pencil', reinforce: 'bi-bullseye', simulado: 'bi-clipboard-check', exam: 'bi-journal-text', essay: 'bi-pen', vespera: 'bi-moon-stars' }
const dateBr = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

/** Plano até a prova (Kuaa Plus). */
export default function StudyPlanPage() {
  const slug = useAuthStore((s) => s.firstVestibularSlug) ?? 'enem'
  const qc = useQueryClient()
  const generate = useGenerateQuiz()
  const q = useQuery({
    queryKey: ['study-plan', slug],
    queryFn: async (): Promise<Result> => {
      try { return { kind: 'ok', plan: (await api.get<Plan>('/plan', { params: { vestibularSlug: slug } })).data } } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 402) { const t = (err.response.data as { teaser: { examDate: string; daysLeft: number } }).teaser; return { kind: 'plus', ...t } }
        throw err
      }
    },
  })
  const [editing, setEditing] = useState(false)
  const [date, setDate] = useState('')
  const [target, setTarget] = useState('')
  const save = useMutation({
    mutationFn: async () => { await api.patch('/users/me', { preferences: { ...(date ? { examDate: date } : {}), ...(target ? { targetScore: Number(target) } : {}) } }) },
    onSuccess: () => { setEditing(false); void qc.invalidateQueries({ queryKey: ['study-plan'] }) },
  })
  const p = q.data?.kind === 'ok' ? q.data.plan : null

  return (
    <AppLayout>
      <div className="k-page">
        <p className="k-eyebrow">Plano até a prova</p>
        {q.isLoading && <div className="k-state">Montando seu plano…</div>}
        {q.isError && <div className="k-state" role="alert">Não foi possível carregar o plano.</div>}
        {q.data?.kind === 'plus' && <>
          <h1 className="sim-title">Faltam {q.data.daysLeft} dias</h1>
          <p className="sim-lead">Até a prova em {dateBr(q.data.examDate)} (data estimada).</p>
          <div className="k-card is-md sp-upsell">
            <p>Com o Kuaa Plus você recebe um plano diário até a prova: o que revisar, o que praticar e quando fazer simulado e prova completa, ajustado sozinho ao seu desempenho e com meta de nota por área.</p>
            <Link to="/planos" className="k-btn k-btn-primary">Conhecer o Kuaa Plus</Link>
          </div>
        </>}
        {p && <>
          <h1 className="sim-title">Faltam {p.daysLeft} dias</h1>
          <p className="sim-lead">Prova em {dateBr(p.examDate)}{p.estimatedDate ? ' (data estimada)' : ''} · {p.dailyMinutes} min por dia · <button type="button" className="k-link-btn" onClick={() => { setEditing((v) => !v); setDate(p.examDate); setTarget(p.target ? String(p.target) : '') }}>ajustar</button></p>
          {editing && <form className="k-card is-sm sp-edit" onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
            <label>Data da prova<input type="date" className="k-input" value={date} onChange={(e) => setDate(e.target.value)} /></label>
            <label>Meta de nota por área<input type="number" className="k-input" min={300} max={1000} step={10} placeholder="ex.: 700" value={target} onChange={(e) => setTarget(e.target.value)} /></label>
            <button type="submit" className="k-btn k-btn-primary is-sm" disabled={save.isPending}>Salvar</button>
            <p className="k-muted" style={{ fontSize: 13, margin: 0 }}>O tempo por dia vem da sua meta diária, em Configurações.</p>
          </form>}
          <p className="sp-phase">{p.phaseText}</p>
          <section aria-labelledby="sp-today" className="sp-section">
            <h2 id="sp-today" className="k-h3">Hoje</h2>
            {p.today.length === 0 ? <p className="k-muted">Nada pendente. Faça uma prática da sua trilha ou descanse.</p> : <ul className="sp-tasks">{p.today.map((t, i) => (
              <li key={i} className="k-card is-sm">
                <i className={`bi ${ICON[t.kind] ?? 'bi-check2-circle'}`} aria-hidden="true" />
                <div><strong>{t.title}</strong><small>{t.detail} · {t.minutes} min</small></div>
                {t.topicId ? <button type="button" className="k-btn k-btn-primary is-sm" disabled={generate.isPending} onClick={() => generate.mutate({ topicId: t.topicId!, count: 5 })}>Começar</button>
                  : t.href ? <Link to={t.href} className="k-btn k-btn-outline is-sm">Abrir</Link> : null}
              </li>
            ))}</ul>}
          </section>
          <section aria-labelledby="sp-week" className="sp-section">
            <h2 id="sp-week" className="k-h3">Esta semana</h2>
            <ul className="sp-week">{p.week.map((d) => <li key={d.day} className={d.today ? 'is-today' : ''}><span>{d.label}</span><small>{d.focus}</small></li>)}</ul>
          </section>
          <section aria-labelledby="sp-areas" className="sp-section">
            <h2 id="sp-areas" className="k-h3">Áreas, da mais fraca para a mais forte</h2>
            <ul className="sp-areas">{p.areas.map((a) => (
              <li key={a.area}><span>{a.label}</span>
                <span>{a.score != null ? `${Math.round(a.score).toLocaleString('pt-BR')} (TRI)` : a.accuracy != null ? `${a.accuracy}% de acerto` : 'sem dados'}{a.target && a.score != null ? ` · meta ${a.target}${a.score < a.target ? ` (faltam ${Math.round(a.target - a.score)})` : ' ✓'}` : ''}</span></li>
            ))}</ul>
            {!p.areas.some((a) => a.score != null) && <p className="k-muted" style={{ fontSize: 13 }}>Com 10 questões oficiais numa área (trilha, simulado ou <Link to="/provas">prova anterior</Link>), o plano passa a usar sua nota TRI dela, a mesma do <Link to="/indice">Índice Kuaa</Link>.</p>}
          </section>
        </>}
      </div>
    </AppLayout>
  )
}
