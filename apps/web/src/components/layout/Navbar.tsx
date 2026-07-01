import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../stores/auth.store'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, firstVestibularSlug } = useAuthStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const trailHref = firstVestibularSlug ? `/trilha/${firstVestibularSlug}` : '/trilha'

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    setDropdownOpen(false)
    await logout()
    navigate('/')
  }

  return (
    <>
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between relative z-30">
        {/* Logo */}
        <Link
          to={isAuthenticated ? trailHref : '/'}
          className="text-2xl font-bold"
          style={{ color: '#531A61' }}
        >
          🦅 KUAA
        </Link>

        {/* Desktop — direita */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              <span className="text-sm" style={{ color: '#531A61' }}>⚡ {user.xp} XP</span>
              <span className="text-sm" style={{ color: '#840033' }}>🔥 {user.streakDays}</span>

              {/* Avatar dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm focus:outline-none"
                  style={{ backgroundColor: '#531A61' }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-xs font-medium truncate" style={{ color: '#531A61' }}>{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => { setDropdownOpen(false); navigate('/perfil') }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition"
                      >
                        Perfil
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 transition"
                      >
                        Sair
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/entrar"
                className="text-sm font-medium px-4 py-2 rounded-lg border"
                style={{ borderColor: '#531A61', color: '#531A61' }}
              >
                Entrar
              </Link>
              <Link
                to="/cadastro"
                className="text-sm font-medium px-4 py-2 rounded-lg text-white"
                style={{ backgroundColor: '#531A61' }}
              >
                Cadastrar
              </Link>
            </>
          )}
        </div>

        {/* Mobile — hamburger */}
        <button
          className="md:hidden p-2 rounded-lg"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
        >
          <div className="space-y-1.5">
            <span className="block w-6 h-0.5" style={{ backgroundColor: '#531A61' }} />
            <span className="block w-6 h-0.5" style={{ backgroundColor: '#531A61' }} />
            <span className="block w-6 h-0.5" style={{ backgroundColor: '#531A61' }} />
          </div>
        </button>
      </nav>

      {/* Drawer mobile */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              className="fixed left-0 top-0 h-full w-72 bg-white z-50 md:hidden flex flex-col"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="p-6 border-b border-gray-100">
                <span className="text-xl font-bold" style={{ color: '#531A61' }}>🦅 KUAA</span>
              </div>
              <div className="flex-1 p-4 space-y-1">
                {isAuthenticated ? (
                  <>
                    <Link to={trailHref} onClick={() => setMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-sm font-medium" style={{ color: '#531A61' }}>
                      📚 Trilha
                    </Link>
                    <Link to="/perfil" onClick={() => setMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-sm font-medium" style={{ color: '#531A61' }}>
                      👤 Perfil
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/entrar" onClick={() => setMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-sm font-medium" style={{ color: '#531A61' }}>
                      Entrar
                    </Link>
                    <Link to="/cadastro" onClick={() => setMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-sm font-medium" style={{ color: '#531A61' }}>
                      Cadastrar
                    </Link>
                  </>
                )}
              </div>
              {isAuthenticated && (
                <div className="p-4 border-t border-gray-100">
                  <button onClick={handleLogout}
                    className="w-full py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200">
                    Sair
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
