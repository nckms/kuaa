import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isHydrating = useAuthStore((state) => state.isHydrating)
  const location = useLocation()

  if (isHydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">Carregando…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={`/entrar?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <Outlet />
}
