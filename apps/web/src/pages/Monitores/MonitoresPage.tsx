import { useState } from 'react'
import { useAuthStore } from '../../stores/auth.store'
import KuaaIcon from '../../components/ui/KuaaIcon'
import AsaGlyph from '../../components/ui/AsaGlyph'
import Avatar from '../../components/ui/Avatar'

type SidebarIcon = 'home' | 'book' | 'chart' | 'headset' | 'chat' | 'gear'

const SIDEBAR_ICONS: { icon: SidebarIcon; active?: boolean }[] = [
  { icon: 'home' },
  { icon: 'book' },
  { icon: 'chart' },
  { icon: 'headset', active: true },
  { icon: 'chat' },
]

interface Monitor {
  id: number
  name: string
  subject: string
  rating: number
  sessions: number
  hue: number
  gradient?: string
}

const MONITORS: Monitor[] = [
  { id: 1, name: 'Prof. Helena Vaz', subject: 'Redação', rating: 4.9, sessions: 312, hue: 2, gradient: 'linear-gradient(135deg,#531A61,#840033)' },
  { id: 2, name: 'Prof. Carlos Melo', subject: 'Matemática', rating: 4.8, sessions: 248, hue: 1, gradient: 'linear-gradient(135deg,#840033,#4a001c)' },
  { id: 3, name: 'Prof. Ana Souza', subject: 'Biologia', rating: 4.7, sessions: 184, hue: 0 },
  { id: 4, name: 'Prof. Bruno Lima', subject: 'Física', rating: 4.6, sessions: 156, hue: 3 },
  { id: 5, name: 'Prof. Letícia Reis', subject: 'Química', rating: 4.5, sessions: 132, hue: 4 },
  { id: 6, name: 'Prof. Diego Faria', subject: 'História', rating: 4.4, sessions: 118, hue: 5 },
]

const DAYS_OF_WEEK = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const TIME_SLOTS = ['09:00', '11:00', '14:00', '16:30']
const FILTERS = ['Todos', 'Redação', 'Exatas', 'Ciências', 'Humanas', 'Linguagens']

const HOT_SUBJECTS = [
  { name: 'Redação', count: 312 },
  { name: 'Matemática', count: 248 },
  { name: 'Biologia', count: 184 },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <KuaaIcon
          key={i}
          name="star"
          size={11}
          color={i <= Math.round(rating) ? '#FFDC5C' : 'rgba(255,255,255,.2)'}
        />
      ))}
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginLeft: 3 }}>{rating}</span>
    </div>
  )
}

