import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../stores/auth.store'

interface Props {
  children: React.ReactNode
  rightSidebar?: React.ReactNode
}

const WingGlyph = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size * 0.857} viewBox="0 0 28 24" fill="none" aria-hidden="true">
    <path d="M2 20 C6 12 14 8 26 4 C20 10 18 16 20 22 C14 18 8 18 2 20Z" fill={color} opacity="0.9"/>
    <path d="M2 20 C8 16 14 14 20 22 C14 22 8 22 2 20Z" fill={color} opacity="0.5"/>
  </svg>
)

export default function AppLayout({ children, rightSidebar }: Props) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout, firstVestibularSlug } = useAuthStore()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer on navigation
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const trailHref = firstVestibularSlug ? `/trilha/${firstVestibularSlug}` : '/onboarding'

  const navItems = [
    { label: 'Trilha', icon: '📚', href: trailHref, match: '/trilha' },
    { label: 'Dashboard', icon: '📊', href: '/dashboard', match: '/dashboard' },
    { label: 'Ranking', icon: '🏆', href: '/ranking', match: '/ranking' },
    { label: 'Perfil', icon: '👤', href: '/perfil', match: '/perfil' },
  ]

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 16px' }}>
      {/* Logo */}
      <Link to={trailHref} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 40 }}>
        <div style={{ width: 36, height: 36, backgroundColor: '#FFDC5C', borderRadius: 10, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <WingGlyph size={20} color="#531A61" />
        </div>
        <span style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: '-0.04em' }}>
          kuaa<span style={{ color: '#FFDC5C' }}>.</span>
        </span>
      </Link>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.match)
          return (
            <Link
              key={item.href}
              to={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 12,
                backgroundColor: isActive ? 'rgba(255,255,255,.15)' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,.6)',
                textDecoration: 'none', fontSize: 14, fontFamily: 'Arial, sans-serif',
                fontWeight: isActive ? 600 : 400, transition: 'background-color .15s',
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer user */}
      {user && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 16 }}>
          <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 2, fontFamily: 'Arial, sans-serif' }}>{user.name}</p>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, marginBottom: 12, fontFamily: 'Arial, sans-serif' }}>{user.email}</p>
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,.25)', color: 'rgba(255,255,255,.7)', fontSize: 13, borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontFamily: 'Arial, sans-serif', width: '100%' }}
          >
            Sair
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#faf3e3' }}>

      {/* Sidebar esquerda — desktop */}
      <aside
        className="hidden lg:block"
        style={{ width: 240, backgroundColor: '#531A61', flexShrink: 0, overflowY: 'auto' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(42,13,51,.6)', zIndex: 40 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 260, backgroundColor: '#531A61', zIndex: 50, overflowY: 'auto' }}
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile top bar */}
      <div className="lg:hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, backgroundColor: '#531A61', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <button onClick={() => setDrawerOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 22, lineHeight: 1 }}>☰</button>
        <span style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '-0.04em' }}>kuaa<span style={{ color: '#FFDC5C' }}>.</span></span>
        <div style={{ width: 32 }} />
      </div>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', paddingTop: 0 }} className="lg:pt-0 pt-14">
        {children}
      </main>

      {/* Sidebar direita — desktop */}
      {rightSidebar && (
        <aside
          className="hidden lg:block"
          style={{ width: 280, backgroundColor: '#fff', borderLeft: '1px solid #f3f4f6', flexShrink: 0, overflowY: 'auto' }}
        >
          {rightSidebar}
        </aside>
      )}

      {/* BottomNav — mobile */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden" style={{ backgroundColor: '#fff', borderTop: '1px solid #f3f4f6', zIndex: 20 }}>
        <div style={{ display: 'flex' }}>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.match)
            return (
              <Link
                key={item.href}
                to={item.href}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 8px', gap: 2, textDecoration: 'none', color: isActive ? '#531A61' : '#9ca3af', fontSize: 11, fontFamily: 'Arial, sans-serif', fontWeight: isActive ? 600 : 400 }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
