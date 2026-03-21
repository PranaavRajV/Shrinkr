import { useState, useRef, useEffect } from 'react'
import { Search, Bell, ChevronDown, CheckCheck, Trash2, Link2, AlertCircle, Info } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications, type Notification } from '../contexts/NotificationContext'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'

const ICONS: Record<string, any> = {
  success: Link2,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info,
}

const COLORS: Record<string, string> = {
  success: '#CBFF00',
  error: '#ff4444',
  warning: '#f59e0b',
  info: '#60a5fa',
}

function NotifItem({ n, onRead, onNavigate }: { n: Notification; onRead: (id: string) => void; onNavigate: () => void }) {
  const Icon = ICONS[n.type] || Info
  const navigate = useNavigate()

  const handleClick = () => {
    onRead(n.id)
    if (n.link) { navigate(n.link); onNavigate() }
  }

  return (
    <div
      onClick={handleClick}
      style={{
        padding: '14px 20px',
        display: 'flex', gap: '14px', alignItems: 'flex-start',
        background: n.read ? 'transparent' : 'rgba(203,255,0,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        cursor: n.link ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
      onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(203,255,0,0.03)')}
    >
      {/* Icon + color dot */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '8px',
          background: `${COLORS[n.type]}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={COLORS[n.type]} />
        </div>
        {!n.read && (
          <div style={{
            position: 'absolute', top: '-2px', right: '-2px',
            width: '8px', height: '8px', background: '#CBFF00',
            borderRadius: '50%', border: '2px solid #0a0a0a'
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: n.read ? '#777' : '#fff', lineHeight: 1.3, marginBottom: '3px' }}>
          {n.title}
        </div>
        <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {n.message}
        </div>
        <div style={{ fontSize: '10px', color: '#444', marginTop: '5px', fontWeight: 600 }}>
          {formatDistanceToNow(n.time, { addSuffix: true })}
        </div>
      </div>
    </div>
  )
}

export default function Header() {
  const { user } = useAuth()
  const { notifications, unreadCount, markAllRead, markRead, clearAll } = useNotifications()
  const [showNotif, setShowNotif] = useState(false)
  const [showUser, setShowUser] = useState(false)
  const [search, setSearch] = useState('')
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div style={{
      height: 'var(--nav-height)',
      background: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
      position: 'sticky',
      top: 0,
      zIndex: 150,
    }}>
      {/* Search */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: '100%', maxWidth: '400px', background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-full)', padding: '10px 20px',
          display: 'flex', alignItems: 'center', gap: '12px',
          border: '1px solid var(--border)'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            placeholder="Search your links..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && search.trim()) { navigate(`/links?search=${encodeURIComponent(search.trim())}`); setSearch('') } }}
            style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: '13px', outline: 'none' }}
          />
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>

        {/* ── Notification Bell ───────────────────────────────────── */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowNotif(v => !v); setShowUser(false) }}
            style={{
              background: showNotif ? 'var(--bg-secondary)' : 'none',
              border: showNotif ? '1px solid var(--border)' : '1px solid transparent',
              borderRadius: '10px', padding: '8px',
              color: showNotif ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer', position: 'relative', display: 'flex',
              transition: 'all 0.2s'
            }}
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <div style={{
                position: 'absolute', top: '4px', right: '4px',
                minWidth: '16px', height: '16px', padding: '0 4px',
                background: '#CBFF00', borderRadius: '8px',
                border: '2px solid var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', fontWeight: 900, color: '#000'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </button>

          {/* Dropdown */}
          {showNotif && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: '0',
              width: '360px', background: '#111',
              border: '1px solid #1a1a1a', borderRadius: '14px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
              overflow: 'hidden', zIndex: 300,
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px', borderBottom: '1px solid #1a1a1a'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>
                  Notifications
                  {unreadCount > 0 && (
                    <span style={{ marginLeft: '8px', background: 'rgba(203,255,0,0.15)', color: '#CBFF00', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px' }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      title="Mark all as read"
                      style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                    >
                      <CheckCheck size={15} />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      title="Clear all"
                      style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Notif list */}
              <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '48px 20px', textAlign: 'center', color: '#444' }}>
                    <Bell size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>All caught up!</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>No notifications yet.</div>
                  </div>
                ) : (
                  notifications.map(n => (
                    <NotifItem key={n.id} n={n} onRead={markRead} onNavigate={() => setShowNotif(false)} />
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div style={{ padding: '12px 20px', borderTop: '1px solid #1a1a1a', textAlign: 'center' }}>
                  <button
                    onClick={() => { markAllRead(); setShowNotif(false) }}
                    style={{ background: 'none', border: 'none', color: '#555', fontSize: '12px', fontWeight: 800, cursor: 'pointer', letterSpacing: '0.05em' }}
                  >
                    MARK ALL AS READ
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── User Avatar ─────────────────────────────────────────── */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <div
            onClick={() => { setShowUser(v => !v); setShowNotif(false) }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>{user?.name || 'Professional User'}</div>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PREMIUM PLAN</div>
            </div>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%', background: 'var(--accent)',
              overflow: 'hidden', border: '2px solid var(--border)', flexShrink: 0
            }}>
              {user?.avatar ? (
                <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avatar" />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontWeight: 900, color: '#000', fontSize: '15px' }}>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <ChevronDown size={13} color="var(--text-muted)" style={{ transform: showUser ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>

          {showUser && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: '0',
              width: '200px', background: '#111',
              border: '1px solid #1a1a1a', borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              overflow: 'hidden', zIndex: 300
            }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #1a1a1a' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>{user?.name || 'Professional User'}</div>
                <div style={{ fontSize: '11px', color: '#555', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
              {[
                { label: 'Dashboard', path: '/dashboard' },
                { label: 'My Links', path: '/links' },
                { label: 'Analytics', path: '/analytics' },
                { label: 'Profile Settings', path: '/profile' },
              ].map(item => (
                <button key={item.path} onClick={() => { navigate(item.path); setShowUser(false) }} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '12px 16px', background: 'none', border: 'none',
                  color: '#aaa', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1a1a1a'; (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = '#aaa' }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
