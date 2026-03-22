import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { Sun, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function Navbar({ pageTitle }: { pageTitle?: string }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { theme, toggle: toggleTheme } = useTheme()

  return (
    <nav style={{
      height: '56px',
      borderBottom: '1px solid #3F3F46',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      position: 'fixed',
      top: 0, left: 0, right: 0,
      background: 'rgba(9,9,11,0.9)',
      backdropFilter: 'blur(12px)',
      zIndex: 100,
    }}>
      {/* Left */}
      <Link to="/" style={{
        textDecoration: 'none',
        color: '#FAFAFA',
        fontSize: '18px',
        fontWeight: 700,
        letterSpacing: '-0.03em',
        textTransform: 'uppercase',
      }}>
        Zurl
      </Link>

      {/* Center */}
      {pageTitle && (
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--muted-foreground)',
        }}>
          {pageTitle}
        </span>
      )}

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user ? (
          <>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Dashboard
            </button>

            <button
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                transition: 'all 0.2s',
              }}
              className="nav-btn-hover"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={theme}
                  initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                </motion.div>
              </AnimatePresence>
            </button>
            <button
              onClick={logout}
              style={{
                background: 'transparent',
                border: '1px solid #3F3F46',
                color: '#ef4444',
                padding: '6px 12px',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Logout
            </button>
            {/* Avatar — clickable → /profile */}
            <button
              onClick={() => navigate('/profile')}
              title="My Profile"
              style={{
                width: '32px',
                height: '32px',
                border: '2px solid #DFE104',
                borderRadius: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
                color: '#DFE104',
                background: user.avatar ? 'transparent' : '#111',
                cursor: 'pointer',
                padding: 0,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                (user.name || user.email).charAt(0).toUpperCase()
              )}
            </button>
          </>
        ) : (
          <>
            <button onClick={() => navigate('/login')} style={{
              background: 'transparent',
              border: 'none',
              color: '#A1A1AA',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              Login
            </button>
            <button onClick={() => navigate('/register')} style={{
              background: '#DFE104',
              border: 'none',
              color: 'var(--primary-foreground)',
              padding: '8px 16px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              Sign Up
            </button>
          </>
        )}
      </div>
      <style>{`
        .nav-btn-hover:hover {
          color: var(--accent) !important;
          background: var(--accent-soft) !important;
        }
      `}</style>
    </nav>
  )
}
