import { create } from 'zustand'
import axios from 'axios'
import type { User } from '../types/user'

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
  refreshToken: string | null
  isAuthenticated: boolean
  isHydrating: boolean
  enrollments: StoredEnrollment[]
  firstVestibularSlug: string | null
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  logout: () => Promise<void>
  hydrate: () => Promise<void>
}

const BASE_URL = import.meta.env.VITE_API_URL

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('kuaa_token'),
  refreshToken: localStorage.getItem('kuaa_refresh_token'),
  isAuthenticated: false,
  isHydrating: true,
  enrollments: [],
  firstVestibularSlug: null,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('kuaa_token', accessToken)
    localStorage.setItem('kuaa_refresh_token', refreshToken)
    set({ user, accessToken, refreshToken, isAuthenticated: true })
  },

  logout: async () => {
    const { refreshToken } = get()
    if (refreshToken) {
      try {
        await axios.delete(`${BASE_URL}/auth/logout`, { data: { refreshToken } })
      } catch {
        // Limpa localmente independente da resposta da API
      }
    }
    localStorage.removeItem('kuaa_token')
    localStorage.removeItem('kuaa_refresh_token')
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      enrollments: [],
      firstVestibularSlug: null,
    })
  },

  hydrate: async () => {
    const storedRefresh = localStorage.getItem('kuaa_refresh_token')
    let accessToken = localStorage.getItem('kuaa_token')

    if (!accessToken && !storedRefresh) {
      set({ isHydrating: false })
      return
    }

    async function fetchWithToken(token: string) {
      return Promise.all([
        axios.get<User>(`${BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<EnrollmentApiItem[]>(`${BASE_URL}/enrollments/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
    }

    try {
      let userRes: Awaited<ReturnType<typeof axios.get<User>>>
      let enrollRes: Awaited<ReturnType<typeof axios.get<EnrollmentApiItem[]>>>

      try {
        ;[userRes, enrollRes] = await fetchWithToken(accessToken ?? '')
      } catch (firstErr) {
        // access token expirado — tenta refresh antes de deslogar
        if (
          axios.isAxiosError(firstErr) &&
          firstErr.response?.status === 401 &&
          storedRefresh
        ) {
          const refreshRes = await axios.post<{ accessToken: string }>(
            `${BASE_URL}/auth/refresh`,
            { refreshToken: storedRefresh },
          )
          accessToken = refreshRes.data.accessToken
          localStorage.setItem('kuaa_token', accessToken)
          ;[userRes, enrollRes] = await fetchWithToken(accessToken)
        } else {
          throw firstErr
        }
      }

      const enrollments: StoredEnrollment[] = enrollRes.data.map((item) => ({
        id: item.enrollment.id,
        vestibularId: item.enrollment.vestibularId,
        vestibular: { slug: item.vestibular.slug, name: item.vestibular.name },
      }))

      set({
        user: userRes.data,
        accessToken,
        refreshToken: storedRefresh,
        isAuthenticated: true,
        enrollments,
        firstVestibularSlug: enrollments[0]?.vestibular.slug ?? null,
        isHydrating: false,
      })
    } catch {
      await get().logout()
      set({ isHydrating: false })
    }
  },
}))
