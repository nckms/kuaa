import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { useAuthStore } from '../../stores/auth.store'

interface RankEntry {
  pos: number
  xp: number
}

const MOCK_RANKING: RankEntry[] = [
  { pos: 1, xp: 1240 },
  { pos: 2, xp: 1180 },
  { pos: 3, xp: 1050 },
  { pos: 4, xp: 920 },
  { pos: 5, xp: 870 },
]

const BADGE_SIZES = [56, 44, 44]

function PositionBadge({ label, size, bg }: { label: string; size: number; bg: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: bg, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.32, flexShrink: 0 }}>
      {label}
    </div>
  )
}

export default function RankingPage() {
  const [tab, setTab] = useState<'semanal' | 'geral'>('semanal')
  const { user } = useAuthStore()

  const top3 = MOCK_RANKING.slice(0, 3)
  const rest = MOCK_RANKING.slice(3)
  const podiumOrder = [top3[1], top3[0], top3[2]]

  return (
    <AppLayout>
      <div className="ranking-page" style={{ padding: '32px 24px 80px', fontFamily: 'Inter, Arial, sans-serif', maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Questrial', sans-serif", fontSize: 28, color: '#531A61' }}>Comparativo anonimo</h1>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['semanal', 'geral'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: '7px 16px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, Arial, sans-serif', backgroundColor: tab === t ? '#531A61' : 'transparent', color: tab === t ? '#fff' : '#9ca3af' }}>
                {t === 'semanal' ? 'Semanal' : 'Geral'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #2a0d33 0%, #531A61 100%)', borderRadius: 24, padding: 28, marginBottom: 20, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap' }}>
            {podiumOrder.map((entry) => {
              if (!entry) return null
              const originalIdx = entry.pos - 1
              const isFirst = entry.pos === 1
              return (
                <div key={entry.pos} style={{ minWidth: 88, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', letterSpacing: '.08em', textTransform: 'uppercase' }}>{entry.pos} lugar</p>
                  <PositionBadge label={String(entry.pos)} size={BADGE_SIZES[originalIdx]} bg={isFirst ? '#FFDC5C' : 'rgba(255,255,255,.2)'} />
                  <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, textAlign: 'center' }}>Participante anonimo</p>
                  <p style={{ fontFamily: "'Unbounded', sans-serif", fontSize: isFirst ? 22 : 17, fontWeight: 700, color: '#FFDC5C', letterSpacing: '-0.04em' }}>{entry.xp}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: '.06em' }}>XP</p>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rest.map((entry) => (
            <div key={entry.pos} style={{ backgroundColor: 'var(--surface)', borderRadius: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, border: '1.5px solid var(--line-soft)', boxShadow: 'var(--shadow-xs)' }}>
              <span style={{ width: 28, fontSize: 14, color: '#9ca3af', fontWeight: 600, textAlign: 'center' }}>{entry.pos}</span>
              <PositionBadge label={String(entry.pos)} size={36} bg="#531A61" />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>Participante anonimo</p>
                <p style={{ fontSize: 12, color: '#9ca3af' }}>{entry.xp} XP</p>
              </div>
              <span style={{ color: '#9ca3af', fontSize: 16 }}>→</span>
            </div>
          ))}
        </div>

        {user && (
          <div style={{ marginTop: 16, backgroundColor: 'rgba(83,26,97,.07)', borderRadius: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, border: '1.5px solid rgba(179,71,217,.25)', boxShadow: 'var(--shadow-xs)' }}>
            <span style={{ width: 28, fontSize: 13, color: '#531A61', fontWeight: 700, textAlign: 'center' }}>Voce</span>
            <PositionBadge label="EU" size={36} bg="#840033" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>Sua pontuacao</p>
              <p style={{ fontSize: 12, color: '#9ca3af' }}>{user.xp} XP</p>
            </div>
          </div>
        )}

        <style>{`
          @media (max-width: 768px) {
            .ranking-page {
              padding: 20px 16px 140px !important;
            }
          }
        `}</style>
      </div>
    </AppLayout>
  )
}
