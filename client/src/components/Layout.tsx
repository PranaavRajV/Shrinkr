import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface LayoutProps {
  children: ReactNode
  onCreateLink?: () => void
}

export default function Layout({ children, onCreateLink }: LayoutProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      {/* Fixed Sidebar */}
      <Sidebar onCreateLink={onCreateLink} />

      {/* Main Content Area */}
      <div style={{ 
        flex: 1, 
        marginLeft: 'var(--sidebar-width)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Header />
        
        <main style={{ 
          maxWidth: '1440px', 
          margin: '0 auto',
          width: '100%',
          flex: 1,
          padding: '0' // We handle padding in individual pages for full-width control
        }}>
          {children}
        </main>

        <footer style={{ 
          padding: '60px 40px', 
          borderTop: '1px solid var(--border)',
          marginTop: '80px',
          color: 'var(--text-muted)',
          fontSize: '11px',
          fontWeight: 800,
          backgroundColor: 'var(--bg-secondary)'
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
  )
}