export default function MonitoresPage() {
  const user = useAuthStore((s) => s.user)
  const [selectedDay, setSelectedDay] = useState(2)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedMonitor, setSelectedMonitor] = useState<Monitor>(MONITORS[0])
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [activeTab, setActiveTab] = useState('Monitores')
  const [sessionType, setSessionType] = useState<'individual' | 'grupo'>('individual')

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#0d0612',
        fontFamily: "'Questrial', Arial, sans-serif",
        color: '#fff',
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 80,
          background: '#1a0a1f',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 20,
          paddingBottom: 20,
          gap: 4,
          flexShrink: 0,
        }}
      >
        {/* Logo icon */}
        <div
          style={{
            width: 44,
            height: 44,
            background: '#FFDC5C',
            borderRadius: 14,
            display: 'grid',
            placeItems: 'center',
            marginBottom: 24,
          }}
        >
          <AsaGlyph size={28} />
        </div>

        {SIDEBAR_ICONS.map(({ icon, active }) => (
          <div
            key={icon}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              display: 'grid',
              placeItems: 'center',
              background: active ? 'rgba(255,220,92,.12)' : 'transparent',
              cursor: 'pointer',
            }}
          >
            <KuaaIcon
              name={icon}
              size={20}
              color={active ? '#FFDC5C' : 'rgba(255,255,255,.35)'}
            />
          </div>
        ))}

        <div style={{ flex: 1 }} />
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
          }}
        >
          <KuaaIcon name="gear" size={20} color="rgba(255,255,255,.35)" />
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minWidth: 0 }}>
        {/* Topbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '20px 32px',
            borderBottom: '1px solid rgba(255,255,255,.06)',
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {['Monitores', 'Em alta', 'Minha agenda'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === tab ? 'rgba(255,255,255,.1)' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'rgba(255,255,255,.4)',
                  fontFamily: "'Unbounded', sans-serif",
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(255,255,255,.06)',
              borderRadius: 12,
              padding: '10px 16px',
            }}
          >
            <KuaaIcon name="search" size={16} color="rgba(255,255,255,.4)" />
            <input
              placeholder="Buscar monitores, matérias..."
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: 14,
                flex: 1,
                fontFamily: "'Questrial', sans-serif",
              }}
            />
          </div>

          <button
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,.1)',
              background: 'transparent',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
          >
            <KuaaIcon name="bell" size={18} color="rgba(255,255,255,.6)" />
          </button>

          <Avatar size={36} name={user?.name ?? 'K'} hue={0} ring />
        </div>

        {/* Hero row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 16,
            padding: '24px 32px 0',
          }}
        >
          {/* Featured card */}
          <div
            style={{
              background: 'linear-gradient(135deg,#531A61 0%,#840033 70%,#4a001c 100%)',
              borderRadius: 20,
              padding: '32px 36px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 200,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginBottom: 8 }}>
                Em destaque · Monitoria gratuita
              </div>
              <h2
                style={{
                  fontFamily: "'Unbounded', sans-serif",
                  fontWeight: 700,
                  fontSize: 22,
                  color: '#fff',
                  letterSpacing: '-0.03em',
                  margin: '0 0 8px',
                  maxWidth: 380,
                }}
              >
                Sua próxima redação com a prof. Helena.
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', margin: 0 }}>
                prof. Helena · Redação · nota média dos alunos: 860
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
              {/* Avatar cluster */}
              <div style={{ display: 'flex' }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      marginLeft: i === 0 ? 0 : -10,
                      border: '2px solid #531A61',
                      borderRadius: '50%',
                    }}
                  >
                    <Avatar size={30} name={['Ana', 'Bia', 'Car'][i]} hue={i} />
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>
                +312 agendamentos
              </span>

              <button
                onClick={() => setSelectedMonitor(MONITORS[0])}
                style={{
                  marginLeft: 'auto',
                  background: '#FFDC5C',
                  color: '#2a0d33',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 22px',
                  fontFamily: "'Unbounded', sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  letterSpacing: '.05em',
                }}
              >
                agendar monitoria →
              </button>
            </div>
          </div>

          {/* Stat card */}
          <div
            style={{
              background: '#1a0a1f',
              borderRadius: 20,
              padding: '28px 32px',
              minWidth: 260,
            }}
          >
            {/* Studying ring */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 12px' }}>
                <svg width={100} height={100} viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#ring-grad)"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 40 * 0.73} ${2 * Math.PI * 40 * 0.27}`}
                    strokeDashoffset={2 * Math.PI * 40 * 0.25}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                  <defs>
                    <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
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
                      fontSize: 18,
                      color: '#fff',
                      letterSpacing: '-0.04em',
                    }}
                  >
                    1.284
                  </span>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,.4)', textAlign: 'center' }}>
                    estudando agora
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: 10,
                fontFamily: "'Unbounded', sans-serif",
                fontWeight: 500,
                letterSpacing: '.2em',
                color: 'rgba(255,255,255,.4)',
                marginBottom: 10,
                textTransform: 'uppercase',
              }}
            >
              mais procuradas
            </div>
            {HOT_SUBJECTS.map((s) => (
              <div
                key={s.name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(255,255,255,.06)',
                }}
              >
                <span style={{ fontSize: 13, color: '#fff' }}>{s.name}</span>
                <span
                  style={{
                    fontFamily: "'Unbounded', sans-serif",
                    fontWeight: 600,
                    fontSize: 12,
                    color: '#FFDC5C',
                  }}
                >
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter pills */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '20px 32px',
            flexWrap: 'wrap',
          }}
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: '8px 18px',
                borderRadius: 999,
                border: '1px solid',
                borderColor: activeFilter === f ? '#FFDC5C' : 'rgba(255,255,255,.12)',
                background: activeFilter === f ? 'rgba(255,220,92,.12)' : 'transparent',
                color: activeFilter === f ? '#FFDC5C' : 'rgba(255,255,255,.5)',
                fontFamily: "'Unbounded', sans-serif",
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Monitor grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            padding: '0 32px 32px',
          }}
        >
          {MONITORS.map((monitor) => (
            <div
              key={monitor.id}
              onClick={() => setSelectedMonitor(monitor)}
              style={{
                background: monitor.gradient ?? '#1a0a1f',
                borderRadius: 18,
                padding: '24px',
                cursor: 'pointer',
                border: selectedMonitor.id === monitor.id ? '2px solid #FFDC5C' : '2px solid transparent',
                transition: 'border-color .15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Avatar size={44} name={monitor.name} hue={monitor.hue} />
                <div>
                  <div
                    style={{
                      fontFamily: "'Unbounded', sans-serif",
                      fontWeight: 600,
                      fontSize: 13,
                      color: '#fff',
                      marginBottom: 2,
                    }}
                  >
                    {monitor.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}>{monitor.subject}</div>
                </div>
              </div>

              <StarRating rating={monitor.rating} />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 16,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'rgba(255,255,255,.1)',
                    borderRadius: 999,
                    padding: '4px 12px',
                    fontSize: 11,
                    color: '#4ade80',
                    fontFamily: "'Unbounded', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Gratuito
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedMonitor(monitor)
                  }}
                  style={{
                    background: 'rgba(255,255,255,.12)',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    color: '#fff',
                    fontFamily: "'Unbounded', sans-serif",
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    letterSpacing: '.05em',
                  }}
                >
                  agendar →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking panel */}
      <div
        style={{
          width: 380,
          background: '#1a0a1f',
          borderLeft: '1px solid rgba(255,255,255,.06)',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 24px',
          flexShrink: 0,
          overflowY: 'auto',
        }}
      >
        {/* Monitor info */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 10,
              fontFamily: "'Unbounded', sans-serif",
              fontWeight: 500,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.4)',
              marginBottom: 14,
            }}
          >
            agendar monitoria
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar size={48} name={selectedMonitor.name} hue={selectedMonitor.hue} />
            <div>
              <div
                style={{
                  fontFamily: "'Unbounded', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  color: '#fff',
                  marginBottom: 2,
                }}
              >
                {selectedMonitor.name}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
                {selectedMonitor.subject}
              </div>
              <StarRating rating={selectedMonitor.rating} />
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,.06)', marginBottom: 24 }} />

        {/* Day picker */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "'Unbounded', sans-serif",
              fontWeight: 500,
              color: 'rgba(255,255,255,.5)',
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            dia
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {DAYS_OF_WEEK.map((day, i) => (
              <button
                key={day}
                onClick={() => setSelectedDay(i)}
                style={{
                  flex: 1,
                  padding: '10px 4px',
                  borderRadius: 10,
                  border: '1px solid',
                  borderColor: selectedDay === i ? '#FFDC5C' : 'rgba(255,255,255,.1)',
                  background: selectedDay === i ? 'rgba(255,220,92,.12)' : 'transparent',
                  color: selectedDay === i ? '#FFDC5C' : 'rgba(255,255,255,.4)',
                  fontSize: 10,
                  fontFamily: "'Unbounded', sans-serif",
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Time slots */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "'Unbounded', sans-serif",
              fontWeight: 500,
              color: 'rgba(255,255,255,.5)',
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            horário
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {TIME_SLOTS.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTime(t)}
                style={{
                  padding: '12px',
                  borderRadius: 10,
                  border: '1px solid',
                  borderColor: selectedTime === t ? '#FFDC5C' : 'rgba(255,255,255,.1)',
                  background: selectedTime === t ? 'rgba(255,220,92,.12)' : 'transparent',
                  color: selectedTime === t ? '#FFDC5C' : '#fff',
                  fontFamily: "'Unbounded', sans-serif",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Session type */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "'Unbounded', sans-serif",
              fontWeight: 500,
              color: 'rgba(255,255,255,.5)',
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            tipo de sessão
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['individual', 'grupo'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSessionType(type)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: '1px solid',
                  borderColor: sessionType === type ? '#531A61' : 'rgba(255,255,255,.1)',
                  background: sessionType === type ? '#531A61' : 'transparent',
                  color: '#fff',
                  fontFamily: "'Unbounded', sans-serif",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  letterSpacing: '.08em',
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 14,
            border: 'none',
            background: '#FFDC5C',
            color: '#2a0d33',
            fontFamily: "'Unbounded', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            letterSpacing: '.05em',
            marginTop: 'auto',
          }}
        >
          confirmar monitoria →
        </button>
      </div>
    </div>
  )
}
