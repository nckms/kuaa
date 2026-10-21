import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVestibulares } from '../../hooks/useVestibulares'
import { useMyEnrollments, useEnroll } from '../../hooks/useEnrollments'
import { useAuthStore } from '../../stores/auth.store'
import KuaaLogo from '../../components/ui/KuaaLogo'
import type { Vestibular } from '../../types/trail'
import './SelectVestibular.css'

const VESTIBULAR_META: Record<string, { color: string; bg: string; label: string; desc: string }> = {
  enem: { color: '#FFDC5C', bg: 'rgba(255,220,92,.12)', label: 'Nacional', desc: 'Acesso a universidades federais e estaduais em todo o Brasil.' },
  fuvest: { color: '#840033', bg: 'rgba(132,0,51,.08)', label: 'USP', desc: 'Vestibular da Universidade de São Paulo.' },
  unicamp: { color: '#531A61', bg: 'rgba(83,26,97,.08)', label: 'UNICAMP', desc: 'Vestibular da Universidade Estadual de Campinas.' },
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
    <button className="vestibular-card"
      onClick={onClick}
      disabled={enrolled}
      aria-pressed={selected}
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
          {enrolled ? 'Já escolhido' : meta.label}
        </span>
        {selected && !enrolled && (
          <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: meta.color, display: 'grid', placeItems: 'center' }}>
            <span style={{ color: '#1a0a1f', fontSize: 11, fontWeight: 900 }}>✓</span>
          </div>
        )}
      </div>
      <h3 style={{ fontWeight: 700, fontSize: 18, color: '#531A61', marginBottom: 6 }}>
        {vestibular.name}
      </h3>
      <p style={{ color: '#594c5d', fontSize: 13, lineHeight: 1.6 }}>
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

  return (
    <div className="vestibular-page" style={{ minHeight: '100vh', fontFamily: "'Questrial', Arial, sans-serif", display: 'flex', flexDirection: 'column' }}>

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
          Etapa 1 de 2
        </div>

        <h1 style={{ fontWeight: 700, fontSize: 'clamp(26px, 3vw, 36px)', color: '#531A61', lineHeight: 1.2, marginBottom: 12 }}>
          Qual vestibular você vai prestar?
        </h1>
        <p style={{ color: '#594c5d', fontSize: 15, marginBottom: 36 }}>
          Escolha um agora. Você poderá adicionar outros depois.
        </p>

        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : !vestibulares?.length ? (
          <p role="status">Nenhum vestibular disponível no momento. Tente novamente mais tarde.</p>
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
            {enroll.isPending ? 'Salvando escolha…' : 'Continuar para o diagnóstico'}
          </button>
          {enroll.isError && (
            <p style={{ color: '#fca5a5', fontSize: 13, textAlign: 'center', marginTop: 10 }}>
              Não foi possível salvar sua escolha. Tente novamente.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
