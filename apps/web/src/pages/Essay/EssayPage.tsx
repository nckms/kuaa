import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth.store'
import './EssayPage.css'

type ReviewKey = 'respondsToPrompt' | 'argumentSupported' | 'coherenceReviewed' | 'finalReview'
type Review = Record<ReviewKey, boolean>
type Theme = { id: string; title: string; textType: string; prompt: string; planningQuestions: string[] }
type EssaySummary = { id: string; themeTitle: string; textType: string; status: 'DRAFT' | 'SUBMITTED'; updatedAt: string; submittedAt: string | null; wordCount: number }
type EssayFeedback = {
  overview: string
  strengths: string[]
  criteria: Array<{ name: string; observation: string; nextStep: string }>
  revisionPlan: string[]
}
type Essay = EssaySummary & { body: string; prompt: string; selfReview: Partial<Review>; themeId: string; feedback: EssayFeedback | null; feedbackRequestedAt: string | null }
type DraftContent = { body: string; selfReview: Review }

const blankReview: Review = { respondsToPrompt: false, argumentSupported: false, coherenceReviewed: false, finalReview: false }
const reviewLabels: Record<ReviewKey, string> = {
  respondsToPrompt: 'Respondi à proposta', argumentSupported: 'Sustentei meus argumentos',
  coherenceReviewed: 'Revisei a ligação entre ideias', finalReview: 'Revisei linguagem e estrutura',
}
const reviewKeys = Object.keys(reviewLabels) as ReviewKey[]

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message ?? error.response?.data?.message
    if (typeof message === 'string') return message
  }
  return 'Não foi possível conectar. Tente novamente.'
}

