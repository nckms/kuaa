import { create } from 'zustand'
import axios from 'axios'
import type { User } from '../types/user'
import { API_BASE_URL } from '../config/api'
import { queryClient } from '../lib/queryClient'
import { acknowledgeLogin, endBrowserSession, refreshAccessToken } from '../services/browserAuth'

interface StoredEnrollment {
  id: string
  vestibularId: string
  vestibular: { slug: string; name: string }
}
interface EnrollmentApiItem {
  enrollment: { id: string; vestibularId: string; enrolledAt: string }
  vestibular: { id: string; slug: string; name: string }
}
interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isHydrating: boolean
  enrollments: StoredEnrollment[]
  firstVestibularSlug: string | null
  setAuth: (user: User, accessToken: string) => void
  updateUser: (user: User) => void
  loadEnrollments: () => Promise<StoredEnrollment[]>
  logout: () => Promise<void>
  hydrate: () => Promise<void>
}
function activeSlug(user: User | null, enrollments: StoredEnrollment[]) {
  return (enrollments.find((item) => item.vestibularId === user?.activeVestibularId)
    ?? enrollments[0])?.vestibular.slug ?? null
}
function mapEnrollments(items: EnrollmentApiItem[]): StoredEnrollment[] {
  return items.map((item) => ({ id: item.enrollment.id, vestibularId: item.enrollment.vestibularId, vestibular: item.vestibular }))
}
let hydration: Promise<void> | null = null
let authVersion = 0
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null, accessToken: null, isAuthenticated: false, isHydrating: true,
  enrollments: [], firstVestibularSlug: null,
  setAuth: (user, accessToken) => {
    authVersion++
    if (get().user?.id !== user.id) queryClient.clear()
    acknowledgeLogin()
    set({ user, accessToken, isAuthenticated: true, isHydrating: false, enrollments: [], firstVestibularSlug: null })
  },
  updateUser: (user) => {
    const changed = get().user?.activeVestibularId !== user.activeVestibularId
    set({ user, firstVestibularSlug: activeSlug(user, get().enrollments) })
    if (changed) for (const key of ['trail', 'enrollments', 'index', 'ranking', 'simulado', 'dashboard', 'user']) {
      void queryClient.invalidateQueries({ queryKey: [key] })
    }
  },
  loadEnrollments: async () => {
    const token = get().accessToken
    if (!token) return []
    const res = await axios.get<EnrollmentApiItem[]>(`${API_BASE_URL}/enrollments/me`, { headers: { Authorization: `Bearer ${token}` } })
    const enrollments = mapEnrollments(res.data)
    set({ enrollments, firstVestibularSlug: activeSlug(get().user, enrollments) })
    return enrollments
  },
  logout: async () => {
    authVersion++
    queryClient.clear()
    set({ user: null, accessToken: null, isAuthenticated: false, isHydrating: false, enrollments: [], firstVestibularSlug: null })
    try { await endBrowserSession() } catch {
      // The non-secret pending flag prevents silently restoring a failed logout.
    }
  },
  hydrate: () => {
    if (hydration) return hydration
    const version = authVersion
    hydration = (async () => {
      try {
        const accessToken = await refreshAccessToken()
        const headers = { Authorization: `Bearer ${accessToken}` }
        const [userRes, enrollRes] = await Promise.all([
          axios.get<User>(`${API_BASE_URL}/users/me`, { headers }),
          axios.get<EnrollmentApiItem[]>(`${API_BASE_URL}/enrollments/me`, { headers }),
        ])
        if (version !== authVersion) return
        const enrollments = mapEnrollments(enrollRes.data)
        set({ user: userRes.data, accessToken, isAuthenticated: true, enrollments,
          firstVestibularSlug: activeSlug(userRes.data, enrollments) })
      } catch (err) {
        // 400/401 já limpam os marcadores em browserAuth. Erros transitórios
        // (rede, 5xx) não revogam a sessão do servidor: o aluno fica deslogado
        // nesta carga, mas o próximo reload tenta de novo.
        void err
      } finally {
        if (version === authVersion) set({ isHydrating: false })
      }
    })().finally(() => { hydration = null })
    return hydration
  },
}))
useAuthStore.subscribe((state) => {
  const slug = activeSlug(state.user, state.enrollments)
  if (state.firstVestibularSlug !== slug) useAuthStore.setState({ firstVestibularSlug: slug })
})
