import AppLayout from '../../components/layout/AppLayout'
import { useAuthStore } from '../../stores/auth.store'
import { useRanking } from '../../hooks/useRanking'

function PositionBadge({ label, size, bg }: { label: string; size: number; bg: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: bg, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.32, flexShrink: 0 }}>
      {label}
    </div>
  )
}

export default function RankingPage() {
  // Usa o primeiro vestibular matriculado (mesma limitação do IndicePage — sem seletor multi-vestibular)
  const firstVestibularSlug = useAuthStore((s) => s.firstVestibularSlug)
  const { data, isLoading, isError } = useRanking(firstVestibularSlug ?? '')

  const entries = data?.entries ?? []
  const myRank = data?.myRank ?? null

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <AppLayout>
      <div className="ranking-page" style={{ padding: '32px 24px 80px', fontFamily: 'Inter, Arial, sans-serif', maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <div><h1 style={{ fontFamily: "'Questrial', sans-serif", fontSize: 28, color: '#531A61' }}>Comparativo anônimo</h1><p style={{ color: '#840033', fontSize: 14, marginTop: 6 }}>Uma referência do seu percurso de estudos.</p></div>
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
            <div style={{ background: '#531A61', padding: 24, marginBottom: 20 }}>
              <h2 style={{ color: '#FFDC5C', fontSize: 16, marginBottom: 16 }}>Participantes em destaque</h2>
              <div style={{ display: 'grid', gap: 8 }}>
                {top3.map((entry) => {
                  if (!entry) return null
                  return (
                    <div key={entry.rank} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.18)' }}>
                      <PositionBadge label={String(entry.rank)} size={36} bg="#840033" />
                      <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, flex: 1, overflowWrap: 'anywhere' }}>{entry.displayName}</p>
                      <p style={{ fontSize: 13, color: '#FFDC5C' }}>{entry.xp} XP · Nível {entry.level}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rest.map((entry) => (
                <div key={entry.rank} style={{ backgroundColor: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid rgba(83,26,97,.2)' }}>
                  <span style={{ width: 28, fontSize: 14, color: '#9ca3af', fontWeight: 600, textAlign: 'center' }}>{entry.rank}</span>
                  <PositionBadge label={String(entry.rank)} size={36} bg="#531A61" />
                  <div style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{entry.displayName}</p>
                    <p style={{ fontSize: 12, color: '#9ca3af' }}>{entry.xp} XP · Nível {entry.level}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {myRank && (
          <div style={{ marginTop: 16, backgroundColor: '#FFDC5C', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, borderLeft: '4px solid #840033' }}>
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
