import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import ExamOption from '../../components/onboarding/ExamOption'
import { useAuthStore } from '../../stores/auth.store'
import { useEnroll, useMyEnrollments } from '../../hooks/useEnrollments'
import { useVestibulares } from '../../hooks/useVestibulares'
import { api } from '../../services/api'
import type { User, UserPreferences } from '../../types/user'
import './SettingsPage.css'

function goalHint(minutes: number) {
  if (minutes <= 15) return 'Leve — ótimo pra criar o hábito.'
  if (minutes <= 30) return 'Recomendado: ~1 tópico por dia.'
  if (minutes <= 60) return 'Puxado — a trilha anda rápido.'
  return 'Intenso — ideal pra reta final.'
}

export default function SettingsPage() {
  const { user, updateUser, loadEnrollments, firstVestibularSlug, logout } = useAuthStore()
  const navigate = useNavigate()
  const memberships = useMyEnrollments()
  const catalog = useVestibulares()
  const enroll = useEnroll()
  const [newId, setNewId] = useState('')
  const [minutes, setMinutes] = useState(user?.preferences?.dailyStudyMinutes ?? 30)
  const [message, setMessage] = useState('')
  const [enrollmentError, setEnrollmentError] = useState('')
  useEffect(() => { setMinutes(user?.preferences?.dailyStudyMinutes ?? 30) }, [user?.preferences?.dailyStudyMinutes])

  const save = useMutation({
    mutationFn: async (input: { activeVestibularId?: string; preferences?: Partial<UserPreferences> }) => {
      const { data } = await api.patch<User>('/users/me', input)
      return data
    },
    onMutate: () => setMessage(''),
    onSuccess: (data) => { updateUser(data); setMessage('Preferência salva.') },
  })
  const busy = save.isPending || enroll.isPending
  const enrolledIds = new Set(memberships.data?.map((item) => item.enrollment.vestibularId))
  const available = catalog.data?.filter((item) => !enrolledIds.has(item.id)) ?? []
  const activeId = memberships.data?.find((item) => item.vestibular.slug === firstVestibularSlug)?.enrollment.vestibularId ?? ''
  const prefs = user?.preferences

  async function addEnrollment() {
    setEnrollmentError('')
    setMessage('')
    try {
      await enroll.mutateAsync(newId)
      setNewId('')
      await loadEnrollments()
      setMessage('Matrícula adicionada.')
    } catch {
      setEnrollmentError('Não foi possível atualizar as matrículas. Recarregue a lista antes de tentar novamente.')
      void memberships.refetch()
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const toggles: { key: 'reducedMotion' | 'highContrast'; label: string; desc: string }[] = [
    { key: 'reducedMotion', label: 'Reduzir movimento', desc: 'Desliga confetes, contagens e animações de pulso' },
    { key: 'highContrast', label: 'Alto contraste', desc: 'Fundo escuro com bordas e textos mais fortes' },
  ]

  return (
    <AppLayout>
      <div className="k-page is-slim">
        <header><h1 className="k-h1" style={{ marginTop: 0 }}>Configurações</h1><p className="k-lead" style={{ marginTop: 8 }}>Organize seus estudos do seu jeito.</p></header>

        <section className="k-card is-md st-section">
          <h2 className="st-h2">Vestibular ativo</h2>
          {memberships.isLoading && <p role="status" className="k-muted">Carregando matrículas...</p>}
          {memberships.isError && <p role="alert" className="k-alert">Não foi possível carregar matrículas. <button className="k-link-btn" onClick={() => void memberships.refetch()}>Tentar novamente</button></p>}
          {memberships.data?.map((item) => (
            <ExamOption key={item.enrollment.id} compact vestibular={item.vestibular} selected={item.enrollment.vestibularId === activeId} disabled={busy}
              onClick={() => { if (item.enrollment.vestibularId !== activeId) save.mutate({ activeVestibularId: item.enrollment.vestibularId }) }} />
          ))}
          <div className="st-add">
            <label className="k-field" style={{ flex: '1 1 200px' }}>
              <span>Adicionar vestibular</span>
              <select className="k-input" value={newId} onChange={(event) => setNewId(event.target.value)} disabled={busy || catalog.isLoading || memberships.isLoading || memberships.isError || catalog.isError}>
                <option value="">{catalog.isLoading ? 'Carregando opções...' : available.length ? 'Selecione um vestibular' : 'Nenhum vestibular disponível'}</option>
                {available.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <button type="button" className="k-btn k-btn-primary" disabled={!newId || busy || memberships.isError || catalog.isError} onClick={() => void addEnrollment()}>
              <i className="bi bi-plus-lg" aria-hidden="true" />{enroll.isPending ? 'Matriculando...' : 'Adicionar'}
            </button>
          </div>
          {catalog.isError && <p role="alert" className="k-alert">Não foi possível carregar vestibulares. <button className="k-link-btn" onClick={() => void catalog.refetch()}>Tentar novamente</button></p>}
          {enrollmentError && <p role="alert" className="k-alert">{enrollmentError}</p>}
        </section>

        <section className="k-card is-md st-section">
          <div className="st-row"><h2 className="st-h2">Meta diária</h2><span className="k-num st-goal">{minutes} min</span></div>
          <input type="range" min={5} max={240} step={5} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} aria-label="Minutos por dia" className="st-range" />
          <div className="st-row">
            <span className="k-muted" style={{ fontSize: 14 }}>{goalHint(minutes)}</span>
            <button type="button" className="k-btn k-btn-primary is-sm" disabled={busy || minutes === (prefs?.dailyStudyMinutes ?? 30)} onClick={() => save.mutate({ preferences: { dailyStudyMinutes: minutes } })}><i className="bi bi-check-lg" aria-hidden="true" />Salvar meta</button>
          </div>
        </section>

        <section className="k-card is-md st-row st-section-row">
          <div><h2 className="st-h2">Língua estrangeira no ENEM</h2><div className="k-muted" style={{ fontSize: 13, marginTop: 4 }}>Usada nos simulados e na trilha de Linguagens</div></div>
          <div className="k-seg is-soft" role="group" aria-label="Língua estrangeira">
            {([['ingles', 'Inglês'], ['espanhol', 'Espanhol']] as const).map(([id, label]) => (
              <button key={id} type="button" disabled={busy} aria-pressed={(prefs?.enemLanguage ?? 'ingles') === id} onClick={() => save.mutate({ preferences: { enemLanguage: id } })}>{label}</button>
            ))}
          </div>
        </section>

        <section className="k-card is-md" style={{ paddingBottom: 8 }}>
          <h2 className="st-h2" style={{ marginBottom: 6 }}>Aparência e acessibilidade</h2>
          {toggles.map((toggle) => {
            const on = prefs?.[toggle.key] ?? false
            return (
              <button key={toggle.key} type="button" role="switch" aria-checked={on} disabled={busy} className="st-toggle" onClick={() => save.mutate({ preferences: { [toggle.key]: !on } })}>
                <span className="st-toggle-text"><strong>{toggle.label}</strong><small>{toggle.desc}</small></span>
                <span className="k-switch" aria-hidden="true" />
              </button>
            )
          })}
        </section>

        <p role="status" className="st-status">{save.isPending ? 'Salvando...' : message}</p>
        {save.isError && <p role="alert" className="k-alert">Não foi possível salvar. Suas configurações anteriores foram mantidas. Tente novamente.</p>}

        <section className="k-card is-md st-row st-section-row">
          <div><h2 className="st-h2">Sua experiência</h2><div className="k-muted" style={{ fontSize: 13, marginTop: 4 }}>Questionário rápido de usabilidade (TCC)</div></div>
          <Link to="/avaliacao" className="k-btn k-btn-outline is-sm"><i className="bi bi-chat-square-text" aria-hidden="true" />Avaliar a plataforma</Link>
        </section>

        <section className="k-card is-md st-section" style={{ borderColor: '#F1D5DF' }}>
          <h2 className="st-h2" style={{ color: 'var(--k-vinho)' }}>Conta</h2>
          <div><button type="button" className="k-btn k-btn-outline" onClick={handleLogout}><i className="bi bi-box-arrow-right" aria-hidden="true" />Sair da conta</button></div>
        </section>
      </div>
    </AppLayout>
  )
}
