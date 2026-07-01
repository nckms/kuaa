import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import KuaaMascotLogo from '../../components/ui/KuaaMascotLogo'

export default function TrailPlaceholder() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: 'var(--bg)', fontFamily: 'Inter, Arial, sans-serif' }}>
      <nav className="navbar px-4 shadow-sm" style={{ backgroundColor: '#531A61' }}>
        <div className="d-flex align-items-center gap-2">
          <KuaaMascotLogo size={34} />
          <span className="fw-bold text-white">KUAA</span>
        </div>
        <div className="d-flex align-items-center gap-3">
          <span className="text-white-50 small">Ola, {user?.name?.split(' ')[0]}</span>
          <button onClick={handleLogout} className="btn btn-sm rounded-pill fw-semibold" style={{ backgroundColor: '#FFDC5C', color: '#531A61' }}>
            Sair
          </button>
        </div>
      </nav>

      <main className="flex-grow-1 d-flex flex-column align-items-center justify-content-center px-4 text-center">
        <KuaaMascotLogo size={112} />
        <h1 className="fw-bold mt-4 mb-3" style={{ color: '#531A61', fontSize: 30 }}>
          Sua trilha esta sendo preparada
        </h1>
        <p className="text-muted mb-4" style={{ maxWidth: 440 }}>
          Em breve voce tera acesso a questoes personalizadas, trilhas adaptativas e muito mais.
        </p>

        <div className="row g-3 justify-content-center" style={{ maxWidth: 560 }}>
          <div className="col-12 col-sm-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <p className="h4 fw-bold mb-1" style={{ color: '#531A61' }}>{user?.xp ?? 0}</p>
                <p className="small text-muted mb-0">XP total</p>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <p className="h4 fw-bold mb-1" style={{ color: '#531A61' }}>Nv. {user?.level ?? 1}</p>
                <p className="small text-muted mb-0">Nivel</p>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <p className="h4 fw-bold mb-1" style={{ color: '#840033' }}><i className="bi bi-fire me-1" />{user?.streakDays ?? 0}</p>
                <p className="small text-muted mb-0">dias seguidos</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
