import { useMemo, useState } from 'react'
import type React from 'react'
import { useMutation } from '@tanstack/react-query'
import AppLayout from '../../components/layout/AppLayout'
import ProgressBar from '../../components/ui/ProgressBar'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth.store'
import { useMyEnrollments } from '../../hooks/useEnrollments'
import { useTrail } from '../../hooks/useTrail'
import type { User } from '../../types/user'

interface ProfileForm {
  name: string
  school: string
  city: string
  state: string
}

function SemiGauge({ value, max = 1000 }: { value: number; max?: number }) {
  const pct = Math.min(value / max, 1)
  const percent = Math.round(pct * 100)

  return (
    <div style={{ minWidth: 220 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(83,26,97,.55)', fontSize: 11, marginBottom: 8 }}>
        <span>0 XP</span>
        <span>{max} XP</span>
      </div>
      <ProgressBar value={percent} color="vinho" size="md" />
      <p style={{ textAlign: 'right', color: '#531A61', fontSize: 12, fontWeight: 700, marginTop: 8 }}>{percent}% da faixa</p>
    </div>
  )
}

function topicScore(topic: { progress: { completed: boolean; sessionsCount: number; answeredQuestionsCount: number } }): number {
  if (topic.progress.completed) return 1
  if (topic.progress.sessionsCount > 0 || topic.progress.answeredQuestionsCount > 0) return 0.5
  return 0
}

const BR_STATES = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA',
  'MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN',
  'RO','RR','RS','SC','SE','SP','TO',
]

export default function ProfilePage() {
  const { user, updateUser, firstVestibularSlug } = useAuthStore()
  const { data: enrollments } = useMyEnrollments()
  const { data: trail } = useTrail(firstVestibularSlug ?? '')
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

  const subjectCards = useMemo(() => {
    if (!trail) return []
    return trail.subjects.map((subject) => {
      const total = subject.topics.length
      const score = subject.topics.reduce((sum, topic) => sum + topicScore(topic), 0)
      const answered = subject.topics.filter((topic) => topic.progress.answeredQuestionsCount > 0 || topic.progress.sessionsCount > 0).length
      return {
        id: subject.id,
        name: subject.name,
        percent: total > 0 ? Math.round((score / total) * 100) : 0,
        answered,
        total,
      }
    })
  }, [trail])

  if (!user) return null

  const activeVestibular = trail?.vestibular.name ?? enrollments?.[0]?.vestibular.name ?? 'Vestibular'
  const memberSince = new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const totalQuestions = trail?.summary.answeredQuestions ?? 0
  const finishedSessions = trail?.summary.finishedSessions ?? 0
  const completedTopics = trail?.summary.completedTopics ?? 0
  const totalTopics = trail?.summary.totalTopics ?? 0
  const progressPercent = totalTopics > 0 ? Math.round(((completedTopics + (trail?.summary.inProgressTopics ?? 0) * 0.5) / totalTopics) * 100) : 0

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function startEditing() {
    if (!user) return
    setSavedMessage(null)
    setForm({
      name: user.name,
      school: user.school ?? '',
      city: user.city ?? '',
      state: user.state ?? '',
    })
    setIsEditing(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateProfile.mutate(form)
  }

  return (
    <AppLayout>
      <div className="profile-page" style={{ padding: '32px 24px 90px', fontFamily: 'Inter, Arial, sans-serif', background: 'var(--bg)', minHeight: '100%' }}>
        <section className="profile-hero-card" style={{ backgroundColor: '#FFDC5C', borderRadius: 24, padding: '28px 32px', marginBottom: 20 }}>
          <div className="profile-hero-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 22 }}>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(83,26,97,.62)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>PERFIL DO ESTUDANTE</p>
              <h1 style={{ fontFamily: "'Questrial', sans-serif", fontSize: 32, color: '#531A61', marginBottom: 6 }}>{user.name}</h1>
              <p style={{ color: 'rgba(83,26,97,.72)', fontSize: 14 }}>{activeVestibular} · membro desde {memberSince}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <span style={{ backgroundColor: '#531A61', color: '#fff', fontSize: 12, padding: '6px 12px', borderRadius: 999, fontWeight: 700 }}>Nivel {user.level}</span>
              <span style={{ backgroundColor: 'rgba(83,26,97,.12)', color: '#531A61', fontSize: 12, padding: '6px 12px', borderRadius: 999, fontWeight: 700 }}>{user.streakDays} dias de sequencia</span>
            </div>
          </div>

          <div className="profile-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'end' }}>
            <div>
              <div className="profile-score" style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 76, fontWeight: 700, color: '#531A61', lineHeight: 0.9, letterSpacing: '-0.04em' }}>
                {user.xp}
              </div>
              <p style={{ fontSize: 13, color: 'rgba(83,26,97,.65)', marginTop: 10, marginBottom: 18 }}>XP total acumulado</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ backgroundColor: 'rgba(83,26,97,.1)', color: '#531A61', fontSize: 12, padding: '6px 12px', borderRadius: 999 }}>{totalQuestions} questoes</span>
                <span style={{ backgroundColor: 'rgba(83,26,97,.1)', color: '#531A61', fontSize: 12, padding: '6px 12px', borderRadius: 999 }}>{finishedSessions} sessoes</span>
                <span style={{ backgroundColor: 'rgba(83,26,97,.1)', color: '#531A61', fontSize: 12, padding: '6px 12px', borderRadius: 999 }}>{progressPercent}% da trilha</span>
              </div>
            </div>
            <div className="profile-gauge">
              <SemiGauge value={user.xp} />
            </div>
          </div>
        </section>

        <section className="profile-history-card" style={{ backgroundColor: '#2a0d33', borderRadius: 24, padding: 28, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
            <div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', letterSpacing: '.1em', textTransform: 'uppercase' }}>PROGRESSO POR MATERIA</p>
              <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 13, marginTop: 4 }}>Baseado nas suas respostas e sessoes finalizadas.</p>
            </div>
            <span style={{ color: '#FFDC5C', fontSize: 13, fontWeight: 700 }}>{completedTopics}/{totalTopics} topicos concluidos</span>
          </div>

          <div className="profile-subject-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            {subjectCards.length > 0 ? subjectCards.map((subject) => (
              <div className="profile-subject-card" key={subject.id} style={{ backgroundColor: 'rgba(255,255,255,.05)', borderRadius: 14, padding: 16, minWidth: 0 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>{subject.name}</p>
                <p style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>{subject.percent}%</p>
                <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 12, marginTop: 6 }}>{subject.answered}/{subject.total} topicos com atividade</p>
              </div>
            )) : (
              <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 14 }}>Matricule-se em um vestibular para acompanhar as materias.</p>
            )}
          </div>
        </section>

        <section className="profile-info-card" style={{ backgroundColor: 'var(--surface)', borderRadius: 24, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
          <div className="profile-info-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12 }}>
            <div>
              <h2 style={{ fontFamily: "'Questrial', sans-serif", fontSize: 20, color: '#1a1a1a' }}>Informacoes</h2>
              {savedMessage && <p style={{ color: '#047857', fontSize: 13, marginTop: 4 }}>{savedMessage}</p>}
              {updateProfile.isError && <p style={{ color: '#840033', fontSize: 13, marginTop: 4 }}>Nao foi possivel salvar. Confira os campos.</p>}
            </div>
            {!isEditing && (
              <button onClick={startEditing} style={{ backgroundColor: 'transparent', border: '1.5px solid #531A61', color: '#531A61', padding: '9px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'Inter, Arial, sans-serif' }}>
                Editar perfil
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="profile-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Nome</span>
                  <input name="name" value={form.name} onChange={handleChange} required minLength={2} style={inputStyle} />
                </label>
                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Escola</span>
                  <input name="school" value={form.school} onChange={handleChange} style={inputStyle} />
                </label>
                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Cidade</span>
                  <input name="city" value={form.city} onChange={handleChange} style={inputStyle} />
                </label>
                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Estado</span>
                  <select name="state" value={form.state} onChange={handleChange} style={inputStyle}>
                    <option value="">Nao informado</option>
                    {BR_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
                  </select>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setIsEditing(false)} style={{ backgroundColor: 'transparent', border: '1.5px solid #e5e7eb', color: '#6b7280', padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={updateProfile.isPending} style={{ backgroundColor: '#531A61', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 10, cursor: updateProfile.isPending ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
                  {updateProfile.isPending ? 'Salvando...' : 'Salvar alteracoes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
              {[
                { label: 'Nome', value: user.name },
                { label: 'E-mail', value: user.email },
                { label: 'Escola', value: user.school ?? '-' },
                { label: 'Cidade', value: user.city ?? '-' },
                { label: 'Estado', value: user.state ?? '-' },
                { label: 'Membro desde', value: memberSince },
              ].map(({ label, value }) => (
                <div key={label} style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4, letterSpacing: '.04em', textTransform: 'uppercase' }}>{label}</p>
                  <p style={{ fontSize: 15, color: '#1a1a1a', fontWeight: 500, overflowWrap: 'anywhere' }}>{value}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <style>{`
          .profile-page,
          .profile-page * { box-sizing: border-box; }

          @media (max-width: 768px) {
            .profile-page { padding: 20px 16px 140px !important; }
            .profile-hero-card,
            .profile-history-card,
            .profile-info-card { border-radius: 18px !important; padding: 20px !important; }
            .profile-hero-head,
            .profile-hero-grid,
            .profile-info-head { grid-template-columns: 1fr !important; flex-direction: column !important; align-items: flex-start !important; }
            .profile-score { font-size: 58px !important; letter-spacing: 0 !important; }
            .profile-gauge { display: none !important; }
            .profile-subject-grid,
            .profile-info-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </AppLayout>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1.5px solid rgba(26,10,31,.14)',
  borderRadius: 10,
  padding: '11px 13px',
  fontSize: 14,
  color: '#1a0a1f',
  backgroundColor: '#fff',
  outline: 'none',
  fontFamily: 'Inter, Arial, sans-serif',
}
