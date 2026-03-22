import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  Copy, Trash2, BarChart2, Check, 
  Plus, Search, ExternalLink, AlertCircle, Edit2, Loader2, X
} from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import QRModal from '../components/QRModal'
import CreateLinkModal from '../components/CreateLinkModal'
import { format } from 'date-fns'
import { useNotifications } from '../contexts/NotificationContext'
import { Reveal, RevealText } from '../components/Reveal'
import Magnetic from '../components/Magnetic'
import CountUp from '../components/CountUp'

export default function Links() {
  const [urls, setUrls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])
  const [showCreate, setShowCreate] = useState(false)
  const [selectedQR, setSelectedQR] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const { addNotification } = useNotifications()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editUrl, setEditUrl] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })

  const fetchUrls = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/urls', { params: { page, limit: 15, search: debouncedSearch || undefined } })
      setUrls(res.data.data.urls || [])
      setPagination(res.data.data.pagination)
    } catch {
      toast.error('Failed to load links')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => { fetchUrls() }, [fetchUrls])

  const handleCopy = async (shortUrl: string, id: string) => {
    await navigator.clipboard.writeText(shortUrl)
    setCopiedId(id)
    toast.success('COPIED!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (shortCode: string, id: string) => {
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return }
    setConfirmDeleteId(null)
    setDeletingId(id)
    try {
      await api.delete(`/api/urls/${shortCode}`)
      toast.success('LINK DELETED')
      addNotification({ type: 'info', title: 'Link deleted', message: `Short link /${shortCode} was permanently removed.` })
      setUrls(prev => prev.filter(u => u.id !== id))
    } catch {
      toast.error('DELETE FAILED')
    } finally {
      setDeletingId(null)
    }
  }

  const startEdit = (u: any) => {
    setEditingId(u.id)
    setEditUrl(u.originalUrl)
  }

  const handleEdit = async (shortCode: string, id: string) => {
    try { new URL(editUrl) } catch { toast.error('Enter a valid URL'); return }
    try {
      await api.patch(`/api/urls/${shortCode}`, { originalUrl: editUrl })
      toast.success('LINK UPDATED')
      setUrls(prev => prev.map(u => u.id === id ? { ...u, originalUrl: editUrl } : u))
      setEditingId(null)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Update failed')
    }
  }

  const baseUrl = window.location.host

  return (
    <Layout onCreateLink={() => setShowCreate(true)}>
      <div style={{ padding: '40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <RevealText text="My Links" />
            <Reveal delay={0.2}>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '4px' }}>
                {pagination.total} total shortened URLs
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.3} direction="down">
            <Magnetic>
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  background: 'var(--accent)', color: 'var(--primary-foreground)', border: 'none',
                  padding: '14px 28px', borderRadius: 'var(--radius-full)',
                  fontSize: '12px', fontWeight: 900, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <Plus size={16} /> Create New Link
              </button>
            </Magnetic>
          </Reveal>
        </div>

        {/* Search */}
        <Reveal delay={0.4} direction="up" distance={20}>
          <div style={{ marginBottom: '24px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              data-cursor="text"
              placeholder="Search by URL or short code..."
              value={search}
              onChange={e => { 
                setSearch(e.target.value)
                setPage(1)
                setSearchParams(prev => {
                  if (e.target.value) prev.set('search', e.target.value)
                  else prev.delete('search')
                  return prev
                }, { replace: true })
              }}
              style={{
                width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', fontSize: '14px', padding: '14px 16px 14px 44px',
                borderRadius: '10px', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
            />
          </div>
        </Reveal>

        {/* Table */}
        <Reveal delay={0.5} direction="up" distance={20}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 800, letterSpacing: '0.2em' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <Loader2 size={24} color="var(--accent)" />
                </motion.div>
                <br />LOADING...
              </div>
            ) : urls.length === 0 ? (
              <div style={{ padding: '80px', textAlign: 'center' }}>
                <AlertCircle size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>
                  {search ? 'No results found' : 'No links yet'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                  {search ? 'Try adjusting your search.' : 'Create your first short URL.'}
                </div>
                {!search && (
                  <Magnetic>
                    <button
                      onClick={() => setShowCreate(true)}
                      style={{
                        background: 'var(--accent)', color: 'var(--primary-foreground)', border: 'none',
                        padding: '14px 32px', borderRadius: 'var(--radius-full)',
                        fontSize: '12px', fontWeight: 900, cursor: 'pointer'
                      }}
                    >CREATE MY FIRST LINK</button>
                  </Magnetic>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                      {['SHORT URL', 'ORIGINAL DESTINATION', 'TREND', 'CLICKS', 'STATUS', 'ACTIONS'].map(h => (
                        <th key={h} style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {urls.map((u, i) => (
                        <motion.tr 
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                          key={u.id} 
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'transparent' }} 
                          className="table-row-hover"
                        >
                          <td style={{ padding: '16px 20px' }}>
                            <a href={u.shortUrl} target="_blank" rel="noreferrer" data-cursor="hover" style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                              {baseUrl}/{u.shortCode}
                              <ExternalLink size={11} />
                            </a>
                          </td>
                          <td style={{ padding: '16px 20px', maxWidth: '260px' }}>
                            {editingId === u.id ? (
                              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', gap: '8px' }}>
                                <input
                                  value={editUrl}
                                  data-cursor="text"
                                  onChange={e => setEditUrl(e.target.value)}
                                  style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--accent)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', padding: '6px 10px', outline: 'none' }}
                                />
                                <button onClick={() => handleEdit(u.shortCode, u.id)} style={{ background: 'var(--accent)', color: 'var(--primary-foreground)', border: 'none', borderRadius: '6px', padding: '6px 12px', fontWeight: 800, fontSize: '11px', cursor: 'pointer' }}>SAVE</button>
                                <button onClick={() => setEditingId(null)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}><X size={12} /></button>
                              </motion.div>
                            ) : (
                              <div style={{ color: 'var(--text-muted)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {u.originalUrl}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ width: '60px', height: '20px' }}>
                              <svg width="60" height="20" viewBox="0 0 60 20">
                                <path
                                  d={`M ${ (u.sparkline || [0,0,0,0,0,0,0]).map((v: number, i: number) => `${i * 10} ${20 - (Math.min(v, 10) * 1.8)}`).join(' L ') }`}
                                  fill="none"
                                  stroke="var(--accent)"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  style={{ opacity: 0.5 }}
                                />
                              </svg>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            <span style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px', padding: '3px 10px', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                              <CountUp value={u.totalClicks || 0} />
                            </span>
                          </td>
                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            {(() => {
                              const now = new Date()
                              const exp = u.expiresAt ? new Date(u.expiresAt) : null
                              const isExpired = exp && exp < now
                              return (
                                <span style={{ 
                                  fontSize: '10px', fontWeight: 900, padding: '3px 8px', borderRadius: '4px',
                                  background: isExpired ? 'rgba(255,68,68,0.1)' : 'rgba(255,224,194,0.1)',
                                  color: isExpired ? '#ff4444' : '#ffe0c2',
                                  border: `1px solid ${isExpired ? 'rgba(255,68,68,0.2)' : 'rgba(255,224,194,0.2)'}`
                                }}>
                                  {isExpired ? 'EXPIRED' : exp ? `EXPIRES ${format(exp, 'MMM dd')}` : 'ACTIVE'}
                                </span>
                              )
                            })()}
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <Magnetic strength={0.2}>
                                <button title="Copy" onClick={() => handleCopy(u.shortUrl, u.id)} style={{ background: copiedId === u.id ? 'rgba(255,224,194,0.1)' : 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 8px', color: copiedId === u.id ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer' }}>
                                  {copiedId === u.id ? <Check size={13} className="animate-in" /> : <Copy size={13} />}
                                </button>
                              </Magnetic>
                              <Magnetic strength={0.2}>
                                <button title="Edit" onClick={() => startEdit(u)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 8px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                  <Edit2 size={13} />
                                </button>
                              </Magnetic>
                              <Magnetic strength={0.2}>
                                <button title="QR Code" onClick={() => setSelectedQR(u.shortUrl)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 8px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px', fontWeight: 800 }}>
                                  QR
                                </button>
                              </Magnetic>
                              <Magnetic strength={0.2}>
                                <Link title="Analytics" to={`/analytics/${u.shortCode}`} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                                  <BarChart2 size={13} />
                                </Link>
                              </Magnetic>
                              <div style={{ position: 'relative' }}>
                                {confirmDeleteId === u.id ? (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.9, x: 10 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    style={{ display: 'flex', gap: '4px', position: 'absolute', right: 0, top: '-15px', zIndex: 10, background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                  >
                                    <button onClick={() => setConfirmDeleteId(null)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 6px', color: '#666', cursor: 'pointer', fontSize: '9px', fontWeight: 800 }}>NO</button>
                                    <button onClick={() => handleDelete(u.shortCode, u.id)} disabled={deletingId === u.id} style={{ background: '#ff4444', border: 'none', borderRadius: '6px', padding: '4px 8px', color: 'var(--primary-foreground)', cursor: 'pointer', fontSize: '9px', fontWeight: 900 }}>
                                      {deletingId === u.id ? <Loader2 size={10} className="animate-spin" /> : 'YES'}
                                    </button>
                                  </motion.div>
                                ) : (
                                <Magnetic strength={0.2}>
                                  <button title="Delete" onClick={() => setConfirmDeleteId(u.id)} disabled={deletingId === u.id} style={{ background: 'none', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '6px', padding: '6px 8px', color: '#ff4444', cursor: 'pointer', opacity: deletingId === u.id ? 0.5 : 1 }}>
                                    <Trash2 size={13} />
                                  </button>
                                </Magnetic>
                                )}
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{ padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                  <Magnetic key={p}>
                    <button onClick={() => setPage(p)} style={{
                      width: '36px', height: '36px', borderRadius: '6px',
                      background: page === p ? 'var(--accent)' : 'var(--bg)',
                      color: page === p ? '#000' : 'var(--text-secondary)',
                      border: '1px solid var(--border)', fontWeight: 800, fontSize: '12px', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}>{p}</button>
                  </Magnetic>
                ))}
              </div>
            )}
          </div>
        </Reveal>
      </div>

      <AnimatePresence>
        {selectedQR && <QRModal shortUrl={selectedQR} onClose={() => setSelectedQR(null)} />}
        {showCreate && <CreateLinkModal onClose={() => setShowCreate(false)} onSuccess={fetchUrls} />}
      </AnimatePresence>

      <style>{`
        .table-row-hover { transition: background 0.2s ease; }
        .table-row-hover:hover { background: rgba(255, 224, 194, 0.02) !important; }
        .animate-in { animation: animateIn 0.2s ease-out forwards; }
        @keyframes animateIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </Layout>
  )
}
