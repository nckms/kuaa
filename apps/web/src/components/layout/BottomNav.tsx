import { Link, useLocation } from 'react-router-dom'

interface BottomNavProps {
  vestibularSlug?: string
}

export default function BottomNav({ vestibularSlug }: BottomNavProps) {
  const { pathname } = useLocation()

  const items = [
    { label: 'Início', icon: '🏠', href: '/' },
    { label: 'Trilha', icon: '📚', href: vestibularSlug ? `/trilha/${vestibularSlug}` : '/trilha' },
    { label: 'Ranking', icon: '🏆', href: '/ranking' },
    { label: 'Perfil', icon: '👤', href: '/perfil' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20 lg:hidden">
      <div className="flex">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              to={item.href}
              className="flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-medium transition"
              style={{ color: isActive ? '#531A61' : '#9ca3af' }}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
