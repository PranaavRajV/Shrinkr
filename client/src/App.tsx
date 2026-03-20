import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { Suspense, lazy, Component } from 'react'
import type { ReactNode } from 'react'

// Lazy-loaded pages
const Landing     = lazy(() => import('./pages/Landing'))
const Login       = lazy(() => import('./pages/Login'))
const Register    = lazy(() => import('./pages/Register'))
const Dashboard   = lazy(() => import('./pages/Dashboard'))
const Analytics   = lazy(() => import('./pages/Analytics'))
const PublicStats = lazy(() => import('./pages/PublicStats'))
const Profile     = lazy(() => import('./pages/Profile'))

// ─── Shared loader ────────────────────────────────────────────────────────────
const PageLoader = () => (
  <div style={{
    minHeight: '100vh',
    background: '#09090B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#555',
    fontSize: '11px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    fontFamily: 'Space Grotesk, sans-serif',
  }}>
    Loading...
  </div>
)

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
          minHeight: '100vh', background: '#09090B',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '32px', fontFamily: 'Space Grotesk, sans-serif',
        }}>
          <div style={{ fontSize: '48px', fontWeight: 900, color: '#ef4444', marginBottom: '16px' }}>ERROR</div>
          <div style={{ fontSize: '12px', color: '#555', fontFamily: 'monospace', marginBottom: '24px', maxWidth: '500px', textAlign: 'center' }}>
            {this.state.error}
          </div>
          <button
            onClick={() => window.location.href = '/'}
            style={{ background: '#DFE104', color: '#000', border: 'none', padding: '12px 24px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
          >
            Go Home
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
        <Route path="/analytics/:shortCode" element={
          <ProtectedRoute><PageErrorBoundary><Analytics /></PageErrorBoundary></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><PageErrorBoundary><Profile /></PageErrorBoundary></ProtectedRoute>
        } />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#FAFAFA',
              border: '1px solid #3F3F46',
              borderRadius: '0px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              fontFamily: 'Space Grotesk, sans-serif',
              padding: '12px 16px',
            },
            success: { iconTheme: { primary: '#DFE104', secondary: '#09090B' }, duration: 3000 },
            error:   { iconTheme: { primary: '#ef4444',  secondary: '#09090B' }, duration: 4000 },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
