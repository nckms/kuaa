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
  const xpBar = Math.round(user.xp % 100)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="h-100 d-flex flex-column p-4 gap-3 overflow-auto" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <div className="d-flex align-items-center gap-3">
        <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0" style={{ width: 48, height: 48, backgroundColor: '#531A61' }}>
          {initial}
        </div>
        <div className="overflow-hidden">
          <p className="fw-bold text-truncate mb-0" style={{ color: '#531A61', fontSize: 14 }}>{user.name}</p>
          <p className="text-muted text-truncate mb-0" style={{ fontSize: 12 }}>{user.email}</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-bold" style={{ color: '#531A61', fontSize: 14 }}>Nivel {user.level}</span>
            <span className="text-muted" style={{ fontSize: 12 }}>{user.xp} XP</span>
          </div>
          <div className="progress" style={{ height: 8 }}>
            <div className="progress-bar" style={{ backgroundColor: '#531A61', width: `${xpBar}%` }} />
          </div>
        </div>
      </div>

      <div className="row g-2">
        <div className="col-6">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body py-3">
              <p className="h5 fw-bold mb-1" style={{ color: '#840033' }}><i className="bi bi-fire me-1" />{user.streakDays}</p>
              <p className="small text-muted mb-0">dias</p>
            </div>
          </div>
        </div>
        <div className="col-6">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body py-3">
              <p className="h5 fw-bold mb-1" style={{ color: '#840033' }}><i className="bi bi-heart-fill me-1" />{user.hearts}</p>
              <p className="small text-muted mb-0">vidas</p>
            </div>
          </div>
        </div>
      </div>

      {summary && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <p className="text-muted mb-1" style={{ fontSize: 12 }}>Progresso da trilha</p>
            <p className="fw-bold mb-2" style={{ color: '#531A61', fontSize: 14 }}>
              {summary.completedTopics}/{summary.totalTopics} topicos
            </p>
            <div className="progress" style={{ height: 6 }}>
              <div
                className="progress-bar"
                style={{
                  backgroundColor: '#531A61',
                  width: summary.totalTopics > 0
                    ? `${Math.round((summary.completedTopics / summary.totalTopics) * 100)}%`
                    : '0%',
                }}
              />
            </div>
            {summary.totalXpEarned > 0 && (
              <p className="text-muted mt-2 mb-0" style={{ fontSize: 12 }}>
                <i className="bi bi-lightning-charge-fill me-1" />
                {summary.totalXpEarned} XP ganhos
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto d-flex flex-column gap-2">
        <button onClick={() => navigate('/perfil')} className="btn btn-outline-secondary btn-sm rounded-pill">
          Meu perfil
        </button>
        <button onClick={handleLogout} className="btn btn-sm rounded-pill text-white" style={{ backgroundColor: '#531A61' }}>
          Sair
        </button>
      </div>
    </div>
  )
}
