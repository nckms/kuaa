import { useState } from 'react'
import axios from 'axios'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AppLayout from '../../components/layout/AppLayout'
import QuestionMedia from '../../components/quiz/QuestionMedia'
import { api } from '../../services/api'
import './SecondPhase.css'

interface Item { item: string; score: number; max: number; verdict: string; feedback: string }
interface Attempt { id: string; answer: string; score: number; maxScore: number; createdAt: string; result: { items: Item[]; summary: string } }
interface Data { question: { id: string; exam: string; year: number; subject: string; number: number; title: string; imageUrl: string; imageAlt: string }; attempts: Attempt[] }
const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

function Result({ attempt }: { attempt: Attempt }) {
  return (
    <div className="sp2-result" role="status">
      <div className="sp2-score"><strong>{fmt(attempt.score)}</strong><span>de {fmt(attempt.maxScore)} pontos (estimativa)</span></div>
      <p>{attempt.result.summary}</p>
      <ul>{attempt.result.items.map((i) => (
        <li key={i.item} className={`is-${i.verdict.replace(' ', '-')}`}><strong>Item {i.item}</strong> · {fmt(i.score)}/{fmt(i.max)} · {i.verdict}<p>{i.feedback}</p></li>
      ))}</ul>
    </div>
  )
}

/** Uma questão dissertativa: enunciado fiel, resposta do aluno, correção (Plus) e resposta esperada. */
export default function SecondPhaseQuestionPage() {
  const { id = '' } = useParams()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['second-phase', id], queryFn: async () => (await api.get<Data>(`/second-phase/${id}`)).data })
  const [answer, setAnswer] = useState('')
  const [showExpected, setShowExpected] = useState(false)
  const expected = useQuery({ queryKey: ['second-phase-expected', id], enabled: showExpected,
    queryFn: async () => (await api.get<{ expected: string; expectedImageUrl?: string; criteria: string; source: string }>(`/second-phase/${id}/expected`)).data })
  const send = useMutation({
    mutationFn: async () => (await api.post<{ attempt: Attempt }>(`/second-phase/${id}/answer`, { answer })).data,
    onSuccess: () => { setShowExpected(true); void qc.invalidateQueries({ queryKey: ['second-phase'] }) },
  })
  const err = send.isError && axios.isAxiosError(send.error) ? (send.error.response?.data as { code?: string; error?: string } | undefined) : undefined
  const d = q.data
  return (
    <AppLayout>
      <div className="k-page is-narrow">
        <Link to="/segunda-fase" className="sp2-back"><i className="bi bi-arrow-left" aria-hidden="true" /> Questões dissertativas</Link>
        {q.isLoading && <div className="k-state">Carregando…</div>}
        {q.isError && <div className="k-state" role="alert">Questão não encontrada.</div>}
        {d && <>
          <p className="k-eyebrow">{d.question.exam} {d.question.year} · 2ª fase · {d.question.subject} · questão {String(d.question.number).padStart(2, '0')}</p>
          <h1 className="sim-title">{d.question.title}</h1>
          <QuestionMedia imageUrl={d.question.imageUrl} imageAlt={d.question.imageAlt} />
          <label className="sp2-answer">Sua resposta (responda cada item: a, b, c…)
            <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={9} maxLength={6000} placeholder={'a. …\nb. …\nc. …'} />
          </label>
          <div className="sp2-actions">
            <button type="button" className="k-btn k-btn-primary" disabled={send.isPending || answer.trim().length < 10} onClick={() => send.mutate()}>
              <i className="bi bi-clipboard2-check" aria-hidden="true" />{send.isPending ? 'Corrigindo…' : 'Corrigir minha resposta (Plus)'}</button>
            <button type="button" className="k-btn k-btn-outline" onClick={() => setShowExpected((v) => !v)}>{showExpected ? 'Esconder' : 'Ver'} resposta esperada</button>
          </div>
          {err?.code === 'PLUS_REQUIRED' && <div className="k-card is-sm sp2-upsell"><p>A correção item a item, pelo critério da banca, é do Kuaa Plus. A resposta esperada oficial continua aberta para todos.</p><Link to="/planos" className="k-btn k-btn-primary is-sm">Conhecer o Plus</Link></div>}
          {err && err.code !== 'PLUS_REQUIRED' && <p className="k-alert" role="alert">{err.error ?? 'Não foi possível corrigir agora.'}</p>}
          {send.data && <Result attempt={send.data.attempt} />}
          {showExpected && expected.data && <section className="k-card is-md sp2-expected" aria-label="Resposta esperada">
            <h2 className="k-h3">Resposta esperada</h2>
            {expected.data.expectedImageUrl
              ? <QuestionMedia imageUrl={expected.data.expectedImageUrl} imageAlt={`Resposta esperada: ${expected.data.expected.slice(0, 1500)}`} />
              : <p className="sp2-pre">{expected.data.expected}</p>}
            {expected.data.criteria && <><h3>Considerações da banca</h3><p className="sp2-pre">{expected.data.criteria}</p></>}
            <small className="k-muted">Fonte: {expected.data.source}.</small>
          </section>}
          {d.attempts.length > 0 && !send.data && <section className="sp2-history" aria-labelledby="sp2-hist"><h2 id="sp2-hist" className="k-h3">Suas tentativas</h2>
            {d.attempts.map((a) => <details key={a.id}><summary>{new Date(a.createdAt).toLocaleDateString('pt-BR')} · {fmt(a.score)}/{fmt(a.maxScore)}</summary><p className="sp2-pre">{a.answer}</p><Result attempt={a} /></details>)}
          </section>}
        </>}
      </div>
    </AppLayout>
  )
}
