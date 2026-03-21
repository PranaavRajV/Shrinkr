import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { 
  Copy, Trash2, BarChart2, Check, 
  Plus, Search, ExternalLink, AlertCircle, Edit2
} from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import QRModal from '../components/QRModal'
import CreateLinkModal from '../components/CreateLinkModal'
import { format } from 'date-fns'
import { useNotifications } from '../contexts/NotificationContext'

export default function Links() {
  const [urls, setUrls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
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
      const res = await api.get('/api/urls', { params: { page, limit: 15, search: search || undefined } })
      setUrls(res.data.data.urls || [])
      setPagination(res.data.data.pagination)
    } catch {
      toast.error('Failed to load links')
    } finally {
      setLoading(false)
    }
  }, [page, search])

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
      <div className="fade-in" style={{ padding: '40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-0.04em' }}>My Links</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '4px' }}>
              {pagination.total} total shortened URLs
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              background: 'var(--accent)', color: '#000', border: 'none',
              padding: '14px 28px', borderRadius: 'var(--radius-full)',
              fontSize: '12px', fontWeight: 900, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Plus size={16} /> Create New Link
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '24px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by URL or short code..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{
              width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              color: 'var(--text-primary)', fontSize: '14px', padding: '14px 16px 14px 44px',
              borderRadius: '10px', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Table */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 800, letterSpacing: '0.2em' }}>LOADING...</div>
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
                <button
                  onClick={() => setShowCreate(true)}
                  style={{
                    background: 'var(--accent)', color: '#000', border: 'none',
                    padding: '14px 32px', borderRadius: 'var(--radius-full)',
                    fontSize: '12px', fontWeight: 900, cursor: 'pointer'
                  }}
                >CREATE MY FIRST LINK</button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    {['SHORT URL', 'ORIGINAL DESTINATION', 'CLICKS', 'CREATED', 'EXPIRES', 'ACTIONS'].map(h => (
                      <th key={h} style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {urls.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="table-row-hover">
                      <td style={{ padding: '16px 20px' }}>
                        <a href={u.shortUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                          {baseUrl}/{u.shortCode}
                          <ExternalLink size={11} />
                        </a>
                      </td>
                      <td style={{ padding: '16px 20px', maxWidth: '260px' }}>
                        {editingId === u.id ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              value={editUrl}
                              onChange={e => setEditUrl(e.target.value)}
                              style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--accent)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', padding: '6px 10px', outline: 'none' }}
                            />
                            <button onClick={() => handleEdit(u.shortCode, u.id)} style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '6px', padding: '6px 12px', fontWeight: 800, fontSize: '11px', cursor: 'pointer' }}>SAVE</button>
                            <button onClick={() => setEditingId(null)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>✕</button>
                          </div>
                        ) : (
                          <div style={{ color: 'var(--text-muted)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.originalUrl}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                        <span style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px', padding: '3px 10px', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                          {(u.totalClicks || 0).toLocaleString()}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {format(new Date(u.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '12px', color: u.expiresAt ? 'var(--text-secondary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {u.expiresAt ? format(new Date(u.expiresAt), 'MMM dd, yyyy') : '—'}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button title="Copy" onClick={() => handleCopy(u.shortUrl, u.id)} style={{ background: copiedId === u.id ? 'rgba(203,255,0,0.1)' : 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 8px', color: copiedId === u.id ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer' }}>
                            {copiedId === u.id ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                          <button title="Edit" onClick={() => startEdit(u)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 8px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <Edit2 size={13} />
                          </button>
                          <button title="QR Code" onClick={() => setSelectedQR(u.shortUrl)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 8px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px', fontWeight: 800 }}>
                            QR
                          </button>
                          <Link title="Analytics" to={`/analytics/${u.shortCode}`} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                            <BarChart2 size={13} />
                          </Link>
                          {confirmDeleteId === u.id ? (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button onClick={() => setConfirmDeleteId(null)} style={{ background: 'none', border: '1px solid #333', borderRadius: '6px', padding: '5px 7px', color: '#666', cursor: 'pointer', fontSize: '10px', fontWeight: 800 }}>CANCEL</button>
                              <button onClick={() => handleDelete(u.shortCode, u.id)} disabled={deletingId === u.id} style={{ background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.5)', borderRadius: '6px', padding: '5px 8px', color: '#ff4444', cursor: 'pointer', fontSize: '10px', fontWeight: 900 }}>{deletingId === u.id ? '...' : 'CONFIRM?'}</button>
                            </div>
                          ) : (
                          <button title="Delete" onClick={() => handleDelete(u.shortCode, u.id)} disabled={deletingId === u.id} style={{ background: 'none', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '6px', padding: '6px 8px', color: '#ff4444', cursor: 'pointer', opacity: deletingId === u.id ? 0.5 : 1 }}>
                            <Trash2 size={13} />
                          </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{
                  width: '36px', height: '36px', borderRadius: '6px',
                  background: page === p ? 'var(--accent)' : 'var(--bg)',
                  color: page === p ? '#000' : 'var(--text-secondary)',
                  border: '1px solid var(--border)', fontWeight: 800, fontSize: '12px', cursor: 'pointer'
                }}>{p}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedQR && <QRModal shortUrl={selectedQR} onClose={() => setSelectedQR(null)} />}
        {showCreate && <CreateLinkModal onClose={() => setShowCreate(false)} onSuccess={fetchUrls} />}
      </AnimatePresence>

      <style>{`.table-row-hover:hover { background: rgba(203,255,0,0.02); }`}</style>
    </Layout>
  )
}
