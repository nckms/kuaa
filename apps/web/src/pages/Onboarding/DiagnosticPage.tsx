import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth.store'
import QuestionMedia from '../../components/quiz/QuestionMedia'
import KuaaMascotLogo from '../../components/ui/KuaaMascotLogo'
import type { QuestionMediaData } from '../../types/quiz'
import './DiagnosticPage.css'

interface DiagnosticProfile {
  schoolStage: 'fundamental' | 'medio' | 'concluido'
  examHorizon: 'este-ano' | 'proximo-ano' | 'explorando'
  weeklyMinutes: 60 | 180 | 300 | 600
  difficultSubjects: string[]
}

interface DiagnosticState {
  status: 'profile' | 'questions' | 'completed'
  profile: DiagnosticProfile | null
  subjects: { id: string; name: string }[]
  total: 12
  answered: number
  question: (QuestionMediaData & {
    id: string; body: string; options: { id: string; text: string }[]; subjectName: string
  }) | null
  result: {
    areas: { key: string; name: string; answered: number; correct: number; skipped: number; targetDifficulty: number; confidence: 'initial' }[]
    recommendedMinutes: number
    finishedAt: string
  } | null
}

type Choice<T> = { value: T; label: string; desc: string; icon: string }

const STAGES: Choice<DiagnosticProfile['schoolStage']>[] = [
  { value: 'fundamental', label: 'Ensino fundamental', desc: 'Começando cedo', icon: 'bi-flower1' },
  { value: 'medio', label: 'Ensino médio', desc: 'Cursando agora', icon: 'bi-backpack' },
  { value: 'concluido', label: 'Médio concluído', desc: 'Cursinho ou por conta', icon: 'bi-mortarboard' },
]
const HORIZONS: Choice<DiagnosticProfile['examHorizon']>[] = [
  { value: 'este-ano', label: 'Este ano', desc: 'Reta final', icon: 'bi-calendar2-check' },
  { value: 'proximo-ano', label: 'Ano que vem', desc: 'Tempo pra construir base', icon: 'bi-calendar3' },
  { value: 'explorando', label: 'Ainda explorando', desc: 'Sem pressa por enquanto', icon: 'bi-compass' },
]
const MINUTES: Choice<DiagnosticProfile['weeklyMinutes']>[] = [
  { value: 60, label: '60 min/semana', desc: '~12 min por dia', icon: 'bi-cup-hot' },
  { value: 180, label: '3 h/semana', desc: '~36 min por dia', icon: 'bi-clock' },
  { value: 300, label: '5 h/semana', desc: '1 hora por dia', icon: 'bi-lightning-charge' },
  { value: 600, label: '10 h/semana', desc: '2 horas por dia · intenso', icon: 'bi-fire' },
]

function ChoiceCards<T extends string | number>({ options, value, disabled, onPick }: { options: Choice<T>[]; value: T | ''; disabled: boolean; onPick: (value: T) => void }) {
  return <div className="diag-choices">
    {options.map((option) => (
      <button key={String(option.value)} type="button" className="diag-choice" aria-pressed={value === option.value} disabled={disabled} onClick={() => onPick(option.value)}>
        <span className="diag-choice-icon"><i className={`bi ${option.icon}`} aria-hidden="true" /></span>
        <span className="diag-choice-text"><strong>{option.label}</strong><small>{option.desc}</small></span>
      </button>
    ))}
  </div>
}

