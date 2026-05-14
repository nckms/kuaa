import { useAuthStore } from '../../stores/auth.store'
import KuaaLogo from '../../components/ui/KuaaLogo'
import Avatar from '../../components/ui/Avatar'
import KuaaIcon from '../../components/ui/KuaaIcon'

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const FOCUS_MINUTES = [28, 45, 72, 52, 38, 20, 10]
const TODAY_IDX = 2

interface Trail {
  name: string
  subject: string
  progress: number
  xp: number
  color: string
}

const TRAILS: Trail[] = [
  { name: 'Matemática', subject: 'Álgebra e Funções', progress: 68, xp: 1240, color: '#531A61' },
  { name: 'Português', subject: 'Interpretação de Texto', progress: 82, xp: 1680, color: '#840033' },
  { name: 'Biologia', subject: 'Citologia e Genética', progress: 41, xp: 820, color: '#2a0d33' },
]

interface Slot {
  time: string
  subject: string
  topic: string
  now: boolean
}

const SCHEDULE: Slot[] = [
  { time: 'AGORA', subject: 'Redação', topic: 'Dissertação argumentativa', now: true },
  { time: '14:30', subject: 'Matemática', topic: 'Progressão Geométrica', now: false },
  { time: '16:00', subject: 'Biologia', topic: 'Ciclo celular', now: false },
  { time: '18:00', subject: 'História', topic: 'Era Vargas', now: false },
]

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const firstName = user?.name?.split(' ')[0] ?? 'Estudante'

  const maxFocus = Math.max(...FOCUS_MINUTES)

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--k-creme)',
        fontFamily: "'Questrial', Arial, sans-serif",
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          height: 68,
          background: '#fff',
          borderBottom: '1px solid var(--k-line)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <KuaaLogo size={36} />

        {/* Pill Nav */}
        <div style={{ display: 'flex', gap: 4 }}>
          {['Trilha', 'Índice', 'Monitores', 'Simulado'].map((label, i) => (
            <button
              key={label}
              style={{
                padding: '7px 18px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Unbounded', sans-serif",
                fontWeight: 500,
                fontSize: 11,
                letterSpacing: '.1em',
                textTransform: 'uppercase' as const,
                background: i === 0 ? 'var(--k-roxo-deep)' : 'transparent',
                color: i === 0 ? '#fff' : 'var(--k-tinta-3)',
                transition: 'background .15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* XP chip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--k-amarelo-soft)',
              borderRadius: 999,
              padding: '6px 14px',
            }}
          >
            <KuaaIcon name="bolt" size={14} color="#840033" />
            <span
              style={{
                fontFamily: "'Unbounded', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                color: 'var(--k-tinta)',
              }}
            >
              12.480
            </span>
            <span style={{ fontSize: 11, color: 'var(--k-tinta-3)' }}>XP</span>
          </div>

          {/* Bell */}
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '1px solid var(--k-line-2)',
              background: '#fff',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
          >
            <KuaaIcon name="bell" size={16} color="var(--k-tinta-2)" />
          </button>

          <Avatar size={36} name={user?.name ?? 'K'} hue={0} ring />
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '28px 32px',
          display: 'grid',
          gridTemplateColumns: '1.55fr 1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Hero card */}
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '28px 32px',
              boxShadow: 'var(--k-shadow-sm)',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 32,
              alignItems: 'center',
            }}
          >
            {/* Left: greeting */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span className="k-pill amber" style={{ fontSize: 10 }}>
                  <KuaaIcon name="flame" size={12} color="#840033" /> dia 24
                </span>
                <span style={{ fontSize: 13, color: 'var(--k-tinta-3)' }}>sequência ativa</span>
              </div>
              <h1
                style={{
                  fontFamily: "'Unbounded', sans-serif",
                  fontWeight: 700,
                  fontSize: 28,
                  color: 'var(--k-tinta)',
                  letterSpacing: '-0.04em',
                  margin: '0 0 6px',
                }}
              >
                Bom dia, {firstName}.
              </h1>
              <p style={{ color: 'var(--k-tinta-3)', fontSize: 14, margin: '0 0 20px' }}>
                Continue de onde parou — você está indo muito bem!
              </p>

              {/* Stats row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 16,
                }}
              >
                <KuaaIcon name="chart" size={15} color="#840033" />
                <span
                  style={{
                    fontFamily: "'Unbounded', sans-serif",
                    fontWeight: 700,
                    fontSize: 20,
                    color: 'var(--k-tinta)',
                    letterSpacing: '-0.04em',
                  }}
                >
                  12.480
                </span>
                <span style={{ fontSize: 13, color: 'var(--k-tinta-3)' }}>
                  questões no mês
                </span>
                <span
                  style={{
                    background: '#e8f5e9',
                    color: '#2e7d32',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontFamily: "'Unbounded', sans-serif",
                  }}
                >
                  ↑18%
                </span>
              </div>

              {/* Progress bar */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: 'var(--k-tinta-3)',
                    marginBottom: 6,
                  }}
                >
                  <span>Meta diária</span>
                  <span>
                    <strong style={{ color: 'var(--k-tinta)', fontFamily: "'Unbounded', sans-serif", fontSize: 12 }}>
                      83
                    </strong>
                    /100 questões
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    background: 'var(--k-line)',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: '83%',
                      height: '100%',
                      background: 'linear-gradient(90deg,#531A61,#840033)',
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right: edital circle */}
            <div style={{ textAlign: 'center', minWidth: 160 }}>
              {/* Ring */}
              <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 16px' }}>
                <svg width={140} height={140} viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="56" stroke="var(--k-line)" strokeWidth="10" fill="none" />
                  <circle
                    cx="70"
                    cy="70"
                    r="56"
                    stroke="url(#edital-grad)"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56 * 0.64} ${2 * Math.PI * 56 * 0.36}`}
                    strokeDashoffset={2 * Math.PI * 56 * 0.25}
                    strokeLinecap="round"
                    transform="rotate(-90 70 70)"
                  />
                  <defs>
                    <linearGradient id="edital-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FFDC5C" />
                      <stop offset="100%" stopColor="#840033" />
                    </linearGradient>
                  </defs>
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Unbounded', sans-serif",
                      fontWeight: 700,
                      fontSize: 32,
                      color: 'var(--k-tinta)',
                      letterSpacing: '-0.04em',
                      lineHeight: 1,
                    }}
                  >
                    64%
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--k-tinta-3)', marginTop: 4, textAlign: 'center', maxWidth: 80 }}>
                    do edital concluído
                  </span>
                </div>
              </div>

              {/* Sub-metrics */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <div
                  style={{
                    background: 'var(--k-creme)',
                    borderRadius: 12,
                    padding: '10px 14px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Unbounded', sans-serif",
                      fontWeight: 700,
                      fontSize: 18,
                      color: 'var(--k-tinta)',
                      letterSpacing: '-0.04em',
                    }}
                  >
                    24d
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--k-tinta-3)', marginTop: 2 }}>streak</div>
                </div>
                <div
                  style={{
                    background: 'var(--k-creme)',
                    borderRadius: 12,
                    padding: '10px 14px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Unbounded', sans-serif",
                      fontWeight: 700,
                      fontSize: 18,
                      color: 'var(--k-tinta)',
                      letterSpacing: '-0.04em',
                    }}
                  >
                    4h12
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--k-tinta-3)', marginTop: 2 }}>foco</div>
                </div>
              </div>
            </div>
          </div>

          {/* Focus chart */}
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '24px 28px',
              boxShadow: 'var(--k-shadow-sm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 20,
              }}
            >
              <div>
                <span style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--k-tinta-3)', fontFamily: "'Unbounded', sans-serif", fontWeight: 500 }}>
                  foco semanal
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span
                  style={{
                    fontFamily: "'Unbounded', sans-serif",
                    fontWeight: 700,
                    fontSize: 24,
                    color: 'var(--k-tinta)',
                    letterSpacing: '-0.04em',
                  }}
                >
                  4h 12
                </span>
                <span style={{ fontSize: 12, color: 'var(--k-tinta-3)' }}>esta semana</span>
              </div>
            </div>

            {/* Bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 80 }}>
              {DAYS.map((day, i) => {
                const pct = FOCUS_MINUTES[i] / maxFocus
                const isToday = i === TODAY_IDX
                return (
                  <div
                    key={day}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: 64 * pct,
                        borderRadius: '6px 6px 0 0',
                        background: isToday
                          ? 'linear-gradient(180deg,#840033,#531A61)'
                          : 'var(--k-line)',
                        minHeight: 4,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        color: isToday ? 'var(--k-vinho)' : 'var(--k-tinta-3)',
                        fontFamily: "'Unbounded', sans-serif",
                        fontWeight: isToday ? 700 : 400,
                      }}
                    >
                      {day}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Schedule */}
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '24px 28px',
              boxShadow: 'var(--k-shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <KuaaIcon name="calendar" size={16} color="var(--k-tinta-3)" />
              <span
                style={{
                  fontSize: 11,
                  letterSpacing: '.18em',
                  textTransform: 'uppercase',
                  color: 'var(--k-tinta-3)',
                  fontFamily: "'Unbounded', sans-serif",
                  fontWeight: 500,
                }}
              >
                agenda de hoje
              </span>
            </div>

            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
              {SCHEDULE.map((slot) => (
                <div
                  key={slot.time}
                  style={{
                    flexShrink: 0,
                    borderRadius: 16,
                    padding: '16px 20px',
                    background: slot.now ? 'var(--k-roxo-deep)' : 'var(--k-creme)',
                    border: slot.now ? 'none' : '1px solid var(--k-line)',
                    minWidth: 160,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: "'Unbounded', sans-serif",
                      fontWeight: 700,
                      letterSpacing: '.2em',
                      color: slot.now ? 'var(--k-amarelo)' : 'var(--k-tinta-3)',
                      marginBottom: 8,
                    }}
                  >
                    {slot.time}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: slot.now ? '#fff' : 'var(--k-tinta)',
                      marginBottom: 4,
                    }}
                  >
                    {slot.subject}
                  </div>
                  <div style={{ fontSize: 12, color: slot.now ? 'rgba(255,255,255,.6)' : 'var(--k-tinta-3)' }}>
                    {slot.topic}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Mini Índice */}
          <div
            style={{
              background: 'var(--k-roxo-deep)',
              borderRadius: 20,
              padding: '28px 28px 24px',
              boxShadow: 'var(--k-shadow-md)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontFamily: "'Unbounded', sans-serif",
                fontWeight: 500,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,.5)',
                marginBottom: 16,
              }}
            >
              índice kuaa
            </div>

            {/* Score + gauge */}
            <div style={{ position: 'relative', width: 200, margin: '0 auto' }}>
              <svg width={200} height={112} viewBox="0 0 200 112">
                {/* Track */}
                <path
                  d="M 20 110 A 80 80 0 0 1 180 110"
                  stroke="rgba(255,255,255,.1)"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Fill (832/1000 = 83.2%) */}
                <path
                  d="M 20 110 A 80 80 0 0 1 180 110"
                  stroke="url(#mini-gauge)"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.PI * 80 * 0.832} ${Math.PI * 80 * 0.168}`}
                />
                <defs>
                  <linearGradient id="mini-gauge" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#531A61" />
                    <stop offset="100%" stopColor="#840033" />
                  </linearGradient>
                </defs>
              </svg>
              <div
                style={{
                  position: 'absolute',
                  bottom: 4,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Unbounded', sans-serif",
                    fontWeight: 700,
                    fontSize: 64,
                    color: 'var(--k-amarelo)',
                    letterSpacing: '-0.045em',
                    lineHeight: 0.92,
                  }}
                >
                  832
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <span className="k-pill wine" style={{ fontSize: 10 }}>
                Top 12% nacional
              </span>
              <p
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,.5)',
                  marginTop: 10,
                  fontFamily: "'Questrial', sans-serif",
                }}
              >
                +24 pts esta semana
              </p>
            </div>
          </div>

          {/* Trilhas recomendadas */}
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '24px 24px',
              boxShadow: 'var(--k-shadow-sm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 18,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "'Unbounded', sans-serif",
                  fontWeight: 500,
                  letterSpacing: '.18em',
                  textTransform: 'uppercase',
                  color: 'var(--k-tinta-3)',
                }}
              >
                trilhas recomendadas
              </span>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: 'var(--k-vinho)',
                  fontFamily: "'Unbounded', sans-serif",
                  fontWeight: 500,
                }}
              >
                ver todas →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {TRAILS.map((trail) => (
                <div
                  key={trail.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    background: 'var(--k-creme)',
                    borderRadius: 14,
                  }}
                >
                  {/* Color dot */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: trail.color,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <KuaaIcon name="book" size={18} color="#fff" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Unbounded', sans-serif",
                          fontWeight: 600,
                          fontSize: 13,
                          color: 'var(--k-tinta)',
                        }}
                      >
                        {trail.name}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--k-tinta-3)',
                          fontFamily: "'Unbounded', sans-serif",
                        }}
                      >
                        {trail.progress}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: 'var(--k-line)',
                        borderRadius: 999,
                        overflow: 'hidden',
                        marginBottom: 4,
                      }}
                    >
                      <div
                        style={{
                          width: `${trail.progress}%`,
                          height: '100%',
                          background: trail.color,
                          borderRadius: 999,
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--k-tinta-3)' }}>
                      {trail.xp.toLocaleString('pt-BR')} XP · {trail.subject}
                    </div>
                  </div>

                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 16,
                      color: 'var(--k-tinta-3)',
                      padding: 4,
                    }}
                  >
                    →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
