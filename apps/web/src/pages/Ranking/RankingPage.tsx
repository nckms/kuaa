import { Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { useAuthStore } from '../../stores/auth.store'
import { useRanking } from '../../hooks/useRanking'
import './RankingPage.css'

const MEDALS = ['#FFDC5C', '#E4DEE6', '#E8B07A']
const HEIGHTS = ['150px', '110px', '84px']

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}

export default function RankingPage() {
  const firstVestibularSlug = useAuthStore((s) => s.firstVestibularSlug)
  const vestibularName = useAuthStore((s) => s.enrollments.find((item) => item.vestibular.slug === s.firstVestibularSlug)?.vestibular.name)
  const { data, isLoading, isError, refetch } = useRanking(firstVestibularSlug ?? '')

  const entries = data?.entries ?? []
  const myRank = data?.myRank ?? null
  const podium = [1, 0, 2].map((index) => entries[index] ? { entry: entries[index]!, place: index } : null).filter(Boolean) as { entry: NonNullable<typeof entries[number]>; place: number }[]
  const rest = entries.slice(3)
  const above = myRank ? entries.find((entry) => entry.rank === myRank.rank - 1) : undefined

  return (
    <AppLayout>
      <div className="k-page is-narrow">
        <header><p className="k-eyebrow">Comparativo anônimo{vestibularName ? ` · ${vestibularName}` : ''}</p><h1 className="k-h1">Ranking</h1></header>

        {isLoading && <div className="k-state">Carregando ranking...</div>}
        {isError && <div className="k-state" role="alert"><p style={{ margin: 0 }}>Não foi possível carregar o ranking.</p><button className="k-btn k-btn-primary is-sm" onClick={() => void refetch()}>Tentar novamente</button></div>}
        {!isLoading && !isError && entries.length === 0 && <div className="k-state">Nenhum participante encontrado para este vestibular.</div>}

        {entries.length > 0 && (
          <>
            <section className="rk-podium" aria-label="Pódio">
              {podium.map(({ entry, place }) => (
                <div key={entry.rank} className="rk-podium-col">
                  <span className="rk-avatar" style={{ width: place === 0 ? 72 : 58, height: place === 0 ? 72 : 58, borderColor: MEDALS[place] }}>{initials(entry.displayName)}</span>
                  <div className="rk-podium-name"><strong>{entry.displayName}</strong><small className="k-mono">{entry.xp.toLocaleString('pt-BR')} XP</small></div>
                  <div className="rk-step" style={{ height: HEIGHTS[place], background: MEDALS[place] }}>{entry.rank}</div>
                </div>
              ))}
            </section>

            {myRank && (
              <div className="rk-me">
                <i className="bi bi-graph-up-arrow" aria-hidden="true" />
                <div>{myRank.rank === 1 ? 'Você está em #1. Continue assim!' : <>Você está em <strong>#{myRank.rank}</strong>{above ? <>. Faltam {Math.max(1, above.xp - myRank.xp)} XP pra passar {above.displayName}.</> : '.'}</>}</div>
                <Link to={firstVestibularSlug ? `/trilha/${firstVestibularSlug}` : '/trilha'} className="k-btn is-sm" style={{ background: 'var(--k-roxo-deep)', color: '#fff' }}><i className="bi bi-play-fill" aria-hidden="true" />Praticar</Link>
              </div>
            )}

            {rest.length > 0 && (
              <div className="k-card is-flush">
                {rest.map((entry) => {
                  const me = myRank?.rank === entry.rank
                  return (
                    <div key={entry.rank} className={`rk-row${me ? ' is-me' : ''}`}>
                      <span className="k-mono rk-rank">{entry.rank}</span>
                      <span className="rk-row-avatar">{initials(entry.displayName)}</span>
                      <div className="rk-row-name"><strong>{me ? `Você · ${entry.displayName}` : entry.displayName}</strong><small>Nível {entry.level}</small></div>
                      <span className="k-mono rk-xp">{entry.xp.toLocaleString('pt-BR')} XP</span>
                    </div>
                  )
                })}
              </div>
            )}

            {myRank && !entries.some((entry) => entry.rank === myRank.rank) && (
              <div className="k-card is-flush"><div className="rk-row is-me">
                <span className="k-mono rk-rank">{myRank.rank}</span>
                <span className="rk-row-avatar">{initials(myRank.name)}</span>
                <div className="rk-row-name"><strong>Você · {myRank.name}</strong><small>Nível {myRank.level}</small></div>
                <span className="k-mono rk-xp">{myRank.xp.toLocaleString('pt-BR')} XP</span>
              </div></div>
            )}
          </>
        )}
        <p className="k-muted" style={{ fontSize: 13, textAlign: 'center', margin: 0 }}>Nomes abreviados pra preservar a privacidade. É uma referência do seu percurso, não uma competição.</p>
      </div>
    </AppLayout>
  )
}