function ProfileForm({ profile, subjects, busy, onSave }: {
  profile: DiagnosticProfile | null
  subjects: DiagnosticState['subjects']
  busy: boolean
  onSave: (profile: DiagnosticProfile) => void
}) {
  const [step, setStep] = useState(0)
  const [stage, setStage] = useState<DiagnosticProfile['schoolStage'] | ''>(profile?.schoolStage ?? '')
  const [horizon, setHorizon] = useState<DiagnosticProfile['examHorizon'] | ''>(profile?.examHorizon ?? '')
  const [minutes, setMinutes] = useState<DiagnosticProfile['weeklyMinutes'] | ''>(profile?.weeklyMinutes ?? '')
  const [difficult, setDifficult] = useState(profile?.difficultSubjects ?? [])
  const advance = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (advance.current) clearTimeout(advance.current) }, [])

  function pick(set: () => void) {
    set()
    if (advance.current) clearTimeout(advance.current)
    advance.current = setTimeout(() => setStep((current) => current + 1), 320)
  }

  const screens = [
    { title: 'Em que fase você está?', desc: 'Isso ajuda a calibrar o ponto de partida.', body: <ChoiceCards options={STAGES} value={stage} disabled={busy} onPick={(value) => pick(() => setStage(value))} /> },
    { title: 'Quando é a sua prova?', desc: 'Isso define o ritmo da sua trilha.', body: <ChoiceCards options={HORIZONS} value={horizon} disabled={busy} onPick={(value) => pick(() => setHorizon(value))} /> },
    { title: 'Quanto tempo por semana?', desc: 'A gente ajusta a trilha ao seu ritmo.', body: <ChoiceCards options={MINUTES} value={minutes} disabled={busy} onPick={(value) => pick(() => setMinutes(value))} /> },
    { title: 'Quais matérias pesam mais?', desc: 'Opcional — a gente começa reforçando elas.', body: <div className="diag-chips">{subjects.map((subject) => {
      const on = difficult.includes(subject.id)
      return <button key={subject.id} type="button" aria-pressed={on} disabled={busy} onClick={() => setDifficult((current) => on ? current.filter((id) => id !== subject.id) : [...current, subject.id])}>{on && <i className="bi bi-check-lg" aria-hidden="true" />}{subject.name}</button>
    })}</div> },
  ]
  const current = Math.min(step, screens.length - 1)
  const screen = screens[current]!
  const ready = !!stage && !!horizon && !!minutes

  return <div key={current} className="diag-screen">
    <p className="k-eyebrow">Pergunta {current + 1} de {screens.length}</p>
    <h1 className="diag-title" tabIndex={-1}>{screen.title}</h1>
    <p className="diag-desc">{screen.desc}</p>
    {screen.body}
    <div className="diag-nav">
      {current > 0 && <button type="button" className="k-btn k-btn-outline" disabled={busy} onClick={() => setStep(current - 1)}><i className="bi bi-arrow-left" aria-hidden="true" />Voltar</button>}
      {current === screens.length - 1
        ? <button type="button" className="k-btn k-btn-primary is-lg" style={{ marginLeft: 'auto' }} disabled={busy || !ready}
          onClick={() => { if (stage && horizon && minutes) onSave({ schoolStage: stage, examHorizon: horizon, weeklyMinutes: minutes, difficultSubjects: difficult }) }}>
          {busy ? 'Salvando...' : 'Iniciar questões'} <i className="bi bi-arrow-right" aria-hidden="true" />
        </button>
        : [stage, horizon, minutes][current] && <button type="button" className="k-btn k-btn-outline" style={{ marginLeft: 'auto' }} onClick={() => setStep(current + 1)}>Próxima<i className="bi bi-arrow-right" aria-hidden="true" /></button>}
    </div>
  </div>
}

