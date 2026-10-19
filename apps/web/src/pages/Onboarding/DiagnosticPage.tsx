import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth.store'
import QuestionMedia from '../../components/quiz/QuestionMedia'
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

function ProfileForm({ profile, subjects, busy, onSave }: {
  profile: DiagnosticProfile | null
  subjects: DiagnosticState['subjects']
  busy: boolean
  onSave: (profile: DiagnosticProfile) => void
}) {
  const [stage, setStage] = useState(profile?.schoolStage ?? '')
  const [horizon, setHorizon] = useState(profile?.examHorizon ?? '')
  const [minutes, setMinutes] = useState<number | ''>(profile?.weeklyMinutes ?? '')
  const [difficult, setDifficult] = useState(profile?.difficultSubjects ?? [])
  return <form onSubmit={(event) => {
    event.preventDefault()
    if (stage && horizon && minutes) onSave({ schoolStage: stage as DiagnosticProfile['schoolStage'], examHorizon: horizon as DiagnosticProfile['examHorizon'], weeklyMinutes: minutes as DiagnosticProfile['weeklyMinutes'], difficultSubjects: difficult })
  }}>
    <fieldset disabled={busy}>
      <legend>1. Em qual etapa escolar você está?</legend>
      <select aria-label="Etapa escolar" required value={stage} onChange={(event) => setStage(event.target.value)}>
        <option value="" disabled>Selecione</option>
        <option value="fundamental">Ensino fundamental</option><option value="medio">Ensino médio</option><option value="concluido">Ensino médio concluído</option>
      </select>
    </fieldset>
    <fieldset disabled={busy}>
      <legend>2. Quando pretende prestar o vestibular?</legend>
      <select aria-label="Quando prestar o vestibular" required value={horizon} onChange={(event) => setHorizon(event.target.value)}>
        <option value="" disabled>Selecione</option>
        <option value="este-ano">Este ano</option><option value="proximo-ano">Próximo ano</option><option value="explorando">Ainda estou explorando</option>
      </select>
    </fieldset>
    <fieldset disabled={busy}>
      <legend>3. Quanto tempo pode estudar por semana?</legend>
      <select aria-label="Tempo semanal de estudo" required value={minutes} onChange={(event) => setMinutes(Number(event.target.value))}>
        <option value="" disabled>Selecione</option>
        {[60, 180, 300, 600].map((value) => <option key={value} value={value}>{value} min por semana ({value / 5} min por dia, em 5 dias)</option>)}
      </select>
    </fieldset>
    <fieldset disabled={busy}>
      <legend>4. Quais matérias parecem mais difíceis?</legend>
      <p className="diagnostic-muted">Opcional. Nenhuma selecionada também é uma resposta válida.</p>
      <div className="diagnostic-subjects">{subjects.map((subject) => <label key={subject.id} className="diagnostic-choice">
        <input type="checkbox" checked={difficult.includes(subject.id)} onChange={(event) => setDifficult((current) => event.target.checked ? [...current, subject.id] : current.filter((id) => id !== subject.id))} />
        <span>{subject.name}</span>
      </label>)}</div>
    </fieldset>
    <button className="diagnostic-primary" disabled={busy} type="submit">{busy ? 'Salvando...' : 'Iniciar questões'}</button>
  </form>
}

