import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { useAuthStore } from '../../stores/auth.store'

interface RankEntry { pos: number; name: string; xp: number; initial: string }

const MOCK_RANKING: RankEntry[] = [
  { pos: 1, name: 'Marina S.', xp: 1240, initial: 'M' },
  { pos: 2, name: 'João P.', xp: 1180, initial: 'J' },
  { pos: 3, name: 'Ana C.', xp: 1050, initial: 'A' },
  { pos: 4, name: 'Pedro L.', xp: 920, initial: 'P' },
  { pos: 5, name: 'Larissa F.', xp: 870, initial: 'L' },
]

const MEDAL = ['👑', '🥈', '🥉']
const AVATAR_SIZES = [56, 44, 44]

function Avatar({ initial, size, bg }: { initial: string; size: number; bg: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: bg, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.35, flexShrink: 0 }}>
      {initial}
    </div>
  )
}

export default function RankingPage() {
  const [tab, setTab] = useState<'semanal' | 'geral'>('semanal')
  const { user } = useAuthStore()

  const top3 = MOCK_RANKING.slice(0, 3)
  const rest = MOCK_RANKING.slice(3)

  const podiumOrder = [top3[1], top3[0], top3[2]] // 2º | 1º | 3º

  return (
    <AppLayout>
      <div style={{ padding: '32px 24px 80px', fontFamily: 'Arial, sans-serif', maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Questrial', sans-serif", fontSize: 28, color: '#531A61' }}>🏆 Ranking</h1>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['semanal', 'geral'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: '7px 16px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Arial, sans-serif', backgroundColor: tab === t ? '#531A61' : 'transparent', color: tab === t ? '#fff' : '#9ca3af' }}>
                {t === 'semanal' ? 'Semanal' : 'Geral'}
              </button>
            ))}
          </div>
        </div>

        {/* Pódio */}
        <div style={{ backgroundColor: '#531A61', borderRadius: 24, padding: 28, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 20 }}>
            {podiumOrder.map((entry) => {
              if (!entry) return null
              const originalIdx = entry.pos - 1
              const isFirst = entry.pos === 1
              return (
                <div key={entry.pos} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>{MEDAL[originalIdx]}</span>
                  <Avatar initial={entry.initial} size={AVATAR_SIZES[originalIdx]} bg={isFirst ? '#FFDC5C' : 'rgba(255,255,255,.2)'} />
                  <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, textAlign: 'center' }}>{entry.name}</p>
                  <p style={{ fontFamily: "'Unbounded', sans-serif", fontSize: isFirst ? 22 : 17, fontWeight: 700, color: '#FFDC5C', letterSpacing: '-0.04em' }}>{entry.xp}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: '.06em' }}>XP</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rest.map((entry) => {
            const isMe = user?.name.split(' ')[0] === entry.name.split(' ')[0]
            return (
              <div key={entry.pos} style={{ backgroundColor: isMe ? 'rgba(83,26,97,.08)' : '#fff', borderRadius: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, border: isMe ? '1.5px solid rgba(83,26,97,.2)' : '1.5px solid transparent' }}>
                <span style={{ width: 28, fontSize: 14, color: '#9ca3af', fontWeight: 600, textAlign: 'center' }}>{entry.pos}</span>
                <Avatar initial={entry.initial} size={36} bg="#531A61" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{entry.name}{isMe ? ' (você)' : ''}</p>
                  <p style={{ fontSize: 12, color: '#9ca3af' }}>{entry.xp} XP</p>
                </div>
                <span style={{ color: '#9ca3af', fontSize: 16 }}>→</span>
              </div>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}