function QuestionForm({ question, counter, busy, onAnswer }: {
  question: NonNullable<DiagnosticState['question']>; counter: string; busy: boolean; onAnswer: (option: string | null) => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  return <form className="diag-screen" onSubmit={(event) => { event.preventDefault(); if (selected !== null) onAnswer(selected) }}>
    <div className="diag-q-head"><p className="k-eyebrow">{counter}</p><span className="k-tag" style={{ background: 'var(--k-roxo-soft)', color: 'var(--k-roxo)' }}>{question.subjectName}</span></div>
    <p className="diag-q-body">{question.body}</p>
    <QuestionMedia {...question} />
    <fieldset disabled={busy} className="diag-options">
      <legend className="visually-hidden">Qual alternativa você escolhe?</legend>
      {question.options.map((option) => (
        <button key={option.id} type="button" className="k-option" aria-pressed={selected === option.id} onClick={() => setSelected(option.id)}>
          <span className="k-letter">{option.id}</span><span style={{ flex: 1 }}>{option.text}</span>
        </button>
      ))}
    </fieldset>
    <div className="diag-nav">
      <button type="button" className="k-link-btn" style={{ color: 'var(--k-muted-2)', fontWeight: 500 }} disabled={busy} onClick={() => onAnswer(null)}><i className="bi bi-question-circle" aria-hidden="true" />Não sei essa</button>
      <button type="submit" className="k-btn k-btn-primary" style={{ marginLeft: 'auto' }} disabled={busy || selected === null}>Confirmar <i className="bi bi-arrow-right" aria-hidden="true" /></button>
    </div>
  </form>
}

function Diagnostic({ slug }: { slug: string }) {
  const userId = useAuthStore((state) => state.user?.id)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const queryKey = ['diagnostic', userId, slug]
  const endpoint = `/diagnostic/${encodeURIComponent(slug)}`
  const query = useQuery({
    queryKey, queryFn: async ({ signal }) => (await api.get<DiagnosticState>(endpoint, { signal })).data,
    staleTime: 0, gcTime: 0, refetchOnWindowFocus: false, refetchOnReconnect: false, retry: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsSync, setNeedsSync] = useState(false)
  const lock = useRef(false)
  const data = query.data
  const busy = saving || query.isFetching || needsSync

  async function save(path: 'profile' | 'answer', payload: DiagnosticProfile | { questionId: string; optionId: string | null }) {
    if (lock.current || busy) return
    lock.current = true
    setSaving(true)
    setError(null)
    try {
      await queryClient.cancelQueries({ queryKey })
      const response = await api.post<DiagnosticState>(`${endpoint}/${path}`, payload)
      queryClient.setQueryData(queryKey, response.data)
    } catch {
      // A lost response may still have been saved by the server. Reconcile before another submission.
      setNeedsSync(true)
      setError('Não foi possível confirmar o envio. Consulte o progresso salvo antes de tentar novamente.')
    } finally {
      lock.current = false
      setSaving(false)
    }
  }

  async function retry() {
    if (lock.current) return
    lock.current = true
    try {
      const result = await query.refetch()
      if (!result.isError) { setNeedsSync(false); setError(null) }
    } finally { lock.current = false }
  }

  async function goToTrail() {
    if (lock.current) return
    lock.current = true
    setSaving(true)
    try {
      await queryClient.invalidateQueries({ queryKey: ['trail', slug] })
      navigate(`/trilha/${slug}`)
    } finally { lock.current = false; setSaving(false) }
  }

  const phase = data?.status === 'completed' ? 2 : data?.status === 'questions' ? 1 : 0
  const enrollmentRequired = isAxiosError(query.error) && [403, 404].includes(query.error.response?.status ?? 0)
  const totalCorrect = data?.result?.areas.reduce((sum, area) => sum + area.correct, 0) ?? 0
  const totalAnswered = data?.result?.areas.reduce((sum, area) => sum + area.answered, 0) ?? 0
  const weakest = data?.result ? [...data.result.areas].filter((area) => area.answered > 0).sort((a, b) => a.correct / a.answered - b.correct / b.answered)[0] : undefined

  return <main className="diag-page">
    <header className="diag-top">
      <img src="/brand/wordmark-t.png" alt="Kuaa" />
      <ol className="diag-steps" aria-label="Etapas do diagnóstico">
        {['Perfil', 'Questões', 'Resultado'].map((label, index) => <li key={label} className={index <= phase ? 'is-done' : ''} aria-current={index === phase ? 'step' : undefined}><span />{label}</li>)}
      </ol>
      <Link to={`/trilha/${slug}`} className="diag-skip">Pular</Link>
    </header>
    <div className="diag-body">
      <div className="diag-inner" aria-busy={saving || query.isFetching}>
        <p role="status" className="visually-hidden">{saving ? 'Salvando...' : query.isFetching ? 'Consultando progresso salvo...' : data ? `${data.answered} de ${data.total} respostas salvas` : ''}</p>
        {query.isPending && <div className="k-state">Carregando diagnóstico...</div>}
        {(error || query.isError) && <div className="k-alert diag-error" role="alert">
          <p style={{ margin: 0 }}>{error ?? (enrollmentRequired ? 'Diagnóstico indisponível. Confira se você está matriculado neste vestibular.' : 'Não foi possível carregar o diagnóstico.')}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            <button type="button" className="k-btn k-btn-outline is-sm" disabled={saving || query.isFetching} onClick={() => void retry()}>{needsSync ? 'Consultar progresso salvo' : 'Tentar novamente'}</button>
            {enrollmentRequired && <Link to="/onboarding" className="k-btn k-btn-primary is-sm">Escolher vestibular</Link>}
          </div>
        </div>}
        {data?.status === 'profile' && <ProfileForm profile={data.profile} subjects={data.subjects} busy={busy} onSave={(profile) => void save('profile', profile)} />}
        {data?.status === 'questions' && data.question && <>
          <div className="k-track diag-progress" aria-hidden="true"><span style={{ width: `${(data.answered / data.total) * 100}%` }} /></div>
          <QuestionForm key={data.question.id} question={data.question} counter={`Questão ${data.answered + 1} de ${data.total}`} busy={busy} onAnswer={(optionId) => void save('answer', { questionId: data.question!.id, optionId })} />
        </>}
        {data?.status === 'completed' && data.result && <section className="diag-result" aria-label="Resultado inicial">
          <div className="diag-result-head">
            <KuaaMascotLogo size={80} radius={22} />
            <div><p className="k-eyebrow">Seu ponto de partida</p><h1 className="diag-title" style={{ marginTop: 6 }}>{totalAnswered && totalCorrect / totalAnswered >= 0.6 ? 'Base sólida' : 'Construindo base'}</h1></div>
          </div>
          <p className="diag-desc" style={{ margin: 0 }}>
            Você acertou {totalCorrect} de {totalAnswered}.{weakest ? ` Sua trilha começa reforçando ${weakest.name} e intercala revisões nas áreas onde você já vai bem.` : ''} A redação não foi avaliada aqui.
          </p>
          <div className="k-card is-md diag-areas">
            {data.result.areas.map((area) => {
              const pct = area.answered ? Math.round((area.correct / area.answered) * 100) : 0
              const color = pct >= 60 ? '#28765B' : pct >= 45 ? '#D99A1E' : '#840033'
              return <div key={area.key}>
                <div className="diag-area-head"><span>{area.name}</span><span className="k-mono">{area.correct}/{area.answered}{area.skipped ? ` · ${area.skipped} não sei` : ''}</span></div>
                <div className="k-track is-md"><span style={{ width: `${Math.max(pct, 3)}%`, background: color }} /></div>
              </div>
            })}
          </div>
          <div className="diag-goal">
            <div><small>Ritmo recomendado</small><strong>{data.result.recommendedMinutes} min/dia</strong><small>em 5 dias da semana ({data.profile?.weeklyMinutes} min semanais)</small></div>
            <i className="bi bi-speedometer2" aria-hidden="true" />
          </div>
          <button className="k-btn k-btn-primary is-lg is-block" disabled={busy} onClick={() => void goToTrail()}>Ver minha trilha <i className="bi bi-arrow-right" aria-hidden="true" /></button>
        </section>}
        {data && ((data.status === 'questions' && !data.question) || (data.status === 'completed' && !data.result)) && <div className="k-alert" role="alert">
          <p style={{ margin: '0 0 10px' }}>O diagnóstico está indisponível no momento.</p><button className="k-btn k-btn-outline is-sm" disabled={busy} onClick={() => void retry()}>Tentar novamente</button>
        </div>}
      </div>
    </div>
  </main>
}

export default function DiagnosticPage() {
  const { vestibularSlug = '' } = useParams<{ vestibularSlug: string }>()
  return <Diagnostic key={vestibularSlug} slug={vestibularSlug} />
}
