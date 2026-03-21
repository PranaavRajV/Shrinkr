import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { Suspense, lazy, Component } from 'react'
import CustomCursor from './components/CustomCursor'
import type { ReactNode } from 'react'

// Lazy-loaded pages
const Landing         = lazy(() => import('./pages/Landing'))
const Login           = lazy(() => import('./pages/Login'))
const Register        = lazy(() => import('./pages/Register'))
const Dashboard       = lazy(() => import('./pages/Dashboard'))
const Links           = lazy(() => import('./pages/Links'))
const Analytics       = lazy(() => import('./pages/Analytics'))
const AnalyticsPicker = lazy(() => import('./pages/AnalyticsPicker'))
const PublicStats     = lazy(() => import('./pages/PublicStats'))
const Profile         = lazy(() => import('./pages/Profile'))
const HelpCenter      = lazy(() => import('./pages/HelpCenter'))

// ─── Shared loader (Dark/Neon) ────────────────────────────────────────────────
const PageLoader = () => (
  <div style={{
    minHeight: '100vh',
    background: '#0A0A0A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#CBFF00',
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    fontFamily: 'Space Grotesk, sans-serif',
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
       <div style={{ 
         width: '48px', height: '1px', background: '#222', 
         position: 'relative', overflow: 'hidden'
       }}>
          <div style={{
            position: 'absolute', inset: 0, background: '#CBFF00',
            animation: 'slide 1.5s infinite ease-in-out'
          }} />
       </div>
       ZURL ARCHITECTURE
    </div>
  </div>
)

const loaderStyles = `
  @keyframes slide {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`

// ─── Error boundary ───────────────────────────────────────────────────────────
class PageErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: string }
> {
  state = { hasError: false, error: '' }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: '#0A0A0A',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px', fontFamily: 'Inter, sans-serif',
        }}>
          <div style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.2)', marginBottom: '16px', letterSpacing: '0.4em' }}>SYSTEM ERROR</div>
          <div style={{ fontSize: '48px', fontWeight: 900, color: '#CBFF00', marginBottom: '16px', letterSpacing: '-0.04em' }}>CRASHED.</div>
          <div style={{ fontSize: '14px', color: '#555', marginBottom: '40px', maxWidth: '400px', textAlign: 'center', lineHeight: 1.6 }}>
            {this.state.error}
          </div>
          <button
            onClick={() => window.location.href = '/'}
            style={{ 
              background: '#fff', color: '#000', border: 'none', 
              padding: '16px 32px', fontSize: '12px', fontWeight: 900, 
              textTransform: 'uppercase', letterSpacing: '0.1em', 
              cursor: 'pointer', borderRadius: '4px'
            }}
          >
            Reboot Interface
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Protected route ──────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem('shrinkr_token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ─── Routes ───────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<PageErrorBoundary><Landing /></PageErrorBoundary>} />
        <Route path="/login" element={<PageErrorBoundary><Login /></PageErrorBoundary>} />
        <Route path="/register" element={<PageErrorBoundary><Register /></PageErrorBoundary>} />
        <Route path="/s/:shortCode" element={<PageErrorBoundary><PublicStats /></PageErrorBoundary>} />
        <Route path="/dashboard" element={
          <ProtectedRoute><PageErrorBoundary><Dashboard /></PageErrorBoundary></ProtectedRoute>
        } />
        <Route path="/links" element={
          <ProtectedRoute><PageErrorBoundary><Links /></PageErrorBoundary></ProtectedRoute>
        } />
        <Route path="/analytics/:shortCode" element={
          <ProtectedRoute><PageErrorBoundary><Analytics /></PageErrorBoundary></ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute><PageErrorBoundary><AnalyticsPicker /></PageErrorBoundary></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><PageErrorBoundary><Profile /></PageErrorBoundary></ProtectedRoute>
        } />
        <Route path="/help" element={
          <ProtectedRoute><PageErrorBoundary><HelpCenter /></PageErrorBoundary></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

import { GoogleOAuthProvider } from '@react-oauth/google'
import { NotificationProvider } from './contexts/NotificationContext'

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id'

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <style>{loaderStyles}</style>
        <AuthProvider>
          <NotificationProvider>
          <CustomCursor />
          <AppRoutes />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#161616',
                color: '#FFFFFF',
                border: '1px solid #222',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'Inter, sans-serif',
                padding: '12px 20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              },
              success: { iconTheme: { primary: '#CBFF00', secondary: '#000000' }, duration: 3000 },
              error:   { iconTheme: { primary: '#ff4444',  secondary: '#FFFFFF' }, duration: 4000 },
            }}
          />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}
