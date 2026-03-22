import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface LayoutProps {
  children: ReactNode
  onCreateLink?: () => void
}

export default function Layout({ children, onCreateLink }: LayoutProps) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text-primary)', position: 'relative' }}>
      {/* ── SHARED DEEP BACKGROUND (SYNC WITH LANDING) ───────────────── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* Grain texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.02,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px'
        }} />
        {/* Subtle Grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '72px 72px'
        }} />
      </div>

      {/* Fixed Sidebar */}
      <Sidebar onCreateLink={onCreateLink} />

      {/* Main Content Area */}
      <div style={{ 
        marginLeft: 'var(--sidebar-width)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        <Header />
        
        <div style={{ flex: 1, position: 'relative' }}>
          <main style={{ 
            maxWidth: '1440px', 
            margin: '0 auto',
            width: '100%',
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {children}
          </main>

          <footer style={{ 
            padding: '60px 40px', 
            borderTop: '1px solid var(--border)',
            marginTop: 'auto', // Pushes footer to bottom even if content is short
            color: 'var(--text-muted)',
            fontSize: '11px',
            fontWeight: 800,
            backgroundColor: 'var(--bg-secondary)',
            width: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.8, letterSpacing: '0.05em' }}>
              <span>ZURL © 2024 · THE TACTILE OASIS</span>
              <div style={{ display: 'flex', gap: '32px' }}>
                <span style={{ cursor: 'pointer' }}>PRIVACY</span>
                <span style={{ cursor: 'pointer' }}>TERMS</span>
                <span style={{ cursor: 'pointer' }}>API DOCUMENTATION</span>
                <span style={{ cursor: 'pointer' }}>CONTACT</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
