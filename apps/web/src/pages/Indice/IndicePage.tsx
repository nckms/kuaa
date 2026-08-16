import { useAuthStore } from '../../stores/auth.store'
import KuaaIcon from '../../components/ui/KuaaIcon'
import Avatar from '../../components/ui/Avatar'
import AppLayout from '../../components/layout/AppLayout'
import { useIndex } from '../../hooks/useIndex'

const MAX_SCORE = 1000

const FAIXAS = [
  { label: '300–499', name: 'iniciante' },
  { label: '500–699', name: 'básico' },
  { label: '700–849', name: 'forte' },
  { label: '850+', name: 'elite' },
]

// Threshold para atingir a próxima faixa (undefined = já está na elite)
const FAIXA_NEXT_THRESHOLD = [500, 700, 850, undefined] as const

const SUBJECT_COLORS = ['#531A61', '#840033', '#2a0d33', '#1A4A61', '#614A1A']

function getFaixaIndex(score: number): number {
  if (score < 500) return 0
  if (score < 700) return 1
  if (score < 850) return 2
  return 3
}

function SparkLine({ values }: { values: number[] }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const w = 240
  const h = 60
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / (max - min || 1)) * h
    return `${x},${y}`
  })
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p}`).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="spark-line" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#531A61" />
          <stop offset="100%" stopColor="#840033" />
        </linearGradient>
      </defs>
      <path d={pathD} stroke="url(#spark-line)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => {
        const x = (i / (values.length - 1)) * w
        const y = h - ((v - min) / (max - min || 1)) * h
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i === values.length - 1 ? 4 : 2.5}
            fill={i === values.length - 1 ? '#FFDC5C' : '#531A61'}
          />
        )
      })}
    </svg>
  )
}

function BigGauge({ score }: { score: number }) {
  const cx = 170
  const cy = 165
  const r = 130
  const pct = (score - 300) / 700
  const arcLength = Math.PI * r
  const filled = arcLength * Math.max(0, Math.min(1, pct))

  const needleAngle = Math.PI - pct * Math.PI
  const nx = cx + r * Math.cos(needleAngle)
  const ny = cy - r * Math.sin(needleAngle)

  const ticks = [0, 0.25, 0.5, 0.75, 1]
  const tickLabels = ['300', '475', '650', '825', '1000']

  return (
    <svg width={340} height={210} viewBox="0 0 340 210" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#531A61" />
          <stop offset="60%" stopColor="#840033" />
          <stop offset="100%" stopColor="#4a001c" />
        </linearGradient>
      </defs>

      {/* Track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        stroke="rgba(255,255,255,.12)"
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
      />

      {/* Filled arc */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        stroke="url(#gauge-grad)"
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${arcLength}`}
      />

      {/* Needle dot */}
      <circle cx={nx} cy={ny} r={8} fill="#FFDC5C" />
      <circle cx={nx} cy={ny} r={4} fill="#2a0d33" />

      {/* Tick marks + labels — cor escura para contraste sobre fundo amarelo/creme */}
      {ticks.map((t, i) => {
        const a = Math.PI - t * Math.PI
        const tx = cx + (r + 22) * Math.cos(a)
        const ty = cy - (r + 22) * Math.sin(a)
        const ix = cx + (r - 10) * Math.cos(a)
        const iy = cy - (r - 10) * Math.sin(a)
        const ox = cx + (r + 10) * Math.cos(a)
        const oy = cy - (r + 10) * Math.sin(a)
        return (
          <g key={i}>
            <line x1={ix} y1={iy} x2={ox} y2={oy} stroke="rgba(26,10,31,.3)" strokeWidth="1.5" />
            <text
              x={tx}
              y={ty}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fill="rgba(26,10,31,.65)"
              fontFamily="'Unbounded', sans-serif"
            >
              {tickLabels[i]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function IndicePage() {
  const user = useAuthStore((s) => s.user)
  // Usa o primeiro vestibular matriculado. Suporte a múltiplas matrículas exigiria um seletor.
  const firstVestibularSlug = useAuthStore((s) => s.firstVestibularSlug)
  const { data } = useIndex(firstVestibularSlug ?? '')

  const score = data?.score ?? 300
  const delta7d = data?.delta7d ?? 0
  const historyValues = data?.history.map((h) => h.score) ?? []
  const historyMonths = data?.history.map((h) => h.month) ?? []
  const subjects = (data?.subjectBreakdown ?? []).map((s, i) => ({
    name: s.subjectName,
    score: s.score,
    delta: s.delta,
    color: SUBJECT_COLORS[i % SUBJECT_COLORS.length] ?? '#531A61',
  }))

  const faixaIdx = getFaixaIndex(score)
  const currentFaixa = FAIXAS[faixaIdx]
  const nextFaixa = faixaIdx < FAIXAS.length - 1 ? FAIXAS[faixaIdx + 1] : null
  const nextThreshold = FAIXA_NEXT_THRESHOLD[faixaIdx]
  const ptsToNext = nextThreshold !== undefined ? nextThreshold - score : null

  const percentile = data?.percentile ?? null
  const topPercent = percentile !== null ? 100 - percentile : null

  const faixaDescText = nextFaixa && ptsToNext !== null
    ? `Você está na faixa ${currentFaixa?.name ?? ''}. Mantenha o ritmo e alcance a faixa ${nextFaixa.name} com mais ${ptsToNext} pontos.`
    : `Você está na faixa Elite. Parabéns pelo desempenho máximo!`

  return (
    <AppLayout>
      <div style={{ fontFamily: "'Questrial', Arial, sans-serif", background: 'var(--k-creme)', minHeight: '100%' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 40px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                fontFamily: "'Unbounded', sans-serif",
                fontWeight: 500,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                color: 'var(--k-tinta-3)',
                marginBottom: 4,
              }}
            >
              seu perfil de aprovação
            </div>
            <h1
              style={{
                fontFamily: "'Unbounded', sans-serif",
                fontWeight: 700,
                fontSize: 26,
                color: 'var(--k-tinta)',
                letterSpacing: '-0.04em',
                margin: 0,
              }}
            >
              Índice Kuaa
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="k-pill ghost">ENEM 2025</span>
            <span className="k-pill ghost">Fuvest</span>
            <Avatar size={38} name={user?.name ?? 'K'} hue={0} ring />
          </div>
        </div>

        {/* Hero amarelo */}
        <div style={{ padding: '0 40px' }}>
          <div
            style={{
              background: 'var(--k-amarelo)',
              borderRadius: 28,
              padding: '40px 48px',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 32,
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            {/* Left */}
            <div>
              <span className="k-pill wine" style={{ marginBottom: 20, display: 'inline-flex' }}>
                {topPercent !== null ? `Top ${topPercent}% nacional` : 'Coletando dados'}
              </span>

              <div
                style={{
                  fontFamily: "'Unbounded', sans-serif",
                  fontWeight: 700,
                  fontSize: 148,
                  color: 'var(--k-roxo-deep)',
                  letterSpacing: '-0.045em',
                  lineHeight: 0.88,
                  margin: '16px 0 8px',
                }}
              >
                {score}
              </div>

              <div style={{ fontSize: 14, color: 'var(--k-tinta-2)', marginBottom: 20 }}>
                de {MAX_SCORE}
                {ptsToNext !== null ? ` · próxima faixa em ${ptsToNext} pts` : ' · faixa máxima atingida'}
              </div>

              {/* Delta 7 dias */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(26,10,31,.1)',
                  borderRadius: 999,
                  padding: '8px 16px',
                  marginBottom: 16,
                }}
              >
                <KuaaIcon name="arrowUp" size={14} color="var(--k-vinho)" />
                <span
                  style={{
                    fontFamily: "'Unbounded', sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    color: 'var(--k-vinho)',
                  }}
                >
                  {delta7d >= 0 ? '+' : ''}{delta7d} pts em 7 dias
                </span>
              </div>

              <p style={{ fontSize: 13, color: 'var(--k-tinta-2)', maxWidth: 360 }}>
                {faixaDescText}
              </p>

              {/* Faixas */}
              <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
                {FAIXAS.map((f, i) => (
                  <div
                    key={f.name}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 10,
                      background: i === faixaIdx ? 'var(--k-roxo-deep)' : 'rgba(26,10,31,.08)',
                      color: i === faixaIdx ? '#fff' : 'var(--k-tinta-2)',
                      fontSize: 11,
                      fontFamily: "'Unbounded', sans-serif",
                      fontWeight: i === faixaIdx ? 700 : 400,
                    }}
                  >
                    <div style={{ letterSpacing: '.1em', opacity: 0.7, fontSize: 9 }}>
                      {f.label}
                    </div>
                    <div style={{ textTransform: 'capitalize', marginTop: 2 }}>{f.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: BigGauge */}
            <div style={{ flexShrink: 0 }}>
              <div
                style={{
                  background: 'rgba(26,10,31,.08)',
                  borderRadius: 20,
                  padding: '16px',
                  display: 'inline-block',
                }}
              >
                <BigGauge score={score} />
              </div>
            </div>
          </div>

          {/* Bottom dark breakdown */}
          <div
            style={{
              background: 'var(--k-roxo-deep)',
              borderRadius: 24,
              padding: '32px 36px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: 24,
              marginBottom: 40,
            }}
          >
            {/* Histórico card */}
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontFamily: "'Unbounded', sans-serif",
                  fontWeight: 500,
                  letterSpacing: '.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.45)',
                  marginBottom: 16,
                }}
              >
                histórico
              </div>
              {historyValues.length >= 2
                ? <SparkLine values={historyValues} />
                : <p style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', lineHeight: 1.5 }}>Finalize pelo menos 2 sessões para ver o histórico.</p>
              }
              {historyMonths.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  {historyMonths.map((m, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 9,
                        color: i === historyMonths.length - 1 ? 'var(--k-amarelo)' : 'rgba(255,255,255,.3)',
                        fontFamily: "'Unbounded', sans-serif",
                      }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Subject breakdown cards */}
            {subjects.length > 0
              ? subjects.map((s) => (
                  <div key={s.name}>
                    <div
                      style={{
                        fontSize: 10,
                        fontFamily: "'Unbounded', sans-serif",
                        fontWeight: 500,
                        letterSpacing: '.2em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,.45)',
                        marginBottom: 16,
                      }}
                    >
                      {s.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Unbounded', sans-serif",
                        fontWeight: 700,
                        fontSize: 52,
                        color: '#fff',
                        letterSpacing: '-0.04em',
                        lineHeight: 0.92,
                        marginBottom: 8,
                      }}
                    >
                      {s.score}
                    </div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'rgba(255,255,255,.08)',
                        borderRadius: 999,
                        padding: '4px 10px',
                      }}
                    >
                      <KuaaIcon name="arrowUp" size={11} color="#4ade80" />
                      <span
                        style={{
                          fontSize: 12,
                          color: '#4ade80',
                          fontFamily: "'Unbounded', sans-serif",
                          fontWeight: 600,
                        }}
                      >
                        {s.delta >= 0 ? '+' : ''}{s.delta}
                      </span>
                    </div>
                  </div>
                ))
              : (
                <div style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center' }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', lineHeight: 1.5 }}>
                    Responda questões para ver o breakdown por matéria.
                  </p>
                </div>
              )
            }
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
