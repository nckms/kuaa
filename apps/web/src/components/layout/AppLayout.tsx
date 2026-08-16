import { Link, useLocation, useNavigate } from 'react-router-dom'
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
  { label: 'Ranking',    icon: 'bi-trophy-fill',     match: '/ranking'   },
  { label: 'Perfil',     icon: 'bi-person-fill',     match: '/perfil'    },
]

export default function AppLayout({ children, rightSidebar }: Props) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout, firstVestibularSlug } = useAuthStore()
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
                padding: '11px 14px', borderRadius: 14,
                background: isActive
                  ? 'linear-gradient(135deg, #b347d9 0%, rgba(179,71,217,.55) 100%)'
                  : 'transparent',
                boxShadow: isActive
                  ? '0 6px 18px -6px rgba(179,71,217,.55)'
                  : 'none',
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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg)' }}>

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
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="app-main-content">
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

      {/* Bottom nav — mobile, floating pill */}
      <nav
        className="mobile-bottom-nav fixed lg:hidden"
        style={{
          bottom: 14, left: 14, right: 14,
          background: '#1a0826',
          borderRadius: 24,
          boxShadow: '0 10px 15px -3px rgba(83,26,97,.12), 0 30px 50px -12px rgba(83,26,97,.22)',
          zIndex: 20,
          display: 'flex',
          padding: '8px 6px',
        }}
      >
        {resolvedNav.map((item) => {
          const isActive = pathname.startsWith(item.match)
          return (
            <Link
              key={item.href}
              to={item.href}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', padding: '6px 8px', gap: 3,
                textDecoration: 'none', borderRadius: 16,
                background: isActive
                  ? 'linear-gradient(135deg, #b347d9, rgba(179,71,217,.65))'
                  : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,.48)',
                fontSize: 10.5,
                fontFamily: 'Inter, Arial, sans-serif',
                fontWeight: isActive ? 600 : 500,
                transition: 'all .15s',
              }}
            >
              <i className={`bi ${item.icon}`} style={{ fontSize: 20 }} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <style>{`
        @media (min-width: 1024px) {
          .mobile-bottom-nav {
            display: none !important;
          }
        }

        @media (max-width: 1023px) {
          .app-main-content {
            margin-bottom: 104px;
            padding-bottom: 24px;
            scroll-padding-bottom: 124px;
          }
        }

        @media (max-width: 380px) {
          .mobile-bottom-nav {
            left: 8px !important;
            right: 8px !important;
          }

          .mobile-bottom-nav a {
            padding-left: 4px !important;
            padding-right: 4px !important;
          }
        }
      `}</style>
    </div>
  )
}
