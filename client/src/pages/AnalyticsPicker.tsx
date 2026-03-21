import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart2, Search, MousePointer2, Clock, ExternalLink,
  ArrowRight, TrendingUp, AlertCircle, Zap
} from 'lucide-react'
import api from '../lib/api'
import Layout from '../components/Layout'
import { format } from 'date-fns'
import CreateLinkModal from '../components/CreateLinkModal'

export default function AnalyticsPicker() {
  const [urls, setUrls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const fetchUrls = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/urls', { params: { limit: 100 } })
      setUrls(res.data.data.urls || [])
    } catch {
      setUrls([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUrls() }, [fetchUrls])

  // Pre-fill search from URL param
  useEffect(() => {
    const q = searchParams.get('search')
    if (q) setSearch(q)
  }, [searchParams])

  const filtered = search.trim()
    ? urls.filter(u =>
        u.shortCode.toLowerCase().includes(search.toLowerCase()) ||
        u.originalUrl.toLowerCase().includes(search.toLowerCase())
      )
    : urls

  const totalClicks = urls.reduce((s, u) => s + (u.totalClicks || 0), 0)
  const topLink = urls.length ? urls.reduce((p, c) => (p.totalClicks || 0) > (c.totalClicks || 0) ? p : c) : null

  return (
    <Layout onCreateLink={() => setShowCreate(true)}>
      <div className="fade-in" style={{ padding: '40px' }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '8px' }}>
            Analytics
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            Select a link below to view its full analytics report.
          </p>
        </div>

        {/* ── Summary Cards ───────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '48px' }}>
          {[
            { label: 'Total Links', value: urls.length.toLocaleString(), icon: BarChart2, sub: 'All tracked links' },
            { label: 'All-Time Clicks', value: totalClicks >= 1000 ? `${(totalClicks / 1000).toFixed(1)}K` : totalClicks.toLocaleString(), icon: MousePointer2, sub: 'Across all links' },
            { label: 'Top Performer', value: topLink ? `/${topLink.shortCode}` : '—', icon: TrendingUp, sub: topLink ? `${(topLink.totalClicks || 0).toLocaleString()} clicks` : 'No data yet' },
          ].map((c, i) => (
            <div key={i} style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '28px', position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: '24px', right: '24px', opacity: 0.2 }}>
                <c.icon size={24} color="var(--text-primary)" />
              </div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>
                {c.label}
              </div>
              <div style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {loading ? '—' : c.value}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Link Picker ─────────────────────────────────────────── */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>

          {/* Toolbar */}
          <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.02em', flexShrink: 0 }}>
              Select a Link to Analyse
            </h2>
            <div style={{ flex: 1, maxWidth: '360px', marginLeft: 'auto', position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                placeholder="Filter by URL or short code..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                  color: '#fff', fontSize: '13px', padding: '10px 14px 10px 36px',
                  borderRadius: '8px', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 800, letterSpacing: '0.2em' }}>
              LOADING LINKS...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '80px', textAlign: 'center' }}>
              <AlertCircle size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>
                {search ? 'No matching links' : 'No links yet'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                {search ? 'Try a different search term.' : 'Create your first link to start tracking analytics.'}
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
            <AnimatePresence>
              {filtered.map((u, idx) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.2 }}
                  onClick={() => navigate(`/analytics/${u.shortCode}`)}
                  style={{
                    padding: '20px 32px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', gap: '20px',
                    cursor: 'pointer', transition: 'background 0.15s'
                  }}
                  whileHover={{ backgroundColor: 'rgba(203,255,0,0.025)' }}
                >
                  {/* Link icon */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'rgba(203,255,0,0.08)', border: '1px solid rgba(203,255,0,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Zap size={18} color="#CBFF00" />
                  </div>

                  {/* URL info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 800, color: '#CBFF00', fontSize: '14px' }}>
                        /{u.shortCode}
                      </span>
                      <a
                        href={u.shortUrl} target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ color: '#444', display: 'flex', alignItems: 'center' }}
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                    <div style={{ fontSize: '12px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.originalUrl}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>
                        {(u.totalClicks || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '10px', color: '#555', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                        <MousePointer2 size={10} /> clicks
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#666' }}>
                        {format(new Date(u.createdAt), 'MMM d, yyyy')}
                      </div>
                      <div style={{ fontSize: '10px', color: '#444', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                        <Clock size={10} /> created
                      </div>
                    </div>

                    {/* View analytics arrow */}
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#555', transition: 'all 0.2s', flexShrink: 0
                    }}>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {filtered.length > 0 && (
          <p style={{ textAlign: 'center', marginTop: '20px', color: '#333', fontSize: '12px', fontWeight: 700 }}>
            Showing {filtered.length} of {urls.length} links · Click any row to view full analytics
          </p>
        )}
      </div>

      <AnimatePresence>
        {showCreate && <CreateLinkModal onClose={() => setShowCreate(false)} onSuccess={fetchUrls} />}
      </AnimatePresence>
    </Layout>
  )
}
