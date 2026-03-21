import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001'

if (!import.meta.env.VITE_API_URL) {
  console.warn('⚠️ VITE_API_URL is missing. Falling back to localhost. Check for typos like VITE_APT_URL!')
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('shrinkr_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {}
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('shrinkr_token')
        localStorage.removeItem('shrinkr_refresh')
      } catch {}
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
