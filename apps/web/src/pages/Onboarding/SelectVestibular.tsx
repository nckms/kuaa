import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVestibulares } from '../../hooks/useVestibulares'
import { useMyEnrollments, useEnroll } from '../../hooks/useEnrollments'
import { useAuthStore } from '../../stores/auth.store'
import KuaaLogo from '../../components/ui/KuaaLogo'
import type { Vestibular } from '../../types/trail'

const VESTIBULAR_META: Record<string, { color: string; bg: string; label: string; desc: string }> = {
  enem: { color: '#FFDC5C', bg: 'rgba(255,220,92,.12)', label: 'Nacional', desc: 'Acesso a universidades federais e estaduais em todo o Brasil.' },
  fuvest: { color: '#c084fc', bg: 'rgba(192,132,252,.1)', label: 'USP', desc: 'Vestibular da Universidade de São Paulo — uma das melhores do Brasil.' },
  unicamp: { color: '#6ee7b7', bg: 'rgba(110,231,183,.1)', label: 'UNICAMP', desc: 'Universidade Estadual de Campinas, referência em pesquisa e inovação.' },
}

function CardSkeleton() {
  return (
    <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,.08)', padding: 28, backgroundColor: 'rgba(255,255,255,.03)', animation: 'pulse 2s infinite' }}>
      <div style={{ width: 48, height: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.08)', marginBottom: 20 }} />
      <div style={{ width: '60%', height: 20, borderRadius: 8, backgroundColor: 'rgba(255,255,255,.06)', marginBottom: 10 }} />
      <div style={{ width: '40%', height: 14, borderRadius: 8, backgroundColor: 'rgba(255,255,255,.04)' }} />
    </div>
  )
}

interface CardProps {
  vestibular: Vestibular
  selected: boolean
  enrolled: boolean
  onClick: () => void
}

function VestibularCard({ vestibular, selected, enrolled, onClick }: CardProps) {
  const meta = VESTIBULAR_META[vestibular.slug] ?? { color: '#FFDC5C', bg: 'rgba(255,220,92,.12)', label: 'Vestibular', desc: vestibular.description }

  return (
    <button
      onClick={onClick}
      disabled={enrolled}
      style={{
        textAlign: 'left',
        borderRadius: 20,
        border: `1.5px solid ${enrolled ? 'rgba(132,0,51,.4)' : selected ? meta.color : 'rgba(255,255,255,.1)'}`,
        padding: '28px 24px',
        backgroundColor: enrolled ? 'rgba(132,0,51,.08)' : selected ? meta.bg : 'rgba(255,255,255,.03)',
        cursor: enrolled ? 'default' : 'pointer',
        width: '100%',
        transition: 'border-color .15s, background-color .15s',
        position: 'relative',
        outline: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <span
          className="k-pill"
          style={{ backgroundColor: enrolled ? 'rgba(132,0,51,.18)' : meta.bg, color: enrolled ? '#fca5a5' : meta.color }}
        >
          {enrolled ? 'Matriculado' : meta.label}
        </span>
        {selected && !enrolled && (
          <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: meta.color, display: 'grid', placeItems: 'center' }}>
            <span style={{ color: '#1a0a1f', fontSize: 11, fontWeight: 900 }}>✓</span>
          </div>
        )}
      </div>
      <h3 style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: '-.025em', marginBottom: 6 }}>
        {vestibular.name}
      </h3>
      <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 13, lineHeight: 1.6 }}>
        {meta.desc}
      </p>
    </button>
  )
}

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
        navigate(`/trilha/${vestibular.slug}`)
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a0a1f', fontFamily: "'Questrial', Arial, sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,.06)', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <KuaaLogo size={32} dark />
        <button
          onClick={handleLogout}
          style={{ color: 'rgba(255,255,255,.35)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Questrial', Arial, sans-serif" }}
        >
          Sair
        </button>
      </nav>

      {/* Main */}
      <div style={{ flex: 1, maxWidth: 860, margin: '0 auto', width: '100%', padding: '64px 32px 120px' }}>

        <div className="k-pill ghost-dark" style={{ marginBottom: 24 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#FFDC5C', flexShrink: 0 }} />
          Passo 1 de 1
        </div>

        <h1 style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 'clamp(24px, 3.5vw, 38px)', color: '#fff', letterSpacing: '-.03em', lineHeight: 1.1, marginBottom: 12 }}>
          Para qual vestibular você<br />está se preparando?
        </h1>
        <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 15, marginBottom: 44 }}>
          Você pode adicionar mais vestibulares depois, sem custo.
        </p>

        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {vestibulares?.map((v) => (
              <VestibularCard
                key={v.id}
                vestibular={v}
                selected={selectedId === v.id}
                enrolled={enrolledIds.has(v.id)}
                onClick={() => handleSelect(v)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sticky bottom CTA */}
      <div style={{ position: 'sticky', bottom: 0, borderTop: '1px solid rgba(255,255,255,.07)', backgroundColor: 'rgba(26,10,31,.92)', backdropFilter: 'blur(16px)', padding: '16px 32px', flexShrink: 0 }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <button
            onClick={handleConfirm}
            disabled={!selectedId || enroll.isPending}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 999,
              fontFamily: "'Unbounded', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              backgroundColor: !selectedId || enroll.isPending ? 'rgba(255,220,92,.25)' : '#FFDC5C',
              color: !selectedId || enroll.isPending ? 'rgba(42,13,51,.4)' : '#2a0d33',
              border: 'none',
              cursor: !selectedId || enroll.isPending ? 'not-allowed' : 'pointer',
              letterSpacing: '-.02em',
              transition: 'background-color .15s',
            }}
          >
            {enroll.isPending ? 'Matriculando…' : 'Começar minha trilha →'}
          </button>
          {enroll.isError && (
            <p style={{ color: '#fca5a5', fontSize: 13, textAlign: 'center', marginTop: 10 }}>
              Erro ao matricular. Tente novamente.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