function EssayEditor({ essayId, slug, onLeave }: { essayId: string; slug: string; onLeave: () => void }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id ?? '')
  const storageKey = `kuaa:essay:${userId}:${essayId}`
  const { data: essay, isLoading, isError, refetch } = useQuery({
    queryKey: ['essay', essayId], queryFn: async () => (await api.get<Essay>(`/essays/${essayId}`)).data,
    refetchInterval: (query) => query.state.data?.feedbackRequestedAt && !query.state.data.feedback ? 5000 : false,
  })
  const [content, setContent] = useState<DraftContent | null>(null)
  const contentRef = useRef<DraftContent | null>(null)
  const savedRef = useRef('')
  const queueRef = useRef<Promise<void>>(Promise.resolve())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saveState, setSaveState] = useState<'saved' | 'pending' | 'saving' | 'error'>('saved')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [aiConsent, setAiConsent] = useState(false)
  const feedbackMutation = useMutation({
    mutationFn: async () => (await api.post<Essay>(`/essays/${essayId}/feedback`, { aiConsent: true })).data,
    onSuccess: (updated) => { queryClient.setQueryData(['essay', essayId], updated); setAiConsent(false) },
  })

  useEffect(() => {
    if (!essay || contentRef.current) return
    const server: DraftContent = { body: essay.body, selfReview: { ...blankReview, ...essay.selfReview } }
    let initial = server
    if (essay.status === 'DRAFT') {
      try {
        const local = sessionStorage.getItem(storageKey)
        if (local) {
          const parsed = JSON.parse(local) as Partial<DraftContent>
          if (typeof parsed.body === 'string' && parsed.selfReview) {
            initial = { body: parsed.body, selfReview: { ...blankReview, ...parsed.selfReview } }
          }
        }
      } catch { /* A broken local backup must not hide the server draft. */ }
    }
    savedRef.current = JSON.stringify(server)
    contentRef.current = initial
    setContent(initial)
    if (JSON.stringify(initial) !== savedRef.current) setSaveState('pending')
  }, [essay, storageKey])

  function update(next: DraftContent) {
    contentRef.current = next
    setContent(next)
    sessionStorage.setItem(storageKey, JSON.stringify(next))
    setSaveState('pending')
    setMessage('')
  }

  function flush(): Promise<void> {
    if (timerRef.current) clearTimeout(timerRef.current)
    const snapshot = contentRef.current
    if (!snapshot || !essay || essay.status !== 'DRAFT') return queueRef.current
    const serialized = JSON.stringify(snapshot)
    if (serialized === savedRef.current) return queueRef.current
    setSaveState('saving')
    const save = queueRef.current.catch(() => undefined).then(async () => {
      await api.patch(`/essays/${essayId}`, snapshot)
      savedRef.current = serialized
      if (JSON.stringify(contentRef.current) === serialized) {
        sessionStorage.removeItem(storageKey)
        setSaveState('saved')
      } else {
        setSaveState('pending')
      }
      void queryClient.invalidateQueries({ queryKey: ['essays', slug] })
    }).catch((error: unknown) => { setSaveState('error'); throw error })
    queueRef.current = save
    return save
  }

  useEffect(() => {
    if (!essay || essay.status !== 'DRAFT' || !content) return
    if (JSON.stringify(content) === savedRef.current) return
    timerRef.current = setTimeout(() => { void flush().catch(() => undefined) }, 1000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [content, essay?.id, essay?.status])

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (contentRef.current && JSON.stringify(contentRef.current) !== savedRef.current) event.preventDefault()
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => { window.removeEventListener('beforeunload', beforeUnload); if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  async function leave() {
    setMessage('')
    try { await flush(); onLeave() } catch { setMessage('Não foi possível salvar. Seu texto continua neste dispositivo; tente novamente antes de sair.') }
  }

  async function leaveForTrail() {
    setMessage('')
    try { await flush(); navigate(`/trilha/${slug}`) }
    catch { setMessage('Não foi possível salvar. Seu texto continua neste dispositivo; tente novamente antes de sair.') }
  }

  async function submit() {
    if (!contentRef.current) return
    setMessage('')
    setSubmitting(true)
    try {
      await flush()
      await api.post(`/essays/${essayId}/submit`)
      sessionStorage.removeItem(storageKey)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['essay', essayId] }),
        queryClient.invalidateQueries({ queryKey: ['essays', slug] }),
      ])
    } catch (error) { setMessage(errorMessage(error)) }
    finally { setSubmitting(false) }
  }

  if (isLoading) return <p className="essay-message">Carregando redação...</p>
  if (isError || !essay) return <div className="essay-message" role="alert">Não foi possível abrir esta redação. <button onClick={() => void refetch()}>Tentar novamente</button></div>
  if (!content) return <p className="essay-message">Carregando texto...</p>
  const submitted = essay.status === 'SUBMITTED'
  const words = content.body.trim() ? content.body.trim().split(/\s+/).length : 0
  const canSubmit = words >= 30 && content.body.trim().length >= 200

  return <div className="essay-editor">
    <button className="essay-back" type="button" onClick={() => void leave()}><i className="bi bi-arrow-left" aria-hidden="true" /> Propostas e histórico</button>
    <header className="essay-heading"><div><span className="essay-eyebrow">{essay.textType}</span><h1>{essay.themeTitle}</h1></div>
      <span className="essay-status" role="status">{submitted ? 'Enviada' : saveState === 'saved' ? 'Salvo' : saveState === 'pending' ? 'Alterações pendentes' : saveState === 'saving' ? 'Salvando...' : 'Falha ao salvar'}</span></header>
    <section className="essay-prompt" aria-labelledby="essay-prompt-title"><h2 id="essay-prompt-title">Proposta</h2><p>{essay.prompt}</p></section>
    <div className="essay-workspace">
      <div className="essay-writing"><div className="essay-field-heading"><label htmlFor="essay-body">Seu texto</label><span>{words} palavras</span></div>
        <textarea id="essay-body" value={content.body} maxLength={30000} readOnly={submitted} onChange={(event) => update({ ...content, body: event.target.value })}
          onBlur={() => { void flush().catch(() => undefined) }} placeholder="Comece a escrever sua redação..." aria-describedby="essay-save-note" />
        <p id="essay-save-note" className="essay-note">{submitted ? 'Texto enviado. Não é possível editar esta versão.' : 'O rascunho é salvo automaticamente.'}</p></div>
      <section className="essay-review" aria-labelledby="essay-review-title"><h2 id="essay-review-title">Autoavaliação</h2>
        <div className="essay-checks">{reviewKeys.map((key) => <label key={key}><input type="checkbox" checked={content.selfReview[key]} disabled={submitted}
          onChange={(event) => update({ ...content, selfReview: { ...content.selfReview, [key]: event.target.checked } })} /><span>{reviewLabels[key]}</span></label>)}</div>
        <p className="essay-note">Este checklist é seu. Ele não atribui nota.</p></section>
    </div>
    {message && <p className="essay-error" role="alert">{message}</p>}
    {!submitted && <footer className="essay-actions"><button type="button" className="essay-secondary" onClick={() => void flush().catch(() => setMessage('Não foi possível salvar. Tente novamente.'))}>Salvar agora</button>
      <button type="button" className="essay-primary" disabled={!canSubmit || submitting || saveState === 'error'} onClick={() => void submit()}>{submitting ? 'Enviando...' : 'Enviar redação'}</button>
      {!canSubmit && <span className="essay-note">Para enviar: mínimo de 30 palavras e 200 caracteres.</span>}</footer>}
    {submitted && <>
      <p className="essay-submitted">Enviada em {essay.submittedAt ? new Date(essay.submittedAt).toLocaleDateString('pt-BR') : 'data não informada'}. Esta versão permanece disponível no seu histórico.</p>
      <section className="essay-feedback" aria-labelledby="essay-feedback-title">
        <h2 id="essay-feedback-title">Análise formativa</h2>
        <p className="essay-feedback-disclaimer">A análise por IA é opcional, pode conter erros e não é uma correção oficial do vestibular. Não atribui nota.</p>
        {essay.feedback ? <div className="essay-feedback-content">
          <div className="essay-feedback-block"><h3>Visão geral</h3><p>{essay.feedback.overview}</p></div>
          <div className="essay-feedback-block"><h3>Pontos fortes</h3><ul>{essay.feedback.strengths.map((strength, index) => <li key={index}>{strength}</li>)}</ul></div>
          <div className="essay-feedback-block"><h3>Critérios de escrita</h3><div className="essay-feedback-criteria">{essay.feedback.criteria.map((criterion) => <article key={criterion.name}>
            <h4>{criterion.name}</h4><p>{criterion.observation}</p><p><strong>Próximo passo:</strong> {criterion.nextStep}</p>
          </article>)}</div></div>
          <div className="essay-feedback-block"><h3>Plano de revisão</h3><ol>{essay.feedback.revisionPlan.map((step, index) => <li key={index}>{step}</li>)}</ol></div>
        </div> : <>
          {essay.feedbackRequestedAt && <p className="essay-feedback-pending" role="status">Análise em andamento. Esta página verificará o resultado automaticamente.</p>}
          {!essay.feedbackRequestedAt && <>
            <label className="essay-consent"><input type="checkbox" checked={aiConsent} onChange={(event) => setAiConsent(event.target.checked)} />
              <span>Autorizo o envio deste texto para análise por IA. Entendo que o retorno é apenas formativo e não oficial.</span></label>
            <button type="button" className="essay-primary" disabled={!aiConsent || feedbackMutation.isPending} onClick={() => feedbackMutation.mutate()}>
              {feedbackMutation.isPending ? 'Analisando texto...' : 'Solicitar análise por IA'}</button>
          </>}
          {feedbackMutation.isError && <div className="essay-feedback-alert" role="alert">
            {axios.isAxiosError(feedbackMutation.error) && feedbackMutation.error.response?.status === 503
              ? 'A análise por IA está indisponível no momento. Seu texto permanece salvo; tente novamente mais tarde.'
              : axios.isAxiosError(feedbackMutation.error) && feedbackMutation.error.response?.status === 409
                ? 'A análise já está em andamento. Aguarde e atualize o resultado.'
                : errorMessage(feedbackMutation.error)}
            <button type="button" onClick={() => { feedbackMutation.reset(); void refetch() }}>Atualizar resultado</button>
          </div>}
        </>}
      </section>
    </>}
    <button className="essay-back" type="button" onClick={() => void leaveForTrail()}>Voltar à trilha</button>
  </div>
}

