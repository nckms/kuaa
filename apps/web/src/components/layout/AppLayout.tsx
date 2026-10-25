import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { useAuthStore } from '../../stores/auth.store'
import KuaaMascotLogo from '../ui/KuaaMascotLogo'
import './AppLayout.css'

interface Props {
  children: React.ReactNode
  rightSidebar?: React.ReactNode
}

interface NavItem {
  key: string
  label: string
  icon: string
  href: string
  match: string[]
  badge?: string
}

export default function AppLayout({ children, rightSidebar }: Props) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout, firstVestibularSlug, enrollments } = useAuthStore()
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

  const slug = firstVestibularSlug
  const examName = enrollments.find((item) => item.vestibular.slug === slug)?.vestibular.name
  const trailHref = slug ? `/trilha/${slug}` : '/trilha'
  const essayHref = slug ? `/redacao/${slug}` : '/trilha'

  const items: Record<string, NavItem> = {
    painel: { key: 'painel', label: 'Início', icon: 'bi-house', href: '/dashboard', match: ['/dashboard'] },
    trilha: { key: 'trilha', label: 'Minha trilha', icon: 'bi-signpost-split', href: trailHref, match: ['/trilha', '/estudar', '/revisao'] },
    simulado: { key: 'simulado', label: 'Simulado', icon: 'bi-clipboard-check', href: '/simulado', match: ['/simulado'], badge: 'Novo' },
    sabia: { key: 'sabia', label: 'Sabiá IA', icon: 'bi-stars', href: '/sabia', match: ['/sabia'] },
    redacao: { key: 'redacao', label: 'Redação', icon: 'bi-pen', href: essayHref, match: ['/redacao'] },
    indice: { key: 'indice', label: 'Índice Kuaa', icon: 'bi-speedometer2', href: '/indice', match: ['/indice'] },
    ranking: { key: 'ranking', label: 'Ranking', icon: 'bi-trophy', href: '/ranking', match: ['/ranking'] },
    perfil: { key: 'perfil', label: 'Perfil', icon: 'bi-person', href: '/perfil', match: ['/perfil'] },
    config: { key: 'config', label: 'Configurações', icon: 'bi-gear', href: '/configuracoes', match: ['/configuracoes', '/avaliacao'] },
  }
  const groups = [
    [items.painel, items.trilha, items.simulado, items.sabia, items.redacao],
    [items.indice, items.ranking],
    [items.perfil, items.config],
  ] as NavItem[][]
  const moreItems = [items.indice, items.redacao, items.ranking, items.perfil, items.config] as NavItem[]
  const bottomItems = [
    { ...items.trilha!, label: 'Trilha' },
    items.painel!,
    items.simulado!,
    { ...items.sabia!, label: 'Sabiá' },
  ]
  const isActive = (item: NavItem) => item.match.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  const moreActive = moreItems.some(isActive)
  const initial = user?.name.charAt(0).toUpperCase() ?? 'K'

  return (
    <MotionConfig reducedMotion={user?.preferences?.reducedMotion ? 'always' : 'user'}>
      <div className="kuaa-app" data-reduced-motion={user?.preferences?.reducedMotion || undefined} data-high-contrast={user?.preferences?.highContrast || undefined}>
        <aside className="kuaa-sidebar" aria-label="Menu principal">
          <Link className="kuaa-sidebar-brand" to="/dashboard" aria-label="Kuaa: ir para o início">
            <KuaaMascotLogo size={34} radius={10} />
            <img className="kuaa-wordmark" src="/brand/wordmark-w.png" alt="Kuaa" />
          </Link>
          <nav className="kuaa-sidebar-nav" aria-label="Navegação principal">
            {groups.map((group, index) => (
              <div key={index} className="kuaa-nav-group">
                {group.map((item) => (
                  <Link key={item.key} to={item.href} title={item.label} className={`kuaa-nav-link${isActive(item) ? ' is-active' : ''}`} aria-current={isActive(item) ? 'page' : undefined}>
                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                    <span>{item.label}</span>
                    {item.badge && <span className="k-badge">{item.badge}</span>}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          {user && (
            <div className="kuaa-sidebar-account">
              <span className="kuaa-account-avatar" aria-hidden="true">{initial}</span>
              <div className="kuaa-account-text"><strong>{user.name}</strong><small>{examName ? `${examName} · ` : ''}Nível {user.level}</small></div>
              <button type="button" onClick={handleLogout} className="kuaa-logout" aria-label="Sair" title="Sair"><i className="bi bi-box-arrow-right" aria-hidden="true" /></button>
            </div>
          )}
        </aside>

        <main className="app-main-content" id="main-content">
          <div className="kuaa-mobile-top">
            <Link to="/dashboard" aria-label="Kuaa: ir para o início"><img src="/brand/wordmark-t.png" alt="Kuaa" /></Link>
            <Link to="/perfil" className="kuaa-mobile-avatar" aria-label="Perfil">{initial}</Link>
          </div>
          {children}
        </main>
        {rightSidebar && <aside className="kuaa-context-sidebar">{rightSidebar}</aside>}

        <nav className="mobile-bottom-nav" aria-label="Navegação principal">
          {bottomItems.map((item) => (
            <Link key={item.key} to={item.href} className={isActive(item) ? 'is-active' : ''} aria-current={isActive(item) ? 'page' : undefined}>
              <span className="kuaa-bottom-pill"><i className={`bi ${item.icon}`} aria-hidden="true" /></span>{item.label}
            </Link>
          ))}
          <button ref={moreButton} type="button" className={moreActive ? 'is-active' : ''} aria-expanded={moreOpen} aria-controls="mobile-more-nav" onClick={() => setMoreOpen(true)}>
            <span className="kuaa-bottom-pill"><i className="bi bi-grid" aria-hidden="true" /></span>Mais
          </button>
        </nav>

        {moreOpen && (
          <div className="kuaa-more-overlay" onClick={() => { setMoreOpen(false); moreButton.current?.focus() }}>
            <div id="mobile-more-nav" role="dialog" aria-label="Mais opções" className="kuaa-more-sheet" onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => { if (event.key === 'Escape') { setMoreOpen(false); moreButton.current?.focus() } }}>
              <span className="kuaa-sheet-handle" aria-hidden="true" />
              {moreItems.map((item) => (
                <Link key={item.key} to={item.href} className={isActive(item) ? 'is-active' : ''} aria-current={isActive(item) ? 'page' : undefined}>
                  <i className={`bi ${item.icon}`} aria-hidden="true" /><span>{item.label}</span><i className="bi bi-chevron-right" aria-hidden="true" />
                </Link>
              ))}
              <button type="button" onClick={handleLogout}><i className="bi bi-box-arrow-right" aria-hidden="true" /><span>Sair</span></button>
            </div>
          </div>
        )}
      </div>
    </MotionConfig>
  )
}
