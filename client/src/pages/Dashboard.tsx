import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  Link2, MousePointer2, Plus, Copy, Trash2,
  Filter, BarChart2, Check,
  TrendingUp, Star, ExternalLink, AlertCircle, Lock, Tag, X, Search, Loader2, Edit2, Activity, Globe,
  Clock, MessageSquare, Pin, Zap, Terminal, Eye, EyeOff, Shield, Laptop, ChevronDown, ChevronUp, ChevronRight,
  Sparkles, QrCode, List
} from 'lucide-react'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import ShortcutsModal from '../components/ShortcutsModal'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import BulkUpload from '../components/BulkUpload'
import QRModal from '../components/QRModal'
import CreateLinkModal from '../components/CreateLinkModal'
import EmptyState from '../components/EmptyState'
import OnboardingChecklist from '../components/OnboardingChecklist'
import { useNotifications } from '../contexts/NotificationContext'
import { format, formatDistanceToNow } from 'date-fns'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { Reveal, RevealText } from '../components/Reveal'
import Card3D from '../components/Card3D'
import Magnetic from '../components/Magnetic'
import CountUp from '../components/CountUp'
import confetti from 'canvas-confetti'

export default function Dashboard() {
  const { user } = useAuth()
  const [urls, setUrls] = useState<any[]>([])
  const [stats, setStats] = useState({ totalLinks: 0, totalClicks: 0 })
  const [loading, setLoading] = useState(true)
  const [showBulk, setShowBulk] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const { theme, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [dismissedExpiring, setDismissedExpiring] = useState<string[]>([])
  const [showExpiredHint, setShowExpiredHint] = useState(true)
  const [selectedQR, setSelectedQR] = useState<string | null>(null)
  const [isMonthly, setIsMonthly] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { addNotification } = useNotifications()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showRecent, setShowRecent] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editUrl, setEditUrl] = useState('')
  const [noteEditingId, setNoteEditingId] = useState<string | null>(null)
  const [noteValue, setNoteValue] = useState('')
  const [pinFilter, setPinFilter] = useState(false)
  const [healthStatus, setHealthStatus] = useState<Record<string, any>>({})
  const [checkingHealth, setCheckingHealth] = useState(false)
  const [webhookEditingId, setWebhookEditingId] = useState<string | null>(null)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showFirstLinkBanner, setShowFirstLinkBanner] = useState(false)
  const [sort, setSort] = useState(localStorage.getItem('shrinkr_sort') || 'newest')
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [copyDropdownId, setCopyDropdownId] = useState<string | null>(null)
  const isInitialMount = useRef(true)

  const checkAllHealth = useCallback(async (targets: any[]) => {
    if (targets.length === 0) return
    setCheckingHealth(true)
    const results = await Promise.allSettled(
      targets.map(u => api.get(`/api/urls/${u.shortCode}/health`))
    )
    
    setHealthStatus(prev => {
      const next = { ...prev }
      results.forEach((res, i) => {
        const shortCode = targets[i].shortCode
        if (res.status === 'fulfilled') {
          next[shortCode] = res.value.data.data
        } else {
          next[shortCode] = { healthy: false, error: 'Network Error' }
        }
      })
      return next
    })
    setCheckingHealth(false)
    toast.success('MONITORING SYNC COMPLETE ✓')
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [uRes, sRes] = await Promise.all([
        api.get('/api/urls', { params: { tag: filterTag, search: debouncedSearch || undefined, limit: 100 } }),
        api.get('/api/users/me/stats')
      ])
      const fetchedUrls = uRes.data.data.urls || []
      
      // CONFETTI LOGIC
      const hasCreatedBefore = () => {
        try { return localStorage.getItem('shrinkr_first_link') === 'true' }
        catch { return true }
      }

      if (fetchedUrls.length > 0 && !hasCreatedBefore()) {
        localStorage.setItem('shrinkr_first_link', 'true')
        confetti({
          particleCount: 100, spread: 70, origin: { y: 0.6 },
          colors: [getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(), '#ffffff', '#888888']
        })
        setTimeout(() => {
          confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } })
          confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } })
        }, 200)
        setShowFirstLinkBanner(true)
        setTimeout(() => setShowFirstLinkBanner(false), 5000)
      }

      setUrls(fetchedUrls)
      setStats(sRes.data.data.stats || { totalLinks: 0, totalClicks: 0 })
      
      // Auto-check health on load
      if (isInitialMount.current) {
        checkAllHealth(fetchedUrls)
        isInitialMount.current = false
      }
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [filterTag, debouncedSearch, checkAllHealth])

  const sortUrls = (urls: any[], sortType: string) => {
    const sorted = [...urls]
    switch(sortType) {
      case 'newest': return sorted.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case 'oldest': return sorted.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      case 'clicks-desc': return sorted.sort((a,b) => (b.totalClicks||0) - (a.totalClicks||0))
      case 'clicks-asc': return sorted.sort((a,b) => (a.totalClicks||0) - (b.totalClicks||0))
      case 'a-z': return sorted.sort((a,b) => a.shortCode.localeCompare(b.shortCode))
      case 'z-a': return sorted.sort((a,b) => b.shortCode.localeCompare(a.shortCode))
      case 'expiry': return sorted.sort((a,b) => {
        if (!a.expiresAt) return 1
        if (!b.expiresAt) return -1
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
      })
      case 'recent-click': return sorted.sort((a,b) => {
        if (!a.lastClickAt) return 1
        if (!b.lastClickAt) return -1
        return new Date(b.lastClickAt).getTime() - new Date(a.lastClickAt).getTime()
      })
      default: return sorted
    }
  }

  const filteredUrls = sortUrls(urls.filter(url => {
    const matchTag = !filterTag || url.tags?.includes(filterTag)
    const matchPin = !pinFilter || url.isPinned
    return matchTag && matchPin
  }), sort)

  const pinnedUrls = filteredUrls.filter(u => u.isPinned)
  const otherUrls = filteredUrls.filter(u => !u.isPinned)

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => { localStorage.setItem('shrinkr_sort', sort) }, [sort])

  const handleCopy = async (u: any, type: 'url' | 'markdown' | 'html' | 'original' = 'url') => {
    let text = u.shortUrl
    let label = 'Short URL copied'
    
    if (type === 'markdown') {
      text = `[${u.ogData?.title || u.shortCode}](${u.shortUrl})`
      label = 'Markdown copied'
    } else if (type === 'html') {
      text = `<a href="${u.shortUrl}">${u.ogData?.title || u.shortCode}</a>`
      label = 'HTML copied'
    } else if (type === 'original') {
      text = u.originalUrl
      label = 'Original URL copied'
    }

    await navigator.clipboard.writeText(text)
    setCopiedId(u.id)
    setCopyDropdownId(null)
    toast.success(label)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Permanently delete ${selected.length} links?`)) return
    const tid = toast.loading('DELETING LINKS...')
    try {
      await api.delete('/api/urls', { data: { shortCodes: selected } })
      setUrls(prev => prev.filter(u => !selected.includes(u.shortCode)))
      setSelected([])
      setSelectMode(false)
      toast.success(`${selected.length} LINKS DELETED`, { id: tid })
    } catch {
      toast.error('BULK DELETE FAILED', { id: tid })
    }
  }

  const handlePin = async (shortCode: string, id: string) => {
    const originalUrls = [...urls]
    setUrls(prev => prev.map(u => u.id === id ? { ...u, isPinned: !u.isPinned } : u))
    try {
      await api.patch(`/api/urls/${shortCode}/pin`)
      toast.success('LINK PINNED ✓')
    } catch {
      setUrls(originalUrls)
      toast.error('PIN FAILED')
    }
  }

  const handleExport = async () => {
    setExporting(true)
    const tid = toast.loading('PREPARING CSV...')
    try {
      const res = await api.get('/api/urls/export', { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `shrinkr-links-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('LINKS EXPORTED ✓', { id: tid })
    } catch {
      toast.error('EXPORT FAILED', { id: tid })
    } finally {
      setExporting(false)
    }
  }

  const getExpiryStatus = (expiresAt: string) => {
    const now = new Date(); const exp = new Date(expiresAt)
    const diff = exp.getTime() - now.getTime()
    const hours = diff / (1000 * 60 * 60); const days = hours / 24
    if (diff < 0) return { label: 'EXPIRED', level: 'danger' }
    if (hours < 1) return { label: 'EXPIRES SOON', level: 'danger' }
    if (hours < 24) return { label: `EXPIRES IN ${Math.floor(hours)}H`, level: 'warning' }
    if (days < 7) return { label: `EXPIRES IN ${Math.floor(days)}D`, level: 'warning' }
    return { label: format(exp, 'MMM dd, yyyy'), level: 'normal' }
  }

  const handleDelete = async (shortCode: string, id: string) => {
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return }
    setConfirmDeleteId(null)
    setDeletingId(id)
    try {
      await api.delete(`/api/urls/${shortCode}`)
      toast.success('LINK DELETED')
      setUrls(prev => prev.filter(u => u.id !== id))
      setStats(prev => ({ ...prev, totalLinks: Math.max(0, prev.totalLinks - 1) }))
    } catch {
      toast.error('DELETE FAILED')
    } finally { setDeletingId(null) }
  }

  const handleEdit = async (shortCode: string, id: string) => {
    try { new URL(editUrl) } catch { toast.error('Enter a valid URL'); return }
    try {
      await api.patch(`/api/urls/${shortCode}`, { originalUrl: editUrl })
      toast.success('LINK UPDATED')
      setUrls(prev => prev.map(u => u.id === id ? { ...u, originalUrl: editUrl } : u))
      setEditingId(null)
    } catch (err: any) { toast.error(err.response?.data?.error || 'Update failed') }
  }

  const topLink = urls.length > 0 ? urls.reduce((prev, cur) => ((prev.totalClicks || 0) > (cur.totalClicks || 0) ? prev : cur)) : null
  const baseUrl = window.location.host

  const renderUrlRow = (u: any, isPinned = false) => (
    <motion.tr 
      key={u.id} 
      layout 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      style={{ 
        borderBottom: '1px solid var(--border)', 
        background: selected.includes(u.shortCode) ? 'rgba(255,224,194,0.03)' : 'none', 
        borderLeft: selected.includes(u.shortCode) ? '4px solid var(--accent)' : isPinned ? '2px solid var(--accent)' : 'none',
        position: 'relative'
      }}
    >
      <td style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {selectMode ? (
            <input type="checkbox" checked={selected.includes(u.shortCode)} onChange={() => setSelected(prev => prev.includes(u.shortCode) ? prev.filter(s => s !== u.shortCode) : [...prev, u.shortCode])} style={{ accentColor: 'var(--accent)', cursor: 'pointer' }} />
          ) : u.ogData?.favicon ? (<img src={u.ogData.favicon} style={{ width: '16px', height: '16px' }} />) : (<Globe size={14} color="var(--text-muted)" />)}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <a href={u.shortUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--foreground)', textDecoration: 'none', fontWeight: 800 }}>{baseUrl}/{u.shortCode}</a>
            {u.linkPassword && (
              <div style={{ position: 'relative' }} className="lock-tooltip-trigger">
                <Lock size={12} color="var(--accent)" />
                <style>{`
                  .lock-tooltip-trigger::after {
                    content: 'PASSWORD PROTECTED';
                    position: absolute;
                    bottom: calc(100% + 6px);
                    left: 50%;
                    transform: translateX(-50%);
                    background: #111;
                    border: 1px solid var(--border);
                    padding: 4px 8px;
                    font-size: 9px;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    white-space: nowrap;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 150ms;
                    z-index: 100;
                  }
                  .lock-tooltip-trigger:hover::after { opacity: 1; }
                `}</style>
              </div>
            )}
            {u.webhookUrl && <Zap size={12} color="var(--accent)" />}
          </div>
        </div>
        {isPinned && (
          <span style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '9px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '0.2em' }}>
            PINNED
          </span>
        )}
      </td>
      <td style={{ padding: '20px' }}>
        <div style={{ maxWidth: '280px' }}>
          <div style={{ color: 'var(--foreground)', fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.ogData?.title || u.originalUrl}</div>
          {u.clickGoal && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '9px', fontWeight: 900, letterSpacing: '0.1em' }}>
                <span style={{ color: 'var(--text-muted)' }}>{u.totalClicks} / {u.clickGoal} CLICKS</span>
                <span style={{ color: u.totalClicks >= u.clickGoal ? 'var(--accent)' : 'var(--accent)' }}>{Math.floor(Math.min((u.totalClicks / u.clickGoal) * 100, 100))}%</span>
              </div>
              <div style={{ height: '2px', background: 'var(--muted)', borderRadius: 0, overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${Math.min((u.totalClicks / u.clickGoal) * 100, 100)}%` }} 
                  transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                  style={{ 
                    height: '100%', 
                    background: 'var(--accent)',
                    boxShadow: u.totalClicks >= u.clickGoal ? '0 0 10px var(--accent)' : 'none'
                  }} 
                />
              </div>
            </div>
          )}
        </div>
      </td>
      <td style={{ padding: '20px' }}>
        {(() => {
          const status = healthStatus[u.shortCode]
          const color = !status ? '#333' : status.healthy ? '#ffe0c2' : '#ff4444'
          return (<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: status?.healthy ? '0 0 10px rgba(255, 224, 194, 0.4)' : 'none' }} /><span style={{ fontSize: '10px', fontWeight: 900, color: status?.healthy ? 'var(--accent)' : 'var(--text-muted)' }}>{!status ? 'WAIT' : status.healthy ? 'STABLE' : 'OFFLINE'}</span></div>)
        })()}
      </td>
      <td style={{ padding: '20px' }}>
        {(() => {
          const status = u.expiresAt ? getExpiryStatus(u.expiresAt) : { label: 'ACTIVE', level: 'normal' }
          return (<span style={{ fontSize: '10px', fontWeight: 900, padding: '3px 8px', borderRadius: '4px', background: status.level === 'danger' ? 'rgba(255,68,68,0.1)' : 'rgba(255,224,194,0.1)', color: status.level === 'danger' ? '#ff4444' : '#ffe0c2' }}>{status.label}</span>)
        })()}
      </td>
      <td style={{ padding: '20px' }}><div style={{ fontSize: '13px', fontWeight: 800 }}><CountUp value={u.totalClicks || 0} /></div></td>
      <td style={{ padding: '20px', textAlign: 'right' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', position: 'relative' }}>
          <button 
            onClick={() => handlePin(u.shortCode, u.id)}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', color: u.isPinned ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Star size={14} fill={u.isPinned ? 'var(--accent)' : 'none'} style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
          </button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setCopyDropdownId(copyDropdownId === u.id ? null : u.id)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 8px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Copy size={14} /><ChevronDown size={10} /></button>
            <AnimatePresence>
              {copyDropdownId === u.id && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1100, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', width: '200px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', marginTop: '8px' }}>
                  {[
                    { id: 'url', label: 'Copy URL', desc: 'Plain short link' },
                    { id: 'markdown', label: 'Markdown', desc: 'Link with title' },
                    { id: 'html', label: 'HTML', desc: 'Anchor tag' },
                    { id: 'original', label: 'Original URL', desc: 'Destination link' }
                  ].map(opt => (
                    <button key={opt.id} onClick={() => handleCopy(u, opt.id as any)} className="dropdown-item" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', color: 'var(--foreground)', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s' }}>
                      <div style={{ fontWeight: 800 }}>{opt.label}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{opt.desc}</div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => setSelectedQR(u.shortUrl)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text-muted)', cursor: 'pointer' }}><QrCode size={14} /></button>
          <Link to={`/analytics/${u.shortCode}`} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text-muted)', display: 'flex' }}><BarChart2 size={14} /></Link>
          <button onClick={() => handleDelete(u.shortCode, u.id)} style={{ background: 'none', border: '1px solid #311', color: '#ff4444', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}><Trash2 size={14} /></button>
        </div>
      </td>
    </motion.tr>
  )

  return (
    <Layout onCreateLink={() => setShowCreate(true)}>
      <AnimatePresence>
        {showFirstLinkBanner && (
          <motion.div 
            initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }}
            style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'var(--accent)', color: 'var(--primary-foreground)', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 900, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Sparkles size={20} />
              <div>
                <div style={{ fontSize: '14px', letterSpacing: '0.05em' }}>FIRST LINK CREATED</div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>Share it with the world</div>
              </div>
            </div>
            <button onClick={() => setShowFirstLinkBanner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-foreground)' }}><X size={20} /></button>
            <motion.div initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: 5, ease: 'linear' }} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'rgba(0,0,0,0.2)', transformOrigin: 'left' }} />
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
          <div>
            <h1 className="font-display" style={{ fontSize: '42px', color: '#fff', letterSpacing: '-0.04em' }}>Performance Snapshot</h1>
            <Reveal delay={0.2}><p style={{ color: 'var(--text-muted)', fontSize: '16px', marginTop: '6px', fontWeight: 500 }}>Your ecosystem overview for the last 30 days.</p></Reveal>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Reveal delay={0.3} direction="down"><Magnetic><button onClick={handleExport} disabled={exporting} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '12px 20px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{exporting ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}{exporting ? 'Exporting...' : 'Export CSV'}</button></Magnetic></Reveal>
            <Reveal delay={0.35} direction="down"><Magnetic><button onClick={() => setShowBulk(true)} style={{ background: 'rgba(255,224,194,0.05)', color: 'var(--accent)', border: '1px solid rgba(255,224,194,0.2)', padding: '12px 20px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.05em' }}><List size={14} /> Bulk Upload</button></Magnetic></Reveal>
            <Reveal delay={0.4} direction="down"><Magnetic><button onClick={() => checkAllHealth(urls)} disabled={checkingHealth} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '12px 20px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.05em' }}><Activity size={14} className={checkingHealth ? 'animate-pulse' : ''} color={checkingHealth ? 'var(--accent)' : 'inherit'} />{checkingHealth ? 'Monitoring...' : 'Check Health'}</button></Magnetic></Reveal>
            <Reveal delay={0.5} direction="down"><Magnetic><button className="premium-gradient" onClick={() => setShowCreate(true)} style={{ color: '#000', border: 'none', padding: '14px 28px', borderRadius: 'var(--radius)', fontSize: '12px', fontWeight: 950, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: '0 10px 30px rgba(255, 224, 194, 0.2)' }}><Plus size={16} strokeWidth={3} /> New Link</button></Magnetic></Reveal>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '48px' }}>
          {[
            { label: 'Ecosystem Reach', value: stats.totalClicks, icon: MousePointer2, trend: '+12.5%', color: 'var(--accent)' },
            { label: 'Network Entities', value: stats.totalLinks, icon: Link2, trend: '+3', color: '#fff' },
            { label: 'Peak Performance', value: topLink?.totalClicks || 0, icon: TrendingUp, trend: 'Top Tier', color: '#fff' },
            { label: 'Global Availability', value: '100%', icon: Globe, trend: 'STABLE', color: '#ffe0c2' }
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="neo-card" style={{ padding: '32px', background: 'rgba(255,255,255,0.02)', height: '100%', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: i === 0 || i === 3 ? 'rgba(255, 224, 194, 0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.icon size={22} color={s.color} strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 950, color: i === 0 ? 'var(--accent)' : 'var(--text-muted)', letterSpacing: '0.12em', background: i === 0 ? 'rgba(255, 224, 194, 0.05)' : 'none', padding: '4px 10px', borderRadius: '20px' }}>{s.trend}</span>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '8px', opacity: 0.7 }}>{s.label}</div>
                <div className="font-display" style={{ fontSize: '42px', color: '#fff', letterSpacing: '-0.02em' }}>
                  {loading ? '—' : <CountUp value={typeof s.value === 'string' ? 100 : s.value} />}
                  {typeof s.value === 'string' ? '%' : ''}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <OnboardingChecklist urls={urls} user={user} />

        <div className="neo-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><h2 style={{ fontSize: '24px', fontWeight: 900 }}>Recent Links</h2><p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Monitor health and engagement in real-time.</p></div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  onFocus={() => setShowRecent(true)}
                  onBlur={() => setTimeout(() => setShowRecent(false), 200) }
                  onKeyDown={e => {
                    if (e.key === 'Enter' && search.trim()) {
                      const updated = [search.trim(), ...recentSearches.filter(s => s !== search.trim())].slice(0, 5)
                      setRecentSearches(updated)
                      localStorage.setItem('shrinkr_recent_searches', JSON.stringify(updated))
                    }
                  }}
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px 10px 36px', fontSize: '12px', color: 'var(--foreground)', outline: 'none', width: '220px' }} 
                />
                
                <AnimatePresence>
                  {showRecent && (
                    <motion.div 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      style={{ 
                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 1200, 
                        background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px',
                        maxHeight: '240px', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                      }}
                    >
                      <div style={{ padding: '10px 14px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>RECENT SEARCHES</span>
                        <button 
                          onMouseDown={(e) => { e.preventDefault(); setRecentSearches([]); localStorage.removeItem('shrinkr_recent_searches') }}
                          style={{ background: 'none', border: 'none', fontSize: '9px', fontWeight: 900, color: 'var(--muted-foreground)', cursor: 'pointer', letterSpacing: '0.05em' }}
                        >CLEAR ALL</button>
                      </div>
                      {recentSearches.length === 0 ? (
                        <div style={{ padding: '20px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--muted-foreground)', letterSpacing: '0.1em' }}>NO RECENT SEARCHES</div>
                      ) : (
                        recentSearches.map((s, idx) => (
                          <div 
                            key={idx} 
                            onMouseDown={(e) => { e.preventDefault(); setSearch(s); setShowRecent(false) }}
                            style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'background 100ms' }}
                            className="search-item"
                          >
                            <Clock size={12} style={{ color: 'var(--muted-foreground)' }} />
                            <span style={{ fontSize: '13px', fontWeight: 600, flex: 1 }}>{s}</span>
                            <X 
                              size={12} 
                              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); const next = recentSearches.filter(item => item !== s); setRecentSearches(next); localStorage.setItem('shrinkr_recent_searches', JSON.stringify(next)) }}
                              style={{ color: 'var(--muted-foreground)', cursor: 'pointer' }} 
                            />
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <select 
                value={sort} onChange={e => setSort(e.target.value)}
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--foreground)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="newest">NEWEST FIRST</option>
                <option value="oldest">OLDEST FIRST</option>
                <option value="clicks-desc">MOST CLICKS</option>
                <option value="clicks-asc">LEAST CLICKS</option>
                <option value="a-z">A → Z</option>
                <option value="z-a">Z → A</option>
                <option value="expiry">EXPIRING SOON</option>
                <option value="recent-click">RECENTLY CLICKED</option>
              </select>

              <button 
                onClick={() => { setSelectMode(!selectMode); setSelected([]) }}
                style={{ background: selectMode ? 'var(--accent)' : 'none', border: '1px solid var(--border)', color: selectMode ? '#000' : 'var(--text-secondary)', padding: '10px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
              >
                {selectMode ? 'CANCEL' : 'SELECT'}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {selectMode && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }} 
                style={{ 
                  background: 'var(--bg)', 
                  borderBottom: '1px solid var(--border)', 
                  overflow: 'hidden',
                  zIndex: 100 
                }}
              >
                <div style={{ padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: selected.length > 0 ? 'var(--accent)' : 'var(--text-muted)', fontSize: '14px', transition: 'all 0.3s' }}>{selected.length}</span>
                      <span>SELECTED</span>
                    </div>
                    <div style={{ height: '12px', width: '1px', background: 'var(--border)' }} />
                    <button onClick={() => setSelected(urls.map(u => u.shortCode))} style={{ background: 'none', border: 'none', color: 'var(--foreground)', fontSize: '10px', fontWeight: 900, cursor: 'pointer', letterSpacing: '0.05em' }}>SELECT ALL</button>
                    <button onClick={() => setSelected([])} style={{ background: 'none', border: 'none', color: 'var(--foreground)', fontSize: '10px', fontWeight: 900, cursor: 'pointer', letterSpacing: '0.05em' }}>CLEAR</button>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <AnimatePresence>
                      {selected.length > 0 && (
                        <motion.button 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          onClick={handleBulkDelete} 
                          className="bulk-delete-btn"
                          style={{ 
                            background: 'rgba(255,68,68,0.1)', 
                            color: '#ff4444', 
                            border: '1px solid rgba(255,68,68,0.2)', 
                            padding: '8px 20px', 
                            borderRadius: '6px', 
                            fontSize: '11px', 
                            fontWeight: 900, 
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            letterSpacing: '0.05em'
                          }}
                        >
                          DELETE SELECTED
                          <style>{`
                            .bulk-delete-btn:hover {
                              background: #ff4444 !important;
                              color: #fff !important;
                              box-shadow: 0 0 20px rgba(255,68,68,0.3);
                            }
                          `}</style>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div style={{ padding: '100px', textAlign: 'center' }}><Loader2 size={32} color="var(--accent)" className="animate-spin" /></div>
          ) : filteredUrls.length === 0 ? (
            <EmptyState type={search ? 'search' : pinFilter ? 'pinned' : 'links'} action={!search && !pinFilter ? { label: 'Create First Link', onClick: () => setShowCreate(true) } : undefined} />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    {['SHORT URL', 'ORIGINAL DESTINATION', 'HEALTH', 'STATUS', 'CLICKS', 'ACTIONS'].map(h => (
                      <th key={h} style={{ padding: '20px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pinnedUrls.length > 0 && (
                    <>
                      <tr style={{ background: 'none' }}>
                        <td colSpan={6} style={{ padding: '8px 28px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>PINNED</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                          </div>
                        </td>
                      </tr>
                      <AnimatePresence mode="popLayout">
                        {pinnedUrls.map(u => renderUrlRow(u, true))}
                      </AnimatePresence>
                      <tr style={{ background: 'none' }}>
                        <td colSpan={6} style={{ padding: '8px 28px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>ALL LINKS</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                          </div>
                        </td>
                      </tr>
                    </>
                  )}
                  <AnimatePresence mode="popLayout">
                    {otherUrls.map(u => renderUrlRow(u))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {showBulk && <BulkUpload onClose={() => setShowBulk(false)} onSuccess={fetchData} />}
        {selectedQR && <QRModal shortUrl={selectedQR} onClose={() => setSelectedQR(null)} />}
        {showCreate && <CreateLinkModal onClose={() => setShowCreate(false)} onSuccess={fetchData} />}
        {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
      </AnimatePresence>
      <style>{`
        .dropdown-item:hover { background: rgba(255,255,255,0.05) !important; color: var(--accent) !important; }
        .skeleton { background: linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite; }
        @keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </Layout>
  )
}
