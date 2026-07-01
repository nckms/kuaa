import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import KuaaMascotLogo from '../ui/KuaaMascotLogo'

interface Props {
  children: React.ReactNode
  rightSidebar?: React.ReactNode
}

const navItems = [
  { label: 'Trilha', icon: 'bi-map', match: '/trilha' },
  { label: 'Dashboard', icon: 'bi-house-fill', match: '/dashboard' },
  { label: 'Ranking', icon: 'bi-trophy-fill', match: '/ranking' },
  { label: 'Perfil', icon: 'bi-person-fill', match: '/perfil' },
]

export default function AppLayout({ children, rightSidebar }: Props) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout, firstVestibularSlug } = useAuthStore()
  const isTrailRoute = pathname.startsWith('/trilha')

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const trailHref = firstVestibularSlug ? `/trilha/${firstVestibularSlug}` : '/trilha'
  const resolvedNav = navItems.map((item) => ({
    ...item,
    href: item.match === '/trilha' ? trailHref : item.match,
  }))

  const sidebarBg = isTrailRoute ? '#fff' : 'var(--dark-deeper, #1a0826)'
  const sidebarBorder = isTrailRoute ? '1px solid #dee2e6' : '1px solid rgba(255,255,255,.04)'
  const sidebarText = isTrailRoute ? '#1f2937' : '#fff'
  const sidebarMuted = isTrailRoute ? '#6b7280' : 'rgba(255,255,255,.42)'

  const SidebarContent = () => (
    <div className="d-flex flex-column h-100" style={{ padding: '22px 14px', gap: 2 }}>
      <Link
        to={trailHref}
        className="d-flex align-items-center gap-2 text-decoration-none"
        style={{ padding: '6px 10px', marginBottom: 22 }}
      >
        {isTrailRoute ? (
          <div className="d-grid bg-white border rounded-3 overflow-hidden flex-shrink-0" style={{ width: 38, height: 38, placeItems: 'center' }}>
            <KuaaMascotLogo size={36} />
          </div>
        ) : (
          <div
            className="d-grid rounded-3 flex-shrink-0"
            style={{
              width: 34,
              height: 34,
              placeItems: 'center',
              background: 'linear-gradient(135deg, #b347d9, #531A61)',
              boxShadow: '0 0 0 1px rgba(179,71,217,.4), 0 0 16px -4px rgba(179,71,217,.5)',
            }}
          >
            <svg width="18" height="16" viewBox="0 0 28 24" fill="none" aria-hidden="true">
              <path d="M2 20 C6 12 14 8 26 4 C20 10 18 16 20 22 C14 18 8 18 2 20Z" fill="#FFDC5C" opacity="0.95" />
              <path d="M2 20 C8 16 14 14 20 22 C14 22 8 22 2 20Z" fill="#FFDC5C" opacity="0.55" />
            </svg>
          </div>
        )}
        <div>
          <span style={{ fontFamily: "'Unbounded', cursive", fontWeight: 700, fontSize: 17, color: sidebarText, letterSpacing: '-0.04em', lineHeight: 1 }}>
            kuaa<span style={{ color: isTrailRoute ? '#840033' : '#FFDC5C' }}>.</span>
          </span>
          <span style={{ display: 'block', fontSize: 9, color: sidebarMuted, letterSpacing: '.18em', textTransform: 'uppercase', fontFamily: 'Inter, Arial, sans-serif', marginTop: 2 }}>
            {isTrailRoute ? 'trilha' : 'DS v2'}
          </span>
        </div>
      </Link>

      <div style={{ fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: sidebarMuted, padding: '0 10px 6px', fontWeight: 600, fontFamily: 'Inter, Arial, sans-serif' }}>
        Navegacao
      </div>

      <nav className="d-flex flex-column gap-1 flex-grow-1">
        {resolvedNav.map((item) => {
          const isActive = pathname.startsWith(item.match)
          const trailActive = isTrailRoute && isActive
          return (
            <Link
              key={item.href}
              to={item.href}
              className="app-sidebar-link d-flex align-items-center gap-3 text-decoration-none"
              style={{
                padding: '10px 14px',
                borderRadius: isTrailRoute ? 8 : 14,
                background: isActive
                  ? (isTrailRoute ? '#f3eaf7' : 'linear-gradient(135deg, #b347d9 0%, rgba(179,71,217,.55) 100%)')
                  : 'transparent',
                color: trailActive ? '#531A61' : isActive ? '#fff' : isTrailRoute ? '#4b5563' : 'rgba(255,255,255,.58)',
                fontSize: 14,
                fontFamily: 'Inter, Arial, sans-serif',
                fontWeight: isActive ? 650 : 500,
                boxShadow: isActive && !isTrailRoute ? '0 6px 18px -6px rgba(179,71,217,.55)' : 'none',
              }}
            >
              <i className={`bi ${item.icon}`} style={{ fontSize: 18, width: 20, textAlign: 'center' }} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {user && (
        <div style={{ borderTop: isTrailRoute ? '1px solid #e5e7eb' : '1px solid rgba(255,255,255,.07)', paddingTop: 16, marginTop: 8 }}>
          <div className="d-flex align-items-center gap-2 mb-3">
            <div className="rounded-circle d-grid flex-shrink-0" style={{ width: 34, height: 34, placeItems: 'center', backgroundColor: '#531A61', color: '#fff' }}>
              <span style={{ fontFamily: "'Unbounded', cursive", fontWeight: 700, fontSize: 12 }}>
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="overflow-hidden flex-grow-1">
              <p className="text-truncate mb-0" style={{ color: sidebarText, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, Arial, sans-serif' }}>{user.name}</p>
              <p className="text-truncate mb-0" style={{ color: sidebarMuted, fontSize: 11, fontFamily: 'Inter, Arial, sans-serif' }}>{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-sm rounded-pill w-100"
            style={{
              border: isTrailRoute ? '1px solid #d1d5db' : '1px solid rgba(255,255,255,.14)',
              color: isTrailRoute ? '#4b5563' : 'rgba(255,255,255,.58)',
              fontSize: 12,
              fontFamily: 'Inter, Arial, sans-serif',
            }}
          >
            <i className="bi bi-box-arrow-right me-1" />
            Sair
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: isTrailRoute ? '#f8f9fa' : 'var(--bg)' }}>
      <aside
        className="hidden lg:block"
        style={{
          width: 240,
          flexShrink: 0,
          overflowY: 'auto',
          background: sidebarBg,
          borderRight: sidebarBorder,
        }}
      >
        <SidebarContent />
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="app-main-content">
        {children}
      </main>

      {rightSidebar && (
        <aside
          className="hidden lg:block"
          style={{
            width: 300,
            flexShrink: 0,
            overflowY: 'auto',
            background: isTrailRoute ? '#f8f9fa' : 'var(--surface)',
            borderLeft: isTrailRoute ? '1px solid #dee2e6' : '1px solid var(--line-soft)',
          }}
        >
          {rightSidebar}
        </aside>
      )}

      <nav
        className="mobile-bottom-nav fixed lg:hidden"
        style={{
          bottom: isTrailRoute ? 0 : 14,
          left: isTrailRoute ? 0 : 14,
          right: isTrailRoute ? 0 : 14,
          background: isTrailRoute ? '#fff' : '#1a0826',
          borderRadius: isTrailRoute ? 0 : 24,
          borderTop: isTrailRoute ? '1px solid #dee2e6' : 'none',
          boxShadow: isTrailRoute ? '0 -8px 24px -22px rgba(0,0,0,.45)' : '0 10px 15px -3px rgba(83,26,97,.12), 0 30px 50px -12px rgba(83,26,97,.22)',
          zIndex: 20,
          display: 'flex',
          padding: isTrailRoute ? '6px 4px calc(6px + env(safe-area-inset-bottom))' : '8px 6px',
        }}
      >
        {resolvedNav.map((item) => {
          const isActive = pathname.startsWith(item.match)
          return (
            <Link
              key={item.href}
              to={item.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '6px 8px',
                gap: 3,
                textDecoration: 'none',
                borderRadius: isTrailRoute ? 8 : 16,
                background: isActive
                  ? (isTrailRoute ? 'transparent' : 'linear-gradient(135deg, #b347d9, rgba(179,71,217,.65))')
                  : 'transparent',
                color: isActive ? (isTrailRoute ? '#531A61' : '#fff') : (isTrailRoute ? '#6b7280' : 'rgba(255,255,255,.48)'),
                fontSize: 10.5,
                fontFamily: 'Inter, Arial, sans-serif',
                fontWeight: isActive ? 650 : 500,
              }}
            >
              <i className={`bi ${item.icon}`} style={{ fontSize: 20 }} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <style>{`
        .app-sidebar-link:hover {
          background: ${isTrailRoute ? '#f8f9fa' : 'rgba(255,255,255,.06)'} !important;
        }

        @media (min-width: 1024px) {
          .mobile-bottom-nav {
            display: none !important;
          }
        }

        @media (max-width: 1023px) {
          .app-main-content {
            margin-bottom: ${isTrailRoute ? '72px' : '104px'};
            padding-bottom: 24px;
            scroll-padding-bottom: ${isTrailRoute ? '96px' : '124px'};
          }
        }

        @media (max-width: 380px) {
          .mobile-bottom-nav {
            left: ${isTrailRoute ? '0' : '8px'} !important;
            right: ${isTrailRoute ? '0' : '8px'} !important;
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
