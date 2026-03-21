import { NavLink, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, Link2, BarChart3, Settings, 
  Plus, HelpCircle, LogOut, Share2, Terminal
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Sidebar({ onCreateLink }: { onCreateLink?: () => void }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { icon: LayoutDashboard, label: 'DASHBOARD', path: '/dashboard' },
    { icon: Link2, label: 'MY LINKS', path: '/links' },
    { icon: BarChart3, label: 'ANALYTICS', path: '/analytics' },
    { icon: Share2, label: 'BIO PAGE', path: '/dashboard/bio' },
    { icon: Terminal, label: 'API & DEVS', path: '/dashboard/api' },
    { icon: Settings, label: 'SETTINGS', path: '/profile' },
  ]

  return (
    <div style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      background: 'var(--bg)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '40px 24px',
      position: 'fixed',
      left: 0, top: 0,
      zIndex: 200
    }}>
      {/* BRAND */}
      <div style={{ marginBottom: '60px', padding: '0 12px' }}>
         <div style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--accent)' }}>ZURL</div>
         <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '4px' }}>
            PREMIUM SHORTENER
         </div>
      </div>

      {/* NAV LINKS */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 16px', borderRadius: 'var(--radius-md)',
              textDecoration: 'none', transition: 'all 0.2s',
              background: isActive ? 'var(--bg-secondary)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            })}
          >
            <item.icon size={20} />
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.05em' }}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ACTION & HELP (Image 2 inspired footer) */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
         <button
           onClick={() => onCreateLink ? onCreateLink() : navigate('/links')}
           style={{
            background: 'var(--accent)', color: '#000',
            border: 'none', borderRadius: 'var(--radius-full)',
            padding: '16px', fontWeight: 800, fontSize: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            cursor: 'pointer', boxShadow: '0 10px 20px rgba(203, 255, 0, 0.2)', width: '100%'
         }}>
            <Plus size={18} />
            Create New Link
         </button>

         <div style={{ padding: '0 12px' }}>
            <NavLink 
               to="/help"
               style={({ isActive }) => ({ 
                 display: 'flex', alignItems: 'center', gap: '12px', 
                 color: isActive ? 'var(--accent)' : 'var(--text-muted)', 
                 cursor: 'pointer', marginBottom: '20px', textDecoration: 'none',
                 transition: 'color 0.2s'
               })}
            >
               <HelpCircle size={18} />
               <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>HELP CENTER</span>
            </NavLink>
            <div 
               onClick={logout}
               style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ff4444', cursor: 'pointer' }}
            >
               <LogOut size={18} />
               <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>LOGOUT</span>
            </div>
         </div>
      </div>
    </div>
  )
}
