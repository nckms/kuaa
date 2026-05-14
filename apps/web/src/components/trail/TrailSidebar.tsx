import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'

interface TrailSidebarProps {
  summary?: {
    totalTopics: number
    completedTopics: number
    totalXpEarned: number
  }
}

export default function TrailSidebar({ summary }: TrailSidebarProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  if (!user) return null

  const initial = user.name.charAt(0).toUpperCase()
  const xpBar = Math.round((user.xp % 100) / 100 * 100)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="h-full flex flex-col p-6 gap-5 overflow-y-auto">
      {/* Avatar + info */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          style={{ backgroundColor: '#531A61' }}
        >
          {initial}
        </div>
        <div className="overflow-hidden">
          <p className="font-bold text-sm truncate" style={{ color: '#531A61' }}>{user.name}</p>
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
        </div>
      </div>

      {/* Nível e XP */}
      <div className="rounded-xl p-4" style={{ backgroundColor: '#f3eaf7' }}>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-bold" style={{ color: '#531A61' }}>Nível {user.level}</span>
          <span className="text-xs text-gray-500">{user.xp} XP</span>
        </div>
        <div className="h-2 bg-white rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ backgroundColor: '#531A61', width: `${xpBar}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 text-center" style={{ backgroundColor: '#fff5f0' }}>
          <p className="text-xl font-bold" style={{ color: '#840033' }}>🔥 {user.streakDays}</p>
          <p className="text-xs text-gray-500 mt-0.5">dias seguidos</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ backgroundColor: '#fff5f0' }}>
          <p className="text-xl font-bold" style={{ color: '#840033' }}>❤️ {user.hearts}</p>
          <p className="text-xs text-gray-500 mt-0.5">corações</p>
        </div>
      </div>

      {/* Progresso da trilha */}
      {summary && (
        <div className="rounded-xl p-4 border" style={{ borderColor: '#531A61' + '22' }}>
          <p className="text-xs text-gray-500 mb-1">Progresso da trilha</p>
          <p className="font-bold text-sm" style={{ color: '#531A61' }}>
            {summary.completedTopics}/{summary.totalTopics} tópicos
          </p>
          <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                backgroundColor: '#531A61',
                width: summary.totalTopics > 0
                  ? `${Math.round((summary.completedTopics / summary.totalTopics) * 100)}%`
                  : '0%',
              }}
            />
          </div>
          {summary.totalXpEarned > 0 && (
            <p className="text-xs text-gray-400 mt-2">⚡ {summary.totalXpEarned} XP ganhos</p>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2">
        <button
          onClick={() => navigate('/perfil')}
          className="w-full py-2 rounded-lg text-sm font-medium border transition hover:opacity-80"
          style={{ borderColor: '#531A61', color: '#531A61' }}
        >
          Meu perfil
        </button>
        <button
          onClick={handleLogout}
          className="w-full py-2 rounded-lg text-sm font-medium transition hover:opacity-80"
          style={{ backgroundColor: '#531A61', color: '#fff' }}
        >
          Sair
        </button>
      </div>
    </div>
  )
}
