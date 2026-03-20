import { createContext, useContext, useState,
         useEffect, useCallback, type ReactNode } from 'react'
import api from '../lib/api'

interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  bio?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    try {
      const res = await api.get('/api/users/me')
      setUser(prev => prev ? { ...prev, ...res.data.data } : res.data.data)
    } catch { /* silently ignore */ }
  }, [])

  // Load token on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('shrinkr_token')
      if (stored) {
        setToken(stored)
        try {
          const payload = JSON.parse(atob(stored.split('.')[1]))
          if (payload?.sub && payload?.email) {
            setUser({ id: payload.sub, email: payload.email })
            // Fetch full profile (name, avatar) in background
            api.get('/api/users/me').then(res => {
              setUser(res.data.data)
            }).catch(() => {})
          }
        } catch {
          localStorage.removeItem('shrinkr_token')
        }
      }
    } catch {}
    finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password })
    const { accessToken, user: userData } = res.data.data
    localStorage.setItem('shrinkr_token', accessToken)
    setToken(accessToken)
    setUser(userData)
    // Fetch full profile after login
    api.get('/api/users/me').then(r => setUser(r.data.data)).catch(() => {})
  }

  const register = async (email: string, password: string) => {
    const res = await api.post('/api/auth/register', { email, password })
    const { accessToken, user: userData } = res.data.data
    localStorage.setItem('shrinkr_token', accessToken)
    setToken(accessToken)
    setUser(userData)
  }

  const logout = () => {
    try {
      const refreshToken = localStorage.getItem('shrinkr_refresh')
      if (refreshToken) {
        api.post('/api/auth/logout', { refreshToken }).catch(() => {})
      }
    } catch {}
    localStorage.removeItem('shrinkr_token')
    localStorage.removeItem('shrinkr_refresh')
    setToken(null)
    setUser(null)
    window.location.href = '/login'
  }

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#09090B',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#DFE104',
        fontSize: '11px', letterSpacing: '0.2em',
        textTransform: 'uppercase',
        fontFamily: 'Space Grotesk, sans-serif'
      }}>
        Loading...
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{
      user, token, login, register, logout, refreshProfile, isLoading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
