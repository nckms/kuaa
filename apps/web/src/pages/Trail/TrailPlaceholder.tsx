import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'

export default function TrailPlaceholder() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navbar */}
      <nav className="px-6 py-4 flex items-center justify-between shadow-sm" style={{ backgroundColor: '#531A61' }}>
        <span className="text-xl font-bold text-white">🦅 KUAA</span>
        <div className="flex items-center gap-4">
          <span className="text-white/80 text-sm">Olá, {user?.name?.split(' ')[0]}</span>
          <button
            onClick={handleLogout}
            className="text-sm font-medium px-4 py-2 rounded-lg transition hover:opacity-80"
            style={{ backgroundColor: '#FFDC5C', color: '#531A61' }}
          >
            Sair
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-7xl mb-6">🦅</p>
        <h1 className="text-3xl font-bold mb-4" style={{ color: '#531A61' }}>
          Sua trilha está sendo preparada
        </h1>
        <p className="text-gray-500 mb-8 max-w-md">
          Em breve você terá acesso a questões personalizadas, trilhas adaptativas e muito mais.
        </p>

        {/* Stats */}
        <div className="flex gap-6">
          <div className="text-center px-6 py-4 rounded-2xl" style={{ backgroundColor: '#531A61' + '11', border: '1px solid #531A61' + '33' }}>
            <p className="text-2xl font-bold" style={{ color: '#531A61' }}>{user?.xp ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">XP total</p>
          </div>
          <div className="text-center px-6 py-4 rounded-2xl" style={{ backgroundColor: '#531A61' + '11', border: '1px solid #531A61' + '33' }}>
            <p className="text-2xl font-bold" style={{ color: '#531A61' }}>Nv. {user?.level ?? 1}</p>
            <p className="text-xs text-gray-500 mt-1">Nível</p>
          </div>
          <div className="text-center px-6 py-4 rounded-2xl" style={{ backgroundColor: '#FFDC5C' + '33', border: '1px solid #FFDC5C' }}>
            <p className="text-2xl font-bold" style={{ color: '#840033' }}>🔥 {user?.streakDays ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">dias seguidos</p>
          </div>
        </div>
      </div>
    </div>
  )
}
