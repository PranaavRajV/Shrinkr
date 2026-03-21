import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  Link2, MousePointer2, Plus, Copy, Trash2,
  Filter, BarChart2, Check,
  TrendingUp, Star, ExternalLink, AlertCircle, Lock, Tag, X, Search, Loader2, Edit2, Activity, Globe,
  Clock, MessageSquare, Pin, Zap, Terminal, Eye, EyeOff, Shield, Laptop, ChevronDown, ChevronUp, ChevronRight,
  Sparkles, QrCode
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
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [uRes, sRes] = await Promise.all([
        api.get('/api/urls', { params: { tag: filterTag } }),
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
  }, [filterTag, checkAllHealth])

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
    const matchSearch = !search ||
      url.originalUrl.toLowerCase().includes(search.toLowerCase()) ||
      url.shortCode.toLowerCase().includes(search.toLowerCase()) ||
      (url.ogData?.title && url.ogData.title.toLowerCase().includes(search.toLowerCase()))
    const matchTag = !filterTag || url.tags?.includes(filterTag)
    const matchPin = !pinFilter || url.isPinned
    return matchSearch && matchTag && matchPin
  }), sort)

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

  return (
    <Layout onCreateLink={() => setShowCreate(true)}>
      <AnimatePresence>
        {showFirstLinkBanner && (
          <motion.div 
            initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }}
            style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'var(--accent)', color: '#000', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 900, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Sparkles size={20} />
              <div>
                <div style={{ fontSize: '14px', letterSpacing: '0.05em' }}>FIRST LINK CREATED</div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>Share it with the world</div>
              </div>
            </div>
            <button onClick={() => setShowFirstLinkBanner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#000' }}><X size={20} /></button>
            <motion.div initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: 5, ease: 'linear' }} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'rgba(0,0,0,0.2)', transformOrigin: 'left' }} />
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
          <div>
            <RevealText text="Performance Snapshot" />
            <Reveal delay={0.2}><p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '4px' }}>Your ecosystem overview for the last 30 days.</p></Reveal>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Reveal delay={0.3} direction="down"><Magnetic><button onClick={handleExport} disabled={exporting} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '12px 20px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{exporting ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}{exporting ? 'Exporting...' : 'Export CSV'}</button></Magnetic></Reveal>
            <Reveal delay={0.4} direction="down"><Magnetic><button onClick={() => checkAllHealth(urls)} disabled={checkingHealth} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '12px 20px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.05em' }}><Activity size={14} className={checkingHealth ? 'animate-pulse' : ''} color={checkingHealth ? 'var(--accent)' : 'inherit'} />{checkingHealth ? 'Monitoring...' : 'Check Health'}</button></Magnetic></Reveal>
            <Reveal delay={0.5} direction="down"><Magnetic><button onClick={() => setShowCreate(true)} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '12px 24px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={16} /> New Link</button></Magnetic></Reveal>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '24px', marginBottom: '48px' }} >
          <Card3D><div className="neo-card" style={{ padding: '32px', height: '100%' }}><div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '20px' }}>TOTAL LINKS</div><div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}><div style={{ fontSize: '48px', fontWeight: 900 }}>{loading ? '—' : <CountUp value={stats.totalLinks} />}</div><div style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 700 }}><TrendingUp size={14} /></div></div></div></Card3D>
          <Card3D><div className="neo-card" style={{ padding: '32px', height: '100%' }}><div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '20px' }}>TOTAL CLICKS</div><div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}><div style={{ fontSize: '48px', fontWeight: 900 }}>{loading ? '—' : <CountUp value={stats.totalClicks} />}</div><div style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 700 }}><TrendingUp size={14} /></div></div></div></Card3D>
          <Card3D><div style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #111 100%)', border: '2px solid var(--accent)', borderRadius: 'var(--radius-lg)', padding: '32px', position: 'relative', height: '100%' }}><div style={{ position: 'absolute', top: '24px', right: '24px', color: 'var(--accent)' }}><Star size={24} fill="var(--accent)" /></div><div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '20px' }}>TOP PERFORMING</div>{topLink ? (<><div style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px', color: '#fff' }}>{baseUrl}/{topLink.shortCode}</div><div style={{ fontSize: '13px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '12px' }}>→ {topLink.originalUrl}</div><div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--accent)' }}><CountUp value={topLink.totalClicks || 0} /> <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>clicks</span></div></>) : <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No data...</div>}</div></Card3D>
        </div>

        <OnboardingChecklist urls={urls} />

        <div className="neo-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><h2 style={{ fontSize: '24px', fontWeight: 900 }}>Recent Links</h2><p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Monitor health and engagement in real-time.</p></div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px 10px 36px', fontSize: '12px', color: '#fff', outline: 'none', width: '220px' }} />
              </div>

              <select 
                value={sort} onChange={e => setSort(e.target.value)}
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 16px', fontSize: '11px', fontWeight: 800, color: '#fff', outline: 'none', cursor: 'pointer' }}
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
            {selectMode && selected.length > 0 && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ padding: '12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)' }}>{selected.length} SELECTED</div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button onClick={() => setSelected(urls.map(u => u.shortCode))} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>SELECT ALL</button>
                    <button onClick={() => setSelected([])} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>DESELECT</button>
                    <button onClick={handleBulkDelete} style={{ background: '#ff4444', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: 900, cursor: 'pointer' }}>DELETE SELECTED</button>
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
                <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>{['SHORT URL', 'ORIGINAL DESTINATION', 'HEALTH', 'STATUS', 'CLICKS', 'ACTIONS'].map(h => (<th key={h} style={{ padding: '20px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>))}</tr></thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filteredUrls.map((u) => (
                      <motion.tr key={u.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ borderBottom: '1px solid var(--border)', background: selected.includes(u.shortCode) ? 'rgba(203,255,0,0.03)' : 'none', borderLeft: selected.includes(u.shortCode) ? '4px solid var(--accent)' : 'none' }}>
                        <td style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {selectMode ? (
                              <input type="checkbox" checked={selected.includes(u.shortCode)} onChange={() => setSelected(prev => prev.includes(u.shortCode) ? prev.filter(s => s !== u.shortCode) : [...prev, u.shortCode])} style={{ accentColor: 'var(--accent)', cursor: 'pointer' }} />
                            ) : u.ogData?.favicon ? (<img src={u.ogData.favicon} style={{ width: '16px', height: '16px' }} />) : (<Globe size={14} color="var(--text-muted)" />)}
                            <a href={u.shortUrl} target="_blank" rel="noreferrer" style={{ color: '#fff', textDecoration: 'none', fontWeight: 800 }}>{baseUrl}/{u.shortCode}</a>
                          </div>
                        </td>
                        <td style={{ padding: '20px' }}>
                          <div style={{ maxWidth: '280px' }}>
                            <div style={{ color: '#fff', fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.ogData?.title || u.originalUrl}</div>
                            {u.clickGoal && (
                              <div style={{ marginTop: '8px' }}>
                                <div style={{ height: '3px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((u.totalClicks / u.clickGoal) * 100, 100)}%` }} style={{ height: '100%', background: 'var(--accent)' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '9px', fontWeight: 900, color: 'var(--text-muted)' }}>
                                  <span>{u.totalClicks} / {u.clickGoal} CLICKS</span>
                                  {u.totalClicks >= u.clickGoal && <span style={{ color: 'var(--accent)' }}>GOAL REACHED</span>}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '20px' }}>
                          {(() => {
                            const status = healthStatus[u.shortCode]
                            const color = !status ? '#333' : status.healthy ? '#CBFF00' : '#ff4444'
                            return (<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} /><span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)' }}>{!status ? '—' : status.healthy ? 'UP' : 'DOWN'}</span></div>)
                          })()}
                        </td>
                        <td style={{ padding: '20px' }}>
                          {(() => {
                            const status = u.expiresAt ? getExpiryStatus(u.expiresAt) : { label: 'ACTIVE', level: 'normal' }
                            return (<span style={{ fontSize: '10px', fontWeight: 900, padding: '3px 8px', borderRadius: '4px', background: status.level === 'danger' ? 'rgba(255,68,68,0.1)' : 'rgba(203,255,0,0.1)', color: status.level === 'danger' ? '#ff4444' : '#CBFF00' }}>{status.label}</span>)
                          })()}
                        </td>
                        <td style={{ padding: '20px' }}><div style={{ fontSize: '13px', fontWeight: 800 }}><CountUp value={u.totalClicks || 0} /></div></td>
                        <td style={{ padding: '20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', position: 'relative' }}>
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
                                      <button key={opt.id} onClick={() => handleCopy(u, opt.id as any)} className="dropdown-item" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', color: '#fff', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s' }}>
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
                    ))}
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
