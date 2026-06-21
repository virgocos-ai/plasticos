import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch { return null }
}

let refreshPromise: Promise<void> | null = null

async function refreshIfNeeded(token: string): Promise<string> {
  const expiry = getTokenExpiry(token)
  if (!expiry) return token
  const msLeft = expiry - Date.now()
  if (msLeft > 30 * 60 * 1000) return token // más de 30 min restantes — no refrescar

  if (!refreshPromise) {
    refreshPromise = axios
      .post('/api/auth/refresh', null, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        useAuthStore.getState().setAuth(r.data.token, r.data.usuario)
      })
      .catch(() => {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      })
      .finally(() => { refreshPromise = null })
  }

  await refreshPromise
  return useAuthStore.getState().token || token
}

api.interceptors.request.use(async (config) => {
  let token = useAuthStore.getState().token
  if (token) {
    token = await refreshIfNeeded(token)
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
