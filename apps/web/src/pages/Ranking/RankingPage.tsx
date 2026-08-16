import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { useAuthStore } from '../../stores/auth.store'
import { useRanking } from '../../hooks/useRanking'

const BADGE_SIZES = [56, 44, 44]

function PositionBadge({ label, size, bg }: { label: string; size: number; bg: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: bg, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.32, flexShrink: 0 }}>
      {label}
    </div>
  )
}

export default function RankingPage() {
  const [tab, setTab] = useState<'semanal' | 'geral'>('geral')
  // Usa o primeiro vestibular matriculado (mesma limitação do IndicePage — sem seletor multi-vestibular)
  const firstVestibularSlug = useAuthStore((s) => s.firstVestibularSlug)
  const { data, isLoading, isError } = useRanking(firstVestibularSlug ?? '')

  const entries = data?.entries ?? []
  const myRank = data?.myRank ?? null

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)
  // Pódio: 2º lugar à esquerda, 1º no centro, 3º à direita
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

        {isLoading && (
          <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, padding: '40px 0' }}>Carregando ranking...</p>
        )}

        {isError && (
          <p style={{ textAlign: 'center', color: '#840033', fontSize: 14, padding: '40px 0' }}>Não foi possível carregar o ranking. Tente novamente.</p>
        )}

        {!isLoading && !isError && entries.length === 0 && (
          <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, padding: '40px 0' }}>Nenhum participante encontrado para este vestibular.</p>
        )}

        {!isLoading && !isError && entries.length > 0 && (
          <>
            <div style={{ background: 'linear-gradient(135deg, #2a0d33 0%, #531A61 100%)', borderRadius: 24, padding: 28, marginBottom: 20, boxShadow: 'var(--shadow-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap' }}>
                {podiumOrder.map((entry) => {
                  if (!entry) return null
                  const originalIdx = entry.rank - 1
                  const isFirst = entry.rank === 1
                  return (
                    <div key={entry.rank} style={{ minWidth: 88, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', letterSpacing: '.08em', textTransform: 'uppercase' }}>{entry.rank} lugar</p>
                      <PositionBadge label={String(entry.rank)} size={BADGE_SIZES[originalIdx] ?? 44} bg={isFirst ? '#FFDC5C' : 'rgba(255,255,255,.2)'} />
                      <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, textAlign: 'center' }}>{entry.displayName}</p>
                      <p style={{ fontFamily: "'Unbounded', sans-serif", fontSize: isFirst ? 22 : 17, fontWeight: 700, color: '#FFDC5C', letterSpacing: '-0.04em' }}>{entry.xp}</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: '.06em' }}>XP</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rest.map((entry) => (
                <div key={entry.rank} style={{ backgroundColor: 'var(--surface)', borderRadius: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, border: '1.5px solid var(--line-soft)', boxShadow: 'var(--shadow-xs)' }}>
                  <span style={{ width: 28, fontSize: 14, color: '#9ca3af', fontWeight: 600, textAlign: 'center' }}>{entry.rank}</span>
                  <PositionBadge label={String(entry.rank)} size={36} bg="#531A61" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{entry.displayName}</p>
                    <p style={{ fontSize: 12, color: '#9ca3af' }}>{entry.xp} XP · Nível {entry.level}</p>
                  </div>
                  <span style={{ color: '#9ca3af', fontSize: 16 }}>→</span>
                </div>
              ))}
            </div>
          </>
        )}

        {myRank && (
          <div style={{ marginTop: 16, backgroundColor: 'rgba(83,26,97,.07)', borderRadius: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, border: '1.5px solid rgba(179,71,217,.25)', boxShadow: 'var(--shadow-xs)' }}>
            <span style={{ width: 28, fontSize: 13, color: '#531A61', fontWeight: 700, textAlign: 'center' }}>#{myRank.rank}</span>
            <PositionBadge label="EU" size={36} bg="#840033" />
            <div style={{ flex: 1 }}>
              {/* name completo: é o próprio usuário vendo a si mesmo */}
              <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{myRank.name}</p>
              <p style={{ fontSize: 12, color: '#9ca3af' }}>{myRank.xp} XP · Nível {myRank.level}</p>
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
