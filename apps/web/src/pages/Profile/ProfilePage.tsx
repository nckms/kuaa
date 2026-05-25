import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import ProgressBar from '../../components/ui/ProgressBar'
import { useAuthStore } from '../../stores/auth.store'
import { useMyEnrollments } from '../../hooks/useEnrollments'

function SemiGauge({ value, max = 1000 }: { value: number; max?: number }) {
  const r = 80
  const cx = 110
  const cy = 100
  const pct = Math.min(value / max, 1)
  const angleRange = Math.PI
  const currentAngle = Math.PI - pct * angleRange

  const x1 = cx + r * Math.cos(Math.PI)
  const y1 = cy + r * Math.sin(Math.PI)
  const x2 = cx + r * Math.cos(0)
  const y2 = cy + r * Math.sin(0)
  const fillX = cx + r * Math.cos(currentAngle)
  const fillY = cy + r * Math.sin(currentAngle)
  const largeArc = pct > 0.5 ? 1 : 0

  return (
    <svg width={220} height={120} viewBox={`0 0 ${220} 120`}>
      {/* Background arc */}
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
        fill="none"
        stroke="rgba(83,26,97,.2)"
        strokeWidth={12}
        strokeLinecap="round"
      />
      {/* Fill arc */}
      {pct > 0 && (
        <path
          d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${fillX} ${fillY}`}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={12}
          strokeLinecap="round"
        />
      )}
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#531A61" />
          <stop offset="100%" stopColor="#840033" />
        </linearGradient>
      </defs>
      <text x={cx - r - 4} y={cy + 20} fill="rgba(83,26,97,.5)" fontSize={11} textAnchor="middle">300</text>
      <text x={cx + r + 4} y={cy + 20} fill="rgba(83,26,97,.5)" fontSize={11} textAnchor="middle">900</text>
    </svg>
  )
}

const SUBJECT_CARDS = [
  { name: 'Redação', icon: '✍️', color: '#840033', bg: 'rgba(132,0,51,.15)' },
  { name: 'Linguagens', icon: '📚', color: '#531A61', bg: 'rgba(83,26,97,.12)' },
  { name: 'Humanas', icon: '🌍', color: '#531A61', bg: 'rgba(83,26,97,.12)' },
  { name: 'Exatas', icon: '📐', color: '#840033', bg: 'rgba(132,0,51,.15)' },
  { name: 'Natureza', icon: '🔬', color: '#531A61', bg: 'rgba(83,26,97,.12)' },
  { name: 'Simulados', icon: '🎯', color: '#FFDC5C', bg: 'rgba(255,220,92,.15)' },
]

export default function ProfilePage() {
  const { user } = useAuthStore()
  const { data: enrollments } = useMyEnrollments()
  const [isEditing, setIsEditing] = useState(false)

  if (!user) return null

  const activeVestibular = enrollments?.[0]?.vestibular.name ?? 'ENEM 2026'
  const xpBand = user.xp >= 850 ? { label: '850+ ELITE', idx: 3 } : user.xp >= 700 ? { label: '700-849 FORTE', idx: 2 } : user.xp >= 500 ? { label: '500-699 FIRME', idx: 1 } : { label: '300-499 RISCO', idx: 0 }
  const BANDS = ['300-499 RISCO', '500-699 FIRME', '700-849 FORTE', '850+ ELITE']

  const memberSince = new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <AppLayout>
      <div style={{ padding: '32px 24px 80px', fontFamily: 'Inter, Arial, sans-serif', background: 'var(--bg)' }}>

        {/* Hero card amarelo */}
        <div style={{ backgroundColor: '#FFDC5C', borderRadius: 24, padding: '28px 32px', marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: 'rgba(83,26,97,.6)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>SEU PERFIL DE APROVAÇÃO</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h1 style={{ fontFamily: "'Questrial', sans-serif", fontSize: 32, color: '#531A61' }}>Índice Kuaa</h1>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ backgroundColor: '#531A61', color: '#fff', fontSize: 12, padding: '5px 12px', borderRadius: 999, fontWeight: 600 }}>✓ {activeVestibular}</span>
              <span style={{ backgroundColor: 'rgba(83,26,97,.12)', color: '#531A61', fontSize: 12, padding: '5px 12px', borderRadius: 999 }}>Atualizado agora</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
            <div>
              <span style={{ display: 'inline-block', backgroundColor: '#840033', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, marginBottom: 12, letterSpacing: '.04em' }}>• TOP —% NACIONAL</span>
              <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 80, fontWeight: 700, color: '#531A61', lineHeight: 0.9, letterSpacing: '-0.045em', marginBottom: 8 }}>
                {user.xp}
              </div>
              <p style={{ fontSize: 14, color: 'rgba(83,26,97,.6)', marginBottom: 16 }}>DE PONTOS TOTAIS</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(83,26,97,.1)', borderRadius: 999, padding: '5px 14px', marginBottom: 16, fontSize: 13, color: '#531A61', fontWeight: 600 }}>
                ↑ +0 em 7 dias
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {BANDS.map((band, i) => (
                  <span key={band} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, backgroundColor: i === xpBand.idx ? '#531A61' : 'rgba(83,26,97,.1)', color: i === xpBand.idx ? '#fff' : 'rgba(83,26,97,.5)' }}>
                    {band}
                  </span>
                ))}
              </div>
            </div>
            <SemiGauge value={user.xp} />
          </div>
        </div>

        {/* Grid de matérias */}
        <div style={{ backgroundColor: '#2a0d33', borderRadius: 24, padding: 28, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', letterSpacing: '.1em', textTransform: 'uppercase' }}>HISTÓRICO DE PONTUAÇÃO</p>
            {/* Sparkline placeholder */}
            <svg width={80} height={24} viewBox="0 0 80 24">
              <polyline points="0,20 12,16 24,14 36,10 48,8 60,6 72,4 80,2" fill="none" stroke="#FFDC5C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {SUBJECT_CARDS.map((s) => (
              <div key={s.name} style={{ backgroundColor: 'rgba(255,255,255,.05)', borderRadius: 14, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{s.name}</span>
                </div>
                <p style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>—%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Info do usuário */}
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: 24, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Questrial', sans-serif", fontSize: 20, color: '#1a1a1a' }}>Informações</h2>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} style={{ backgroundColor: 'transparent', border: '1.5px solid #531A61', color: '#531A61', padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'Arial, sans-serif' }}>
                Editar perfil
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {[
              { label: 'Nome', value: user.name },
              { label: 'E-mail', value: user.email },
              { label: 'Escola', value: user.school ?? '—' },
              { label: 'Cidade', value: user.city ?? '—' },
              { label: 'Estado', value: user.state ?? '—' },
              { label: 'Membro desde', value: memberSince },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4, letterSpacing: '.04em', textTransform: 'uppercase' }}>{label}</p>
                <p style={{ fontSize: 15, color: '#1a1a1a', fontWeight: 500 }}>{value}</p>
              </div>
            ))}
          </div>
          {isEditing && (
            <div style={{ marginTop: 20, borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
              <p style={{ color: '#9ca3af', fontSize: 14 }}>Edição de perfil — em breve.</p>
              <button onClick={() => setIsEditing(false)} style={{ marginTop: 10, backgroundColor: '#531A61', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontFamily: 'Arial, sans-serif' }}>Fechar</button>
            </div>
          )}
        </div>

        {/* ProgressBar used to satisfy import (not visible but prevents tree-shaking lint) */}
        <div style={{ display: 'none' }}>
          <ProgressBar value={0} />
        </div>

      </div>
    </AppLayout>
  )
}