export default function EssayPage() {
  const { vestibularSlug = '', essayId } = useParams<{ vestibularSlug: string; essayId?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const themes = useQuery({ queryKey: ['essay-themes', vestibularSlug], enabled: Boolean(vestibularSlug),
    queryFn: async () => (await api.get<{ vestibular: { name: string }; themes: Theme[] }>(`/essays/themes/${vestibularSlug}`)).data })
  const history = useQuery({ queryKey: ['essays', vestibularSlug], enabled: Boolean(vestibularSlug),
    queryFn: async () => (await api.get<EssaySummary[]>('/essays', { params: { vestibularSlug } })).data })
  const create = useMutation({ mutationFn: async (themeId: string) => (await api.post<Essay>('/essays', { vestibularSlug, themeId })).data,
    onSuccess: (essay) => { void queryClient.invalidateQueries({ queryKey: ['essays', vestibularSlug] }); navigate(`/redacao/${vestibularSlug}/${essay.id}`) } })

  return <AppLayout><main className="essay-page"><div className="essay-inner">
    {essayId ? <EssayEditor key={essayId} essayId={essayId} slug={vestibularSlug} onLeave={() => navigate(`/redacao/${vestibularSlug}`)} /> : <>
      <button className="essay-back" type="button" onClick={() => navigate(`/trilha/${vestibularSlug}`)}><i className="bi bi-arrow-left" aria-hidden="true" /> Voltar à trilha</button>
      <header className="essay-heading"><div><span className="essay-eyebrow">Prática de escrita</span><h1>Redação {themes.data?.vestibular.name ?? ''}</h1></div></header>
      {themes.isLoading && <p className="essay-message">Carregando propostas...</p>}
      {themes.isError && <p className="essay-error" role="alert">{errorMessage(themes.error)} <button onClick={() => void themes.refetch()}>Tentar novamente</button></p>}
      {themes.data && <section className="essay-section" aria-labelledby="essay-themes-title"><h2 id="essay-themes-title">Propostas</h2>
        <div className="essay-list">{themes.data.themes.map((theme) => <article key={theme.id} className="essay-item">
          <div><span className="essay-eyebrow">{theme.textType}</span><h3>{theme.title}</h3><p>{theme.prompt}</p>
            <details><summary>Planejar o texto</summary><ul>{theme.planningQuestions.map((question) => <li key={question}>{question}</li>)}</ul></details></div>
          <button className="essay-primary" disabled={create.isPending} onClick={() => create.mutate(theme.id)}>Iniciar rascunho</button>
        </article>)}</div>{create.isError && <p className="essay-error" role="alert">{errorMessage(create.error)}</p>}</section>}
      <section className="essay-section" aria-labelledby="essay-history-title"><h2 id="essay-history-title">Seus textos</h2>
        {history.isLoading && <p>Carregando histórico...</p>}
        {history.isError && <p className="essay-error" role="alert">{errorMessage(history.error)} <button onClick={() => void history.refetch()}>Tentar novamente</button></p>}
        {history.data?.length === 0 && <p>Você ainda não iniciou uma redação.</p>}
        <div className="essay-list">{history.data?.map((item) => <button className="essay-history-item" key={item.id} onClick={() => navigate(`/redacao/${vestibularSlug}/${item.id}`)}>
          <span><strong>{item.themeTitle}</strong><small>{item.textType} · {item.wordCount} palavras · Atualizada em {new Date(item.updatedAt).toLocaleDateString('pt-BR')}</small></span>
          <span className="essay-history-end">{item.status === 'SUBMITTED' ? 'Enviada' : 'Rascunho'} <i className="bi bi-chevron-right" aria-hidden="true" /></span></button>)}</div>
      </section>
    </>}
  </div></main></AppLayout>
}
