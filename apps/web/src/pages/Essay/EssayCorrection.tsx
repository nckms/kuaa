import { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'

interface Excerpt { quote: string; issue: string; suggestion: string }
interface Competency { id: number; score: number; justification: string; excerpts: Excerpt[] }
interface CorrectionResult {
  annulled: { reason: string } | null; competencies: Competency[]; total: number; summary: string; priorities: string[]
  interventionElements: { agent: boolean; action: boolean; means: boolean; effect: boolean; detail: boolean }
}
interface Rewrite { competency: number; original: string; rewritten: string; verdict: 'melhorou' | 'igual' | 'piorou'; comment: string; at: string }
interface Correction { id: string; status: string; total: number | null; result: CorrectionResult | null; rewrites: Rewrite[]; createdAt: string }

const NAMES = ['Norma culta', 'Tema e repertório', 'Argumentação', 'Coesão', 'Proposta de intervenção']
const ELEMENTS: Array<[keyof CorrectionResult['interventionElements'], string]> = [['agent', 'Agente'], ['action', 'Ação'], ['means', 'Meio/modo'], ['effect', 'Efeito'], ['detail', 'Detalhamento']]
const VERDICT = { melhorou: 'Melhorou', igual: 'Ficou parecido', piorou: 'Piorou' }
const code = (err: unknown) => (axios.isAxiosError(err) ? (err.response?.data as { code?: string; error?: string } | undefined) : undefined)

function RewriteBox({ essayId, competency, excerpt, onDone }: { essayId: string; competency: number; excerpt: Excerpt; onDone: (c: Correction) => void }) {
  const [text, setText] = useState(excerpt.quote)
  const [last, setLast] = useState<Rewrite | null>(null)
  const send = useMutation({
    mutationFn: async () => (await api.post<{ rewrite: Rewrite; correction: Correction }>(`/essays/${essayId}/correction/rewrite`,
      { competency, original: excerpt.quote, rewritten: text })).data,
    onSuccess: (data) => { setLast(data.rewrite); onDone(data.correction) },
  })
  return (
    <div className="ec-rewrite">
      <label>Reescreva o trecho<textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={1500} /></label>
      <button type="button" className="essay-secondary" disabled={send.isPending || text.trim() === excerpt.quote.trim() || text.trim().length < 3} onClick={() => send.mutate()}>
        {send.isPending ? 'Avaliando…' : 'Avaliar reescrita'}</button>
      {last && <p className={`ec-verdict is-${last.verdict}`} role="status"><strong>{VERDICT[last.verdict]}.</strong> {last.comment}</p>}
      {send.isError && <p className="essay-feedback-alert" role="alert">{code(send.error)?.error ?? 'Não foi possível avaliar agora. Tente de novo.'}</p>}
    </div>
  )
}

/** Correção completa por competência do ENEM (Kuaa Plus). */
export default function EssayCorrection({ essayId }: { essayId: string }) {
  const qc = useQueryClient()
  const key = ['essay-correction', essayId]
  const current = useQuery({ queryKey: key, queryFn: async () => (await api.get<Correction | null>(`/essays/${essayId}/correction`)).data })
  const request = useMutation({
    mutationFn: async () => (await api.post<Correction>(`/essays/${essayId}/correction`)).data,
    onSuccess: (data) => { qc.setQueryData(key, data); void qc.invalidateQueries({ queryKey: ['essay-history'] }) },
  })
  const [open, setOpen] = useState<string | null>(null)
  const c = current.data?.status === 'done' ? current.data : null
  const r = c?.result
  const err = request.isError ? code(request.error) : undefined

  return (
    <section className="essay-feedback ec" aria-labelledby="ec-title">
      <div className="ec-head"><h2 id="ec-title">Correção por competência</h2><span className="ec-plus">Plus</span></div>
      <p className="essay-feedback-disclaimer">Nota estimada pela IA nas 5 competências do ENEM, com os trechos que tiraram ponto. É uma estimativa: a banca do INEP pode dar outra nota.</p>
      {!r && <>
        {err?.code === 'PLUS_REQUIRED'
          ? <div className="ec-upsell"><p>A correção completa, com nota de 0 a 1000 e reescrita guiada, é do Kuaa Plus.</p><Link className="essay-primary" to="/planos">Conhecer o Plus</Link></div>
          : <button type="button" className="essay-primary" disabled={request.isPending} onClick={() => request.mutate()}>
            <i className="bi bi-clipboard2-check" aria-hidden="true" />{request.isPending ? 'Corrigindo (até 1 minuto)…' : 'Corrigir por competência'}</button>}
        {err && err.code !== 'PLUS_REQUIRED' && <p className="essay-feedback-alert" role="alert">{err.error ?? 'Não foi possível corrigir agora. Tente de novo.'}</p>}
      </>}
      {r && <div className="essay-feedback-content">
        <div className="ec-total"><strong>{r.total}</strong><span>de 1000 (estimativa)</span></div>
        {r.annulled && <p className="essay-feedback-alert" role="alert">Redação zerada: {r.annulled.reason}</p>}
        <p>{r.summary}</p>
        <div className="ec-comps">
          {r.competencies.map((comp) => (
            <article key={comp.id} className="ec-comp">
              <div className="ec-comp-head"><h3>C{comp.id} · {NAMES[comp.id - 1]}</h3><span className="k-mono">{comp.score}/200</span></div>
              <div className="ec-bar" aria-hidden="true"><span style={{ width: `${comp.score / 2}%` }} /></div>
              <p>{comp.justification}</p>
              {comp.id === 5 && <ul className="ec-elements" aria-label="Elementos da proposta de intervenção">
                {ELEMENTS.map(([k, label]) => <li key={k} className={r.interventionElements[k] ? 'is-on' : ''}><i className={`bi ${r.interventionElements[k] ? 'bi-check-circle-fill' : 'bi-circle'}`} aria-hidden="true" />{label}</li>)}
              </ul>}
              {comp.excerpts.map((ex, i) => {
                const id = `${comp.id}-${i}`
                return (
                  <div key={id} className="ec-excerpt">
                    <blockquote>“{ex.quote}”</blockquote>
                    <p><strong>Problema:</strong> {ex.issue}</p>
                    <p><strong>Como melhorar:</strong> {ex.suggestion}</p>
                    <button type="button" className="k-link-btn" aria-expanded={open === id} onClick={() => setOpen(open === id ? null : id)}>{open === id ? 'Fechar' : 'Reescrever este trecho'}</button>
                    {open === id && <RewriteBox essayId={essayId} competency={comp.id} excerpt={ex} onDone={(next) => qc.setQueryData(key, next)} />}
                  </div>
                )
              })}
            </article>
          ))}
        </div>
        <div className="essay-feedback-block"><h3>Prioridades para a próxima redação</h3><ol>{r.priorities.map((p, i) => <li key={i}>{p}</li>)}</ol></div>
      </div>}
    </section>
  )
}
