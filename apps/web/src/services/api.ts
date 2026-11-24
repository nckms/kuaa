import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../stores/auth.store'
import { API_BASE_URL } from '../config/api'
import { NoBrowserSession, refreshAccessToken } from './browserAuth'

export const api = axios.create({ baseURL: API_BASE_URL, withCredentials: true,
  headers: { 'Content-Type': 'application/json', 'X-Kuaa-Client': 'web' } })
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use((response) => response, async (error: unknown) => {
  if (!axios.isAxiosError(error) || !error.config) return Promise.reject(error)
  const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
  if (error.response?.status !== 401 || original._retry || original.url?.includes('/auth')) return Promise.reject(error)
  original._retry = true
  const userId = useAuthStore.getState().user?.id
  try {
    const accessToken = await refreshAccessToken()
    if (useAuthStore.getState().user?.id !== userId || !useAuthStore.getState().isAuthenticated) return Promise.reject(error)
    useAuthStore.setState({ accessToken })
    original.headers.Authorization = `Bearer ${accessToken}`
    return api(original)
  } catch (refreshError) {
    if (refreshError instanceof NoBrowserSession || (axios.isAxiosError(refreshError) && [400, 401].includes(refreshError.response?.status ?? 0))) {
      await useAuthStore.getState().logout()
      window.location.assign('/entrar')
    }
    return Promise.reject(refreshError)
  }
})