function QuestionForm({ question, busy, onAnswer }: {
  question: NonNullable<DiagnosticState['question']>; busy: boolean; onAnswer: (option: string | null) => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  return <form onSubmit={(event) => { event.preventDefault(); if (selected !== null) onAnswer(selected) }}>
    <p className="diagnostic-muted">{question.subjectName}</p>
    <p className="diagnostic-body">{question.body}</p>
    <QuestionMedia {...question} />
    <fieldset disabled={busy}>
      <legend>Qual alternativa você escolhe?</legend>
      {question.options.map((option) => <label key={option.id} className="diagnostic-choice diagnostic-option">
        <input type="radio" name="answer" value={option.id} checked={selected === option.id} onChange={() => setSelected(option.id)} />
        <span>{option.text}</span>
      </label>)}
    </fieldset>
    <div className="diagnostic-actions">
      <button type="submit" className="diagnostic-primary" disabled={busy || selected === null}>Confirmar resposta</button>
      <button type="button" disabled={busy} onClick={() => onAnswer(null)}>Não sei</button>
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
  const heading = useRef<HTMLHeadingElement>(null)
  const data = query.data
  const busy = saving || query.isFetching || needsSync
  useEffect(() => { heading.current?.focus() }, [data?.status, data?.question?.id])

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

  const enrollmentRequired = isAxiosError(query.error) && [403, 404].includes(query.error.response?.status ?? 0)
  return <main className="diagnostic-page">
    <header className="diagnostic-header"><Link to={`/trilha/${slug}`}><i className="bi bi-arrow-left" aria-hidden="true" /> Voltar à trilha</Link><span>Kuaa</span></header>
    <div className="diagnostic-content" aria-busy={saving || query.isFetching}>
      <h1 ref={heading} tabIndex={-1}>{data?.status === 'completed' ? 'Seu ponto de partida' : data?.status === 'questions' ? `Questão ${data.answered + 1} de ${data.total}` : 'Diagnóstico inicial'}</h1>
      <p role="status" className="diagnostic-muted">{saving ? 'Salvando...' : query.isFetching ? 'Consultando progresso salvo...' : data ? `${data.answered} de ${data.total} respostas salvas` : ''}</p>
      {data && <progress aria-label="Progresso do diagnóstico" value={data.answered} max={data.total} />}
      {(error || query.isError) && <div className="diagnostic-error" role="alert">
        <p>{error ?? (enrollmentRequired ? 'Diagnóstico indisponível. Confira se você está matriculado neste vestibular.' : 'Não foi possível carregar o diagnóstico.')}</p>
        <button type="button" disabled={saving || query.isFetching} onClick={() => void retry()}>{needsSync ? 'Consultar progresso salvo' : 'Tentar novamente'}</button>
        {enrollmentRequired && <Link to="/onboarding">Escolher vestibular</Link>}
      </div>}
      {data?.status === 'profile' && <ProfileForm profile={data.profile} subjects={data.subjects} busy={busy} onSave={(profile) => void save('profile', profile)} />}
      {data?.status === 'questions' && data.question && <QuestionForm key={data.question.id} question={data.question} busy={busy} onAnswer={(optionId) => void save('answer', { questionId: data.question!.id, optionId })} />}
      {data?.status === 'completed' && data.result && <section aria-label="Resultado inicial">
        <h2>Diagnóstico provisório</h2>
        <p>Este é um retrato inicial, não uma medida de domínio. Sua trilha será ajustada conforme novas respostas. A redação não foi avaliada.</p>
        <p><strong>{data.result.recommendedMinutes} minutos por dia</strong>, em 5 dias da semana ({data.profile?.weeklyMinutes} minutos semanais).</p>
        <div className="diagnostic-areas">{data.result.areas.map((area) => <section key={area.key} className="diagnostic-area">
          <h3>{area.name}</h3>
          <p>{area.correct} acertos · {area.answered} respondidas · {area.skipped} não sei</p>
          <p className="diagnostic-muted">Dificuldade inicial sugerida: {area.targetDifficulty}. Confiança inicial.</p>
        </section>)}</div>
        <button className="diagnostic-primary" disabled={busy} onClick={async () => {
          if (lock.current) return
          lock.current = true
          setSaving(true)
          try {
            await queryClient.invalidateQueries({ queryKey: ['trail', slug] })
            navigate(`/trilha/${slug}`)
          } finally { lock.current = false; setSaving(false) }
        }}>Começar trilha personalizada</button>
      </section>}
      {data && ((data.status === 'questions' && !data.question) || (data.status === 'completed' && !data.result)) && <div role="alert">
        <p>O diagnóstico está indisponível no momento.</p><button disabled={busy} onClick={() => void retry()}>Tentar novamente</button>
      </div>}
    </div>
  </main>
}

export default function DiagnosticPage() {
  const { vestibularSlug = '' } = useParams<{ vestibularSlug: string }>()
  return <Diagnostic key={vestibularSlug} slug={vestibularSlug} />
}
