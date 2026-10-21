import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { useAuthStore } from '../../stores/auth.store'
import KuaaLogo from '../ui/KuaaLogo'
import './AppLayout.css'

interface Props {
  children: React.ReactNode
  rightSidebar?: React.ReactNode
}

const navigation = [
  { label: 'Trilha', icon: 'bi-map', path: '/trilha' },
  { label: 'Painel', icon: 'bi-grid-1x2', path: '/dashboard' },
  { label: 'Simulado', icon: 'bi-journal-check', path: '/simulado' },
  { label: 'Sabiá', icon: 'bi-chat-dots', path: '/sabia' },
  { label: 'Meu desempenho', icon: 'bi-graph-up', path: '/indice' },
  { label: 'Ranking', icon: 'bi-trophy', path: '/ranking' },
  { label: 'Perfil', icon: 'bi-person', path: '/perfil' },
  { label: 'Configurações', icon: 'bi-gear', path: '/configuracoes' },
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
  const links = navigation.map((item) => ({ ...item, href: item.path === '/trilha' ? trailHref : item.path }))
  const active = (path: string) => pathname === path || pathname.startsWith(`${path}/`)

  return (
    <MotionConfig reducedMotion={user?.preferences?.reducedMotion ? 'always' : 'user'}>
      <div className="kuaa-app" data-reduced-motion={user?.preferences?.reducedMotion || undefined} data-high-contrast={user?.preferences?.highContrast || undefined}>
        <aside className="kuaa-sidebar" aria-label="Menu principal">
          <Link className="kuaa-sidebar-brand" to={trailHref} aria-label="Kuaa: ir para a trilha">
            <KuaaLogo size={34} dark />
          </Link>
          <nav className="kuaa-sidebar-nav" aria-label="Navegação principal">
            {links.map((item, index) => (
              <Link
                key={item.path}
                to={item.href}
                className={`kuaa-nav-link${active(item.path) ? ' is-active' : ''}${index === 4 ? ' has-separator' : ''}`}
                aria-current={active(item.path) ? 'page' : undefined}
              >
                <i className={`bi ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          {user && (
            <div className="kuaa-sidebar-account">
              <div className="kuaa-account-avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</div>
              <div className="kuaa-account-text"><strong>{user.name}</strong><small>{user.email}</small></div>
              <button type="button" onClick={handleLogout} className="kuaa-logout" aria-label="Sair" title="Sair"><i className="bi bi-box-arrow-right" aria-hidden="true" /></button>
            </div>
          )}
        </aside>

        <main className="app-main-content" id="main-content">{children}</main>
        {rightSidebar && <aside className="kuaa-context-sidebar">{rightSidebar}</aside>}

        <nav className="mobile-bottom-nav" aria-label="Navegação principal">
          {links.slice(0, 4).map((item) => (
            <Link key={item.path} to={item.href} className={active(item.path) ? 'is-active' : ''} aria-current={active(item.path) ? 'page' : undefined}>
              <i className={`bi ${item.icon}`} aria-hidden="true" /><span>{item.label}</span>
            </Link>
          ))}
          <button ref={moreButton} type="button" className={links.slice(4).some((item) => active(item.path)) ? 'is-active' : ''} aria-expanded={moreOpen} aria-controls="mobile-more-nav" onClick={() => setMoreOpen((open) => !open)}>
            <i className="bi bi-list" aria-hidden="true" /><span>Mais</span>
          </button>
          {moreOpen && (
            <div id="mobile-more-nav" className="kuaa-more-menu" onKeyDown={(event) => { if (event.key === 'Escape') { setMoreOpen(false); moreButton.current?.focus() } }}>
              {links.slice(4).map((item) => <Link key={item.path} to={item.href} aria-current={active(item.path) ? 'page' : undefined}><i className={`bi ${item.icon}`} aria-hidden="true" />{item.label}</Link>)}
              <button type="button" onClick={handleLogout}><i className="bi bi-box-arrow-right" aria-hidden="true" />Sair</button>
            </div>
          )}
        </nav>
      </div>
    </MotionConfig>
  )
}
