import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { Suspense, lazy, Component } from 'react'
import Cursor from './components/Cursor'
import PageLoader from './components/PageLoader'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion'
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
const BioPage         = lazy(() => import('./pages/BioPage'))
const BioSettings     = lazy(() => import('./pages/BioSettings'))
const ApiKeys         = lazy(() => import('./pages/ApiKeys'))

// ─── Shared loader (Dark/Neon) ────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 20, filter: 'blur(8px)' },
  animate: { 
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as any }
  },
  exit: { 
    opacity: 0, y: -20, filter: 'blur(8px)',
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as any }
  }
}

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
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Suspense fallback={null}>
          <Routes location={location} key={location.pathname}>
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
            <Route path="/dashboard/bio" element={
              <ProtectedRoute><PageErrorBoundary><BioSettings /></PageErrorBoundary></ProtectedRoute>
            } />
            <Route path="/dashboard/api" element={
              <ProtectedRoute><PageErrorBoundary><ApiKeys /></PageErrorBoundary></ProtectedRoute>
            } />
            <Route path="/u/:username" element={<PageErrorBoundary><BioPage /></PageErrorBoundary>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

import { GoogleOAuthProvider } from '@react-oauth/google'
import { NotificationProvider } from './contexts/NotificationContext'

// ─── App ──────────────────────────────────────────────────────────────────────
export function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id'
  const location = useLocation()
  useSmoothScroll()

  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100, damping: 30, restDelta: 0.001
  })

  // Show scroll progress only on Landing and Analytics
  const showProgress = location.pathname === '/' || location.pathname.startsWith('/analytics')

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <PageLoader />
      {showProgress && (
        <motion.div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, height: '2px',
            background: 'var(--accent)', transformOrigin: '0%', scaleX, zIndex: 999999
          }}
        />
      )}
      <AuthProvider>
          <NotificationProvider>
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
    </GoogleOAuthProvider>
  )
}

export function AppWrapper() {
  return (
    <>
      <Cursor />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </>
  )
}
