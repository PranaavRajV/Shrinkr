import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { 
  Link2, MousePointer2, Plus, Copy, Trash2,
  Filter, BarChart2, Check,
  TrendingUp, Star, ExternalLink, AlertCircle
} from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import BulkUpload from '../components/BulkUpload'
import QRModal from '../components/QRModal'
import CreateLinkModal from '../components/CreateLinkModal'
import { useNotifications } from '../contexts/NotificationContext'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [urls, setUrls] = useState<any[]>([])
  const [stats, setStats] = useState({ totalLinks: 0, totalClicks: 0 })
  const [loading, setLoading] = useState(true)
  const [showBulk, setShowBulk] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedQR, setSelectedQR] = useState<string | null>(null)
  const [isMonthly, setIsMonthly] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { addNotification } = useNotifications()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [uRes, sRes] = await Promise.all([
        api.get('/api/urls'),
        api.get('/api/users/me/stats')
      ])
      setUrls(uRes.data.data.urls || [])
      setStats(sRes.data.data.stats || { totalLinks: 0, totalClicks: 0 })
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCopy = async (shortUrl: string, id: string) => {
    await navigator.clipboard.writeText(shortUrl)
    setCopiedId(id)
    toast.success('SHORT URL COPIED')
    addNotification({ type: 'success', title: 'Link copied!', message: `${shortUrl} is in your clipboard.` })
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
      setStats(prev => ({ ...prev, totalLinks: Math.max(0, prev.totalLinks - 1) }))
    } catch {
      toast.error('DELETE FAILED')
    } finally {
      setDeletingId(null)
    }
  }

  const topLink = urls.length > 0
    ? urls.reduce((prev, cur) => ((prev.totalClicks || 0) > (cur.totalClicks || 0) ? prev : cur))
    : null

  const baseUrl = window.location.host

  return (
    <Layout onCreateLink={() => setShowCreate(true)}>
      <div className="fade-in" style={{ padding: '40px' }}>

        {/* ── HEADER ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
          <div>
            <h1 style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-0.04em' }}>Performance Snapshot</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '4px' }}>
              Your ecosystem overview for the last 30 days.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              display: 'flex', background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-full)', padding: '4px', border: '1px solid var(--border)'
            }}>
              {['MONTHLY', 'YEARLY'].map(label => (
                <button key={label}
                  onClick={() => setIsMonthly(label === 'MONTHLY')}
                  style={{
                    padding: '8px 24px', fontSize: '11px', fontWeight: 800,
                    border: 'none', borderRadius: 'var(--radius-full)',
                    background: (isMonthly === (label === 'MONTHLY')) ? 'var(--accent)' : 'transparent',
                    color: (isMonthly === (label === 'MONTHLY')) ? '#000' : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >{label}</button>
              ))}
            </div>

            <button
              onClick={() => setShowCreate(true)}
              style={{
                background: 'var(--accent)', color: '#000', border: 'none',
                padding: '12px 24px', borderRadius: 'var(--radius-full)',
                fontSize: '12px', fontWeight: 900, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <Plus size={16} /> New Link
            </button>
          </div>
        </div>

        {/* ── METRIC CARDS ─────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,1fr) minmax(240px,1fr) 1.5fr', gap: '24px', marginBottom: '48px' }}>

          {/* Total Links */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '20px' }}>TOTAL LINKS</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <div style={{ fontSize: '48px', fontWeight: 900 }}>
                {loading ? '—' : stats.totalLinks.toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 700 }}>
                <TrendingUp size={14} style={{ marginLeft: '4px' }} />
              </div>
            </div>
            <div style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>
              <Link2 size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              All active shortened URLs
            </div>
          </div>

          {/* Total Clicks */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '20px' }}>TOTAL CLICKS</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <div style={{ fontSize: '48px', fontWeight: 900 }}>
                {loading ? '—' : stats.totalClicks >= 1000 ? `${(stats.totalClicks / 1000).toFixed(1)}K` : stats.totalClicks.toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 700 }}>
                <TrendingUp size={14} style={{ marginLeft: '4px' }} />
              </div>
            </div>
            <div style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>
              <MousePointer2 size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Across all links
            </div>
          </div>

          {/* Top Performing Link */}
          <div style={{
            background: 'linear-gradient(135deg, #1A1A1A 0%, #111 100%)',
            border: '2px solid var(--accent)',
            boxShadow: '0 20px 40px rgba(203, 255, 0, 0.05)',
            borderRadius: 'var(--radius-lg)', padding: '32px', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '24px', right: '24px', color: 'var(--accent)' }}>
              <Star size={24} fill="var(--accent)" />
            </div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '20px' }}>
              TOP PERFORMING LINK
            </div>
            {topLink ? (
              <>
                <div style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.02em', color: '#fff', wordBreak: 'break-all' }}>
                  {baseUrl}/{topLink.shortCode}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  → {topLink.originalUrl}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--accent)' }}>
                  {(topLink.totalClicks || 0).toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>clicks</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No data available yet...</div>
            )}
          </div>
        </div>

        {/* ── RECENT LINKS TABLE ───────────────────────────────────── */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em' }}>Recent Links</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Manage and monitor your shortened URLs.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowBulk(true)}
                style={{
                  background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)',
                  padding: '10px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: 800,
                  display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                }}
              >
                <Filter size={16} /> Bulk Upload
              </button>
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  background: 'var(--accent)', border: 'none', color: '#000',
                  padding: '10px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: 800,
                  display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Create Link
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 800, letterSpacing: '0.1em' }}>
              LOADING...
            </div>
          ) : urls.length === 0 ? (
            <div style={{ padding: '80px', textAlign: 'center' }}>
              <AlertCircle size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>No links yet</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>Create your first short URL to see it here.</div>
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  background: 'var(--accent)', color: '#000', border: 'none',
                  padding: '14px 32px', borderRadius: 'var(--radius-full)',
                  fontSize: '12px', fontWeight: 900, cursor: 'pointer'
                }}
              >CREATE MY FIRST LINK</button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    {['SHORT URL', 'ORIGINAL DESTINATION', 'CLICKS', 'CREATED DATE', ''].map(h => (
                      <th key={h} style={{ padding: h ? '20px 20px' : '20px 32px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {urls.slice(0, 10).map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }} className="table-row-hover">
                      <td style={{ padding: '20px 20px' }}>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '14px' }}>
                          <a href={u.shortUrl} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {baseUrl}/{u.shortCode}
                            <ExternalLink size={12} style={{ opacity: 0.4 }} />
                          </a>
                        </div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.originalUrl}
                        </div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{
                          background: 'var(--bg)', border: '1px solid var(--border)',
                          padding: '4px 12px', borderRadius: '4px', display: 'inline-block',
                          fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)'
                        }}>
                          {(u.totalClicks || 0).toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>
                        {format(new Date(u.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {/* Copy */}
                          <button
                            onClick={() => handleCopy(u.shortUrl, u.id)}
                            title="Copy short URL"
                            style={{ background: copiedId === u.id ? 'rgba(203,255,0,0.1)' : 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', color: copiedId === u.id ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800 }}
                          >
                            {copiedId === u.id ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                          {/* QR */}
                          <button
                            onClick={() => setSelectedQR(u.shortUrl)}
                            title="Generate QR Code"
                            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '11px', fontWeight: 800 }}
                          >
                            QR
                          </button>
                          {/* Analytics */}
                          <Link
                            to={`/analytics/${u.shortCode}`}
                            title="View Analytics"
                            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                          >
                            <BarChart2 size={14} />
                          </Link>
                          {/* Delete */}
                          {confirmDeleteId === u.id ? (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                style={{ background: 'none', border: '1px solid #333', borderRadius: '6px', padding: '6px 8px', color: '#666', cursor: 'pointer', fontSize: '10px', fontWeight: 800 }}
                              >CANCEL</button>
                              <button
                                onClick={() => handleDelete(u.shortCode, u.id)}
                                disabled={deletingId === u.id}
                                style={{ background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.5)', borderRadius: '6px', padding: '6px 10px', color: '#ff4444', cursor: 'pointer', fontSize: '10px', fontWeight: 900 }}
                              >{deletingId === u.id ? '...' : 'CONFIRM?'}</button>
                            </div>
                          ) : (
                          <button
                            onClick={() => handleDelete(u.shortCode, u.id)}
                            disabled={deletingId === u.id}
                            title="Delete link"
                            style={{ background: 'none', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '6px', padding: '6px 10px', color: '#ff4444', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: deletingId === u.id ? 0.5 : 1 }}
                          >
                            <Trash2 size={14} />
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

          {urls.length > 0 && (
            <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
              <Link to="/links" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em' }}>
                VIEW ALL LINKS →
              </Link>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showBulk && <BulkUpload onClose={() => setShowBulk(false)} onSuccess={fetchData} />}
        {selectedQR && <QRModal shortUrl={selectedQR} onClose={() => setSelectedQR(null)} />}
        {showCreate && <CreateLinkModal onClose={() => setShowCreate(false)} onSuccess={fetchData} />}
      </AnimatePresence>

      <style>{`
        .table-row-hover:hover { background: rgba(203, 255, 0, 0.02); }
      `}</style>
    </Layout>
  )
}
