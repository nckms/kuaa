import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVestibulares } from '../../hooks/useVestibulares'
import { useMyEnrollments, useEnroll } from '../../hooks/useEnrollments'
import { useAuthStore } from '../../stores/auth.store'
import AuthShell from '../Auth/AuthShell'
import ExamOption from '../../components/onboarding/ExamOption'
import type { Vestibular } from '../../types/trail'

export default function SelectVestibular() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const { data: vestibulares, isLoading } = useVestibulares()
  const { data: enrollments } = useMyEnrollments()
  const enroll = useEnroll()

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const enrolledIds = new Set(enrollments?.map((e) => e.enrollment.vestibularId) ?? [])

  async function handleConfirm() {
    if (!selectedId) return
    const vestibular = vestibulares?.find((v) => v.id === selectedId)
    if (!vestibular) return

    enroll.mutate(selectedId, {
      onSuccess: () => {
        navigate(`/diagnostico/${vestibular.slug}`)
      },
    })
  }

  function handleSelect(v: Vestibular) {
    if (enrolledIds.has(v.id)) return
    setSelectedId((prev) => (prev === v.id ? null : v.id))
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const ready = !!selectedId && !enroll.isPending

  return (
    <AuthShell
      asideTitle="Cada vestibular cobra de um jeito. Sua trilha também."
      asideText="Escolha a prova principal. Dá pra adicionar outras depois nas configurações."
      topRight={<button type="button" className="auth-switch" style={{ background: 'none', border: 0 }} onClick={handleLogout}>Sair</button>}
      step={1}
      title="Qual é a sua prova?"
      subtitle="Dá pra adicionar outras depois."
    >
      <div className="exam-list">
        {isLoading ? [1, 2, 3].map((i) => <div key={i} className="exam-option is-skeleton" />)
          : !vestibulares?.length ? <p role="status" className="k-muted">Nenhum vestibular disponível no momento. Tente novamente mais tarde.</p>
            : vestibulares.map((v) => (
              <ExamOption key={v.id} vestibular={v} selected={selectedId === v.id} disabled={enrolledIds.has(v.id)}
                note={enrolledIds.has(v.id) ? 'Você já está matriculado' : undefined} onClick={() => handleSelect(v)} />
            ))}
      </div>
      <button type="button" onClick={handleConfirm} disabled={!ready} className={`k-btn is-lg is-block ${ready ? 'k-btn-primary' : 'k-btn-outline'}`} style={{ marginTop: 28 }}>
        {enroll.isPending ? 'Salvando escolha…' : 'Começar diagnóstico'} <i className="bi bi-arrow-right" aria-hidden="true" />
      </button>
      {enroll.isError && <p role="alert" className="k-alert" style={{ marginTop: 12 }}>Não foi possível salvar sua escolha. Tente novamente.</p>}
    </AuthShell>
  )
}
