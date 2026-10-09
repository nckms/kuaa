import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { useAuthStore } from '../../stores/auth.store'
import KuaaMascotLogo from '../ui/KuaaMascotLogo'

interface Props {
  children: React.ReactNode
  rightSidebar?: React.ReactNode
}

const navItems = [
  { label: 'Trilha',     icon: 'bi-map',            match: '/trilha'    },
  { label: 'Dashboard',  icon: 'bi-house-fill',      match: '/dashboard' },
  { label: 'Índice',     icon: 'bi-speedometer2',    match: '/indice'    },
  { label: 'Simulado',  icon: 'bi-journal-text',    match: '/simulado'  },
  { label: 'Ranking',   icon: 'bi-trophy-fill',     match: '/ranking'   },
  { label: 'Sabiá',    icon: 'bi-chat-dots-fill',  match: '/sabia'     },
  { label: 'Perfil',     icon: 'bi-person-fill',     match: '/perfil'    },
  { label: 'Configurações', icon: 'bi-gear-fill', match: '/configuracoes' },
]

export default function AppLayout({ children, rightSidebar }: Props) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout, firstVestibularSlug } = useAuthStore()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreButton = useRef<HTMLButtonElement>(null)
  const previousActive = useRef(user?.activeVestibularId)
  useEffect(() => { setMoreOpen(false) }, [pathname])
  useEffect(() => {
    if (previousActive.current !== user?.activeVestibularId && pathname.startsWith('/trilha') && firstVestibularSlug) {
      navigate(`/trilha/${firstVestibularSlug}`, { replace: true })
    }
    previousActive.current = user?.activeVestibularId
  }, [user?.activeVestibularId, firstVestibularSlug, pathname, navigate])
  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const trailHref = firstVestibularSlug ? `/trilha/${firstVestibularSlug}` : '/trilha'

  const resolvedNav = navItems.map((item) => ({
    ...item,
    href: item.match === '/trilha' ? trailHref : item.match,
  }))

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 14px', gap: 2 }}>

      {/* Brand */}
      <Link
        to={trailHref}
        style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', padding: '6px 10px', marginBottom: 22 }}
      >
        <KuaaMascotLogo size={40} />
        <div>
          <span style={{ fontFamily: "'Unbounded', cursive", fontWeight: 700, fontSize: 17, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
            kuaa<span style={{ color: '#FFDC5C' }}>.</span>
          </span>
          <span style={{ display: 'block', fontSize: 9, color: 'rgba(255,255,255,.4)', letterSpacing: '.18em', textTransform: 'uppercase', fontFamily: 'Inter, Arial, sans-serif', marginTop: 2 }}>
            plataforma
          </span>
        </div>
      </Link>

      {/* Nav section label */}
      <div style={{ fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)', padding: '0 10px 6px', fontWeight: 600, fontFamily: 'Inter, Arial, sans-serif' }}>
        Navegação
      </div>

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {resolvedNav.map((item) => {
          const isActive = pathname.startsWith(item.match)
          return (
            <Link
              key={item.href}
              to={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 6,
                background: isActive
                  ? 'rgba(255,255,255,.12)'
                  : 'transparent',
                boxShadow: 'none',
                color: isActive ? '#fff' : 'rgba(255,255,255,.58)',
                textDecoration: 'none',
                fontSize: 14,
                fontFamily: 'Inter, Arial, sans-serif',
                fontWeight: isActive ? 600 : 500,
                transition: 'all .15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.06)'
                  ;(e.currentTarget as HTMLElement).style.color = '#fff'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.58)'
                }
              }}
            >
              <i className={`bi ${item.icon}`} style={{ fontSize: 18, width: 20, textAlign: 'center' }} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {user && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'conic-gradient(from 180deg, #b347d9, #FFDC5C, #840033, #b347d9)',
              padding: 2, flexShrink: 0,
            }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#531A61', display: 'grid', placeItems: 'center' }}>
                <span style={{ fontFamily: "'Unbounded', cursive", fontWeight: 700, fontSize: 12, color: '#fff' }}>
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0, fontFamily: 'Inter, Arial, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
              <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 11, margin: 0, fontFamily: 'Inter, Arial, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,.14)',
              color: 'rgba(255,255,255,.5)', fontSize: 12, borderRadius: 999,
              padding: '8px 16px', cursor: 'pointer',
              fontFamily: 'Inter, Arial, sans-serif', width: '100%',
              transition: 'all .15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,59,140,.5)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#ff3b8c'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,.14)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,.5)'
            }}
          >
            <i className="bi bi-box-arrow-right" style={{ marginRight: 6 }} />
            Sair
          </button>
        </div>
      )}
    </div>
  )

  return (
    <MotionConfig reducedMotion={user?.preferences?.reducedMotion ? 'always' : 'user'}>
    <div data-reduced-motion={user?.preferences?.reducedMotion || undefined} data-high-contrast={user?.preferences?.highContrast || undefined} style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg)' }}>

      {/* Sidebar — desktop */}
      <aside
        className="hidden lg:block"
        style={{
          width: 240, flexShrink: 0, overflowY: 'auto',
          background: 'var(--dark-deeper, #1a0826)',
          borderRight: '1px solid rgba(255,255,255,.04)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="app-main-content">
        {children}
      </main>

      {/* Right sidebar — desktop */}
      {rightSidebar && (
        <aside
          className="hidden lg:block"
          style={{
            width: 300, flexShrink: 0, overflowY: 'auto',
            background: 'var(--surface)',
            borderLeft: '1px solid var(--line-soft)',
          }}
        >
          {rightSidebar}
        </aside>
      )}

      {/* Bottom nav — mobile */}
      <nav
        aria-label="Navegação principal"
        className="mobile-bottom-nav fixed lg:hidden"
        style={{
          bottom: 0, left: 0, right: 0,
          background: '#fff',
          borderTop: '1px solid var(--line-soft)',
          zIndex: 20,
          display: 'grid',
          padding: '4px 4px calc(4px + env(safe-area-inset-bottom))',
        }}
      >
        {resolvedNav.slice(0, 4).map((item) => {
          const isActive = pathname.startsWith(item.match)
          return (
            <Link
              key={item.href}
              to={item.href}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', padding: '4px 2px', gap: 2,
                textDecoration: 'none', borderRadius: 0,
                background: 'transparent',
                color: isActive ? '#531A61' : '#667085',
                fontSize: 10.5,
                fontFamily: 'Inter, Arial, sans-serif',
                fontWeight: isActive ? 600 : 500,
                transition: 'all .15s',
              }}
            >
              <i className={`bi ${item.icon}`} style={{ fontSize: 20 }} />
              <span>{item.label === 'Dashboard' ? 'Painel' : item.label}</span>
            </Link>
          )
        })}
        <button ref={moreButton} aria-expanded={moreOpen} aria-controls="mobile-more-nav" onClick={() => setMoreOpen(!moreOpen)} style={{ color: resolvedNav.slice(4).some((item) => pathname.startsWith(item.match)) ? '#531A61' : '#667085', background: 'transparent', border: 0, display: 'grid', justifyItems: 'center', alignContent: 'center', gap: 2, fontSize: 10.5, minWidth: 0, minHeight: 52 }}>
          <i className="bi bi-three-dots" aria-hidden="true" style={{ fontSize: 20 }} />Mais
        </button>
        {moreOpen && (
          <div id="mobile-more-nav" onKeyDown={(event) => { if (event.key === 'Escape') { setMoreOpen(false); moreButton.current?.focus() } }} style={{ position: 'absolute', bottom: 'calc(100% + 1px)', right: 0, width: 'min(280px, 100%)', background: '#fff', padding: 8, border: '1px solid var(--line-soft)', borderRadius: 6, boxShadow: '0 8px 20px #0002' }}>
            {resolvedNav.slice(4).map((item) => <Link key={item.href} to={item.href} aria-current={pathname.startsWith(item.match) ? 'page' : undefined} style={{ display: 'flex', gap: 12, padding: 14, color: '#2a0d33', textDecoration: 'none' }}><i className={`bi ${item.icon}`} aria-hidden="true" />{item.label}</Link>)}
          </div>
        )}
      </nav>

      <style>{`
        @media (min-width: 1024px) {
          .mobile-bottom-nav {
            display: none !important;
          }
        }

        @media (max-width: 1023px) {
          .mobile-bottom-nav {
            display: grid !important;
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }

          .mobile-bottom-nav > a {
            min-width: 0;
            min-height: 52px;
            font-size: 10px !important;
          }

          .app-main-content {
            margin-bottom: calc(64px + env(safe-area-inset-bottom));
            scroll-padding-bottom: calc(72px + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </div>
    </MotionConfig>
  )
}
