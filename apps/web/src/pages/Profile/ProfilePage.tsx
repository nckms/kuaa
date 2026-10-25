import { useMemo, useState } from 'react'
import type React from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth.store'
import { useMyEnrollments } from '../../hooks/useEnrollments'
import { useTrail } from '../../hooks/useTrail'
import { levelProgress, topicProgressScore } from '../../utils/kuaaIndex'
import { subjectTheme } from '../../utils/subjectTheme'
import type { User } from '../../types/user'
import './ProfilePage.css'

interface ProfileForm {
  name: string
  school: string
  city: string
  state: string
}

const BR_STATES = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA',
  'MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN',
  'RO','RR','RS','SC','SE','SP','TO',
]

export default function ProfilePage() {
  const { user, updateUser, firstVestibularSlug } = useAuthStore()
  const navigate = useNavigate()
  const { data: enrollments } = useMyEnrollments()
  const { data: trail } = useTrail(firstVestibularSlug ?? '')
  const [tab, setTab] = useState<'geral' | 'dados'>('geral')
  const [isEditing, setIsEditing] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [form, setForm] = useState<ProfileForm>({
    name: user?.name ?? '',
    school: user?.school ?? '',
    city: user?.city ?? '',
    state: user?.state ?? '',
  })

  const updateProfile = useMutation({
    mutationFn: async (payload: ProfileForm) => {
      const res = await api.patch<User>('/users/me', {
        name: payload.name.trim(),
        school: payload.school.trim() || null,
        city: payload.city.trim() || null,
        state: payload.state || null,
      })
      return res.data
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      setSavedMessage('Perfil atualizado com sucesso.')
      setIsEditing(false)
    },
  })

  const subjects = useMemo(() => (trail?.subjects ?? []).map((subject, index) => {
    const total = subject.topics.length
    const pct = total ? Math.round((subject.topics.reduce((sum, topic) => sum + topicProgressScore(topic), 0) / total) * 100) : 0
    return { id: subject.id, name: subject.name, pct, ...subjectTheme(subject.slug, index) }
  }), [trail])

  if (!user) return null

  const activeVestibular = trail?.vestibular.name ?? enrollments?.[0]?.vestibular.name ?? 'Vestibular'
  const memberSince = new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '').replace(' de ', '/')
  const level = levelProgress(user.xp)
  const summary = trail?.summary
  const trailHref = firstVestibularSlug ? `/trilha/${firstVestibularSlug}` : '/trilha'

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function startEditing() {
    if (!user) return
    setSavedMessage(null)
    setForm({ name: user.name, school: user.school ?? '', city: user.city ?? '', state: user.state ?? '' })
    setIsEditing(true)
  }

  return (
    <AppLayout>
      <div className="k-page" style={{ maxWidth: 1000 }}>
        <section className="k-card pf-hero">
          <span className="pf-avatar">{user.name.charAt(0).toUpperCase()}</span>
          <div className="pf-id">
            <h1>{user.name}</h1>
            <div className="pf-meta">{[user.school, activeVestibular, `desde ${memberSince}`].filter(Boolean).join(' · ')}</div>
            <div className="pf-chips">
              <span style={{ background: 'var(--k-roxo-soft)', color: 'var(--k-roxo)' }}><i className="bi bi-lightning-charge-fill" aria-hidden="true" />Nível {user.level}</span>
              <span style={{ background: '#FFF4CC', color: '#8A5600' }}><i className="bi bi-fire" aria-hidden="true" />{user.streakDays} {user.streakDays === 1 ? 'dia seguido' : 'dias seguidos'}</span>
            </div>
          </div>
          <div className="pf-level">
            <div className="pf-level-head"><span>Nível {level.level} → {level.level + 1}</span><span className="k-mono">{user.xp} / {level.next} XP</span></div>
            <div className="k-track is-lg"><span style={{ width: `${level.pct}%` }} /></div>
            <div className="pf-level-foot">Faltam {level.left} XP pro próximo nível</div>
          </div>
        </section>

        <div className="k-seg" role="group" aria-label="Seções do perfil" style={{ alignSelf: 'flex-start' }}>
          <button type="button" aria-pressed={tab === 'geral'} onClick={() => setTab('geral')}>Visão geral</button>
          <button type="button" aria-pressed={tab === 'dados'} onClick={() => setTab('dados')}>Seus dados</button>
        </div>

        {tab === 'geral' ? (
          <div className="pf-tab">
            <div className="k-grid" style={{ ['--min' as string]: '180px', gap: 12 }}>
              {[
                [String(summary?.answeredQuestions ?? 0), 'questões respondidas'],
                [`${summary?.accuracy ?? 0}%`, 'de acerto geral'],
                [String(user.longestStreak ?? user.streakDays), 'maior sequência (dias)'],
                [String(summary?.finishedSessions ?? 0), 'sessões concluídas'],
              ].map(([value, label]) => <div key={label} className="k-card is-sm" style={{ borderRadius: 22 }}><div className="k-num" style={{ fontSize: 28 }}>{value}</div><div className="k-muted" style={{ fontSize: 13, marginTop: 6 }}>{label}</div></div>)}
            </div>
            <section className="k-card">
              <div className="k-card-head"><h3 className="k-h3">Progresso por matéria</h3><span className="k-muted" style={{ fontSize: 13 }}>{summary?.completedTopics ?? 0}/{summary?.totalTopics ?? 0} tópicos concluídos</span></div>
              {subjects.length ? <div className="pf-subjects">
                {subjects.map((subject) => (
                  <button key={subject.id} type="button" onClick={() => navigate(trailHref, { state: { subjectId: subject.id } })}>
                    <span className="pf-subject-head"><span><span className="pf-dot" style={{ background: subject.color }} />{subject.name}</span><span className="k-mono">{subject.pct}%</span></span>
                    <span className="k-track"><span style={{ width: `${Math.max(subject.pct, 2)}%`, background: subject.color }} /></span>
                  </button>
                ))}
              </div> : <p className="k-muted" style={{ margin: 0 }}>Escolha um vestibular para acompanhar suas matérias.</p>}
            </section>
          </div>
        ) : (
          <section className="k-card pf-tab">
            <div className="k-card-head" style={{ marginBottom: 0 }}>
              <div>
                <h3 className="k-h3">Suas informações</h3>
                {savedMessage && <p style={{ color: 'var(--k-verde)', fontSize: 13, margin: '6px 0 0' }} role="status">{savedMessage}</p>}
                {updateProfile.isError && <p style={{ color: 'var(--k-vinho)', fontSize: 13, margin: '6px 0 0' }} role="alert">Não foi possível salvar. Confira os campos.</p>}
              </div>
              {!isEditing && <button type="button" className="k-btn k-btn-outline is-sm" onClick={startEditing}><i className="bi bi-pencil" aria-hidden="true" />Editar perfil</button>}
            </div>
            {isEditing ? (
              <form onSubmit={(event) => { event.preventDefault(); updateProfile.mutate(form) }}>
                <div className="pf-form">
                  <label className="k-field"><span>Nome</span><input className="k-input" name="name" value={form.name} onChange={handleChange} required minLength={2} /></label>
                  <label className="k-field"><span>Escola</span><input className="k-input" name="school" value={form.school} onChange={handleChange} /></label>
                  <label className="k-field"><span>Cidade</span><input className="k-input" name="city" value={form.city} onChange={handleChange} /></label>
                  <label className="k-field"><span>Estado</span>
                    <select className="k-input" name="state" value={form.state} onChange={handleChange}>
                      <option value="">Não informado</option>
                      {BR_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
                    </select>
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, flexWrap: 'wrap' }}>
                  <button type="button" className="k-btn k-btn-outline" onClick={() => setIsEditing(false)}>Cancelar</button>
                  <button type="submit" className="k-btn k-btn-primary" disabled={updateProfile.isPending}>{updateProfile.isPending ? 'Salvando...' : 'Salvar alterações'}</button>
                </div>
              </form>
            ) : (
              <dl className="pf-info">
                {[
                  ['Nome', user.name], ['E-mail', user.email], ['Escola', user.school || '—'],
                  ['Cidade', user.city || '—'], ['Estado', user.state || '—'], ['Membro desde', memberSince],
                ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
              </dl>
            )}
          </section>
        )}
      </div>
    </AppLayout>
  )
}
