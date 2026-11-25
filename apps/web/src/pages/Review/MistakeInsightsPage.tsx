import axios from 'axios'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import AppLayout from '../../components/layout/AppLayout'
import { api } from '../../services/api'
import './Review.css'

interface Report {
  windowDays: number; wrong: number; answered: number; dominant: string | null; avgWrongSeconds: number | null; fastWrong: number
  reasons: { reason: string; label: string; count: number }[]
  bySubject: { subject: string; wrong: number; topReasonLabel: string }[]
  actions: string[]
}
type Result = { kind: 'ok'; report: Report } | { kind: 'plus'; wrong: number }

const DOMINANT: Record<string, string> = {
  conteudo: 'Você erra mais por não saber o conteúdo. O caminho é rever a teoria do tópico antes de praticar.',
  leitura: 'Você erra mais na leitura do enunciado. Sublinhar o comando da questão antes de olhar as alternativas ajuda.',
  conta: 'Você erra mais nas contas. Vale refazer a conta pelo caminho inverso antes de marcar.',
  duvida: 'Você costuma ficar entre duas alternativas. Treine eliminar as erradas dizendo por que cada uma está errada.',
  tempo: 'Muitos erros vêm de pressa ou chute. Responder com mais calma rende mais do que responder mais questões.',
}

/** Raio-X dos erros (Kuaa Plus): por que você erra, por matéria, e o que fazer nesta semana. */
export default function MistakeInsightsPage() {
  const q = useQuery({
    queryKey: ['insights-mistakes'],
    queryFn: async (): Promise<Result> => {
      try { return { kind: 'ok', report: (await api.get<Report>('/insights/mistakes')).data } } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 402) return { kind: 'plus', wrong: (err.response.data as { teaser?: { wrong: number } }).teaser?.wrong ?? 0 }
        throw err
      }
    },
  })
  const r = q.data?.kind === 'ok' ? q.data.report : null
  const max = r ? Math.max(1, ...r.reasons.map((x) => x.count)) : 1
  return (
    <AppLayout>
      <div className="k-page">
        <p className="k-eyebrow">Últimos 30 dias</p>
        <h1 className="sim-title">Raio-X dos erros</h1>
        <p className="sim-lead">Não só onde você erra, mas por quê. Depois de cada erro, toque no motivo: quanto mais você marca, mais preciso fica o Raio-X.</p>
        {q.isLoading && <div className="k-state">Carregando…</div>}
        {q.isError && <div className="k-state" role="alert">Não foi possível carregar o Raio-X.</div>}
        {q.data?.kind === 'plus' && (
          <div className="k-card is-md rv-upsell">
            <p>{q.data.wrong === 0 ? 'Você ainda não errou questões nos últimos 30 dias.' : <>Você errou <strong>{q.data.wrong}</strong> {q.data.wrong === 1 ? 'questão' : 'questões'} nos últimos 30 dias.</>} O Raio-X mostra o padrão por trás desses erros, por matéria, e monta 3 ações para a sua semana.</p>
            <Link to="/planos" className="k-btn k-btn-primary">Conhecer o Kuaa Plus</Link>
          </div>
        )}
        {r && (r.wrong === 0 ? <div className="k-state">Nenhum erro nos últimos 30 dias. Pratique um pouco e volte aqui.</div> : <>
          {r.dominant && <div className="k-card is-md rv-dominant"><strong>Seu padrão</strong><p>{DOMINANT[r.dominant]}</p></div>}
          <section className="rv-section" aria-labelledby="rx-reasons">
            <h2 id="rx-reasons" className="k-h3">Por que você errou ({r.wrong} de {r.answered} questões)</h2>
            <ul className="rx-bars">{r.reasons.map((x) => (
              <li key={x.reason}><span>{x.label}</span><span className="rx-bar"><span style={{ width: `${(x.count / max) * 100}%` }} /></span><strong>{x.count}</strong></li>
            ))}</ul>
            <p className="k-muted" style={{ fontSize: 13 }}>Tempo médio nas erradas: {r.avgWrongSeconds ?? '—'} s · {r.fastWrong} respondidas em menos de 15 s.</p>
          </section>
          <section className="rv-section" aria-labelledby="rx-subjects">
            <h2 id="rx-subjects" className="k-h3">Por matéria</h2>
            <ul className="rv-items">{r.bySubject.map((s) => <li key={s.subject}><p><strong>{s.subject}</strong>: {s.wrong} erros</p><small>Motivo mais comum: {s.topReasonLabel}</small></li>)}</ul>
          </section>
          {r.actions.length > 0 && <section className="rv-section" aria-labelledby="rx-actions">
            <h2 id="rx-actions" className="k-h3">Plano desta semana</h2>
            <ol className="rx-actions">{r.actions.map((a, i) => <li key={i}>{a}</li>)}</ol>
          </section>}
          <Link to="/erros" className="k-btn k-btn-outline">Revisar meus erros</Link>
        </>)}
      </div>
    </AppLayout>
  )
}
