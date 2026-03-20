import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import api from '../lib/api'
import toast from 'react-hot-toast'
import QRModal from '../components/QRModal'

// ─── Types ────────────────────────────────────────────────────────────────────
interface UrlItem {
  id: string
  shortCode: string
  originalUrl: string
  shortUrl: string
  totalClicks: number
  createdAt: string
  expiresAt?: string
  isActive: boolean
}

// ─── Inline styles ────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: '#09090B',
    color: '#FAFAFA',
    fontFamily: 'Space Grotesk, sans-serif',
  } as React.CSSProperties,
  main: {
    padding: '72px 24px 80px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  } as React.CSSProperties,
  label: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    color: '#A1A1AA',
  },
  input: {
    background: '#111',
    border: '1px solid #3F3F46',
    color: '#FAFAFA',
    fontFamily: 'Space Grotesk, sans-serif',
    fontSize: '14px',
    padding: '10px 12px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  btnYellow: {
    background: '#DFE104',
    border: 'none',
    color: '#000',
    fontFamily: 'Space Grotesk, sans-serif',
    fontWeight: 700,
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    cursor: 'pointer',
    padding: '10px 20px',
  },
  btnGhost: {
    background: 'transparent',
    border: '1px solid #3F3F46',
    color: '#A1A1AA',
    fontFamily: 'Space Grotesk, sans-serif',
    fontWeight: 700,
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    cursor: 'pointer',
    padding: '7px 12px',
  },
  btnDanger: {
    background: 'transparent',
    border: '1px solid #ef4444',
    color: '#ef4444',
    fontFamily: 'Space Grotesk, sans-serif',
    fontWeight: 700,
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    cursor: 'pointer',
    padding: '7px 12px',
  },
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [urls, setUrls] = useState<UrlItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'createdAt' | 'clicks' | 'expiry'>('createdAt')

  // Create form
  const [newUrl, setNewUrl] = useState('')
  const [alias, setAlias] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [aliasAvail, setAliasAvail] = useState<null | boolean>(null)
  const [aliasChecking, setAliasChecking] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editUrl, setEditUrl] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // QR
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  // Bulk
  const [showBulk, setShowBulk] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResults, setBulkResults] = useState<any[] | null>(null)

  const aliasTimer = useRef<ReturnType<typeof setTimeout>>()
  const navigate = useNavigate()

  // ─── Fetch ─────────────────────────────────────────────────────────────────
  const fetchUrls = async () => {
    try {
      const res = await api.get(`/api/urls?sort=${sort === 'createdAt' ? 'createdAt' : sort}&limit=100`)
      setUrls(res.data.data.urls)
    } catch {
      toast.error('Failed to load links')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUrls() }, [sort])

  // ─── Alias check ───────────────────────────────────────────────────────────
  const checkAlias = (val: string) => {
    setAlias(val)
    setAliasAvail(null)
    clearTimeout(aliasTimer.current)
    if (!val || val.length < 3) return
    setAliasChecking(true)
    aliasTimer.current = setTimeout(async () => {
      try {
        const res = await api.get(`/api/urls/check-alias?alias=${val}`)
        setAliasAvail(res.data.data.available)
      } catch { setAliasAvail(null) }
      finally { setAliasChecking(false) }
    }, 450)
  }

  // ─── Create ────────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    if (!newUrl) return
    setCreating(true)
    try {
      await api.post('/api/urls', {
        originalUrl: newUrl,
        customAlias: alias || undefined,
        expiresAt: expiresAt || undefined,
      })
      toast.success('Link created!')
      setNewUrl(''); setAlias(''); setExpiresAt('')
      setAliasAvail(null); setShowCreate(false)
      fetchUrls()
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to create link'
      setCreateError(msg)
      toast.error(msg)
    } finally {
      setCreating(false)
    }
  }

  // ─── Copy ──────────────────────────────────────────────────────────────────
  const copy = (text: string, label = 'Link copied!') => {
    navigator.clipboard.writeText(text).then(() => toast.success(label))
  }

  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)  // shortCode awaiting confirmation

  const handleDelete = async (shortCode: string) => {
    setConfirmDelete(null)
    setDeleting(shortCode)
    try {
      await api.delete(`/api/urls/${shortCode}`)
      toast.success('Link deleted')
      setUrls(prev => prev.filter(u => u.shortCode !== shortCode))
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to delete'
      toast.error(msg)
      console.error('DELETE error:', err.response?.data)
    } finally {
      setDeleting(null)
    }
  }

  // ─── Edit save ─────────────────────────────────────────────────────────────
  const saveEdit = async (shortCode: string) => {
    if (!editUrl) return
    setEditSaving(true)
    try {
      await api.patch(`/api/urls/${shortCode}`, { originalUrl: editUrl })
      toast.success('Link updated!')
      setEditingId(null)
      fetchUrls()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Update failed')
    } finally {
      setEditSaving(false)
    }
  }

  // ─── Bulk ──────────────────────────────────────────────────────────────────
  const handleBulk = async () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) { toast.error('Paste at least one URL'); return }
    setBulkLoading(true)
    try {
      const res = await api.post('/api/urls/bulk', {
        urls: lines.map(u => ({ originalUrl: u }))
      })
      setBulkResults(res.data.data.results)
      fetchUrls()
      toast.success(`Processed ${lines.length} URLs`)
    } catch {
      toast.error('Bulk upload failed')
    } finally {
      setBulkLoading(false)
    }
  }

  // ─── Filter ────────────────────────────────────────────────────────────────
  const filtered = urls.filter(u =>
    u.originalUrl.toLowerCase().includes(search.toLowerCase()) ||
    u.shortCode.toLowerCase().includes(search.toLowerCase())
  )

  const totalClicks = urls.reduce((s, u) => s + u.totalClicks, 0)


  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <Navbar />
      <main style={S.main}>

        {/* ── STATS BAR ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1px',
          background: '#3F3F46',
          marginBottom: '32px',
        }}>
          {[
            { label: 'Total Links', value: urls.length },
            { label: 'Total Clicks', value: totalClicks },
            { label: 'Active Links', value: urls.filter(u => u.isActive).length },
            { label: 'Uptime', value: '99.9%' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#09090B', padding: '20px 24px' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#DFE104', lineHeight: 1 }}>{s.value}</div>
              <div style={{ ...S.label, marginTop: '6px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── TOOLBAR ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="Search links..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...S.input, flex: '1 1 200px', minWidth: '160px' }}
          />
          <div style={{ position: 'relative', flex: '0 0 auto' }}>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as any)}
              style={{ 
                ...S.input, 
                width: '140px', 
                cursor: 'pointer',
                paddingRight: '32px'
              }}
            >
              <option value="createdAt">Newest</option>
              <option value="clicks">Most Clicks</option>
              <option value="expiry">Expiring Soon</option>
            </select>
            {/* Custom SVG arrow to ensure perfect alignment */}
            <svg 
              width="10" height="6" viewBox="0 0 10 6" fill="none" 
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
              <path d="M1 1L5 5L9 1" stroke="#A1A1AA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <button style={S.btnGhost} onClick={() => setShowBulk(v => !v)}>
            Bulk Upload
          </button>
          <button
            style={{ ...S.btnYellow, padding: '10px 24px' }}
            onClick={() => setShowCreate(v => !v)}
          >
            {showCreate ? 'Cancel' : '+ New Link'}
          </button>
        </div>

        {/* ── CREATE FORM ───────────────────────────────────────────────── */}
        {showCreate && (
          <div style={{ background: '#111', border: '2px solid #DFE104', padding: '24px', marginBottom: '24px' }}>
            <div style={{ ...S.label, marginBottom: '16px' }}>Create New Link</div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ ...S.label, marginBottom: '6px' }}>Destination URL *</div>
                <input
                  required
                  type="url"
                  placeholder="https://example.com/very-long-url"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  style={S.input}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ ...S.label, marginBottom: '6px' }}>Custom Alias (optional)</div>
                  <div style={{ position: 'relative' }}>
                    <input
                      placeholder="my-link (min 3 chars)"
                      value={alias}
                      onChange={e => checkAlias(e.target.value)}
                      style={{ ...S.input, paddingRight: '80px' }}
                    />
                    {alias.length >= 3 && (
                      <span style={{
                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                        fontSize: '10px', fontWeight: 700,
                        color: aliasChecking ? '#555' : aliasAvail === true ? '#22c55e' : aliasAvail === false ? '#ef4444' : '#555'
                      }}>
                        {aliasChecking ? 'CHECKING...' : aliasAvail === true ? 'AVAILABLE' : aliasAvail === false ? 'TAKEN' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ ...S.label, marginBottom: '6px' }}>Expires At (optional)</div>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={e => setExpiresAt(e.target.value)}
                    style={S.input}
                  />
                </div>
              </div>
              {createError && (
                <div style={{ background: '#1a0000', border: '1px solid #ef4444', color: '#ef4444', padding: '10px 12px', fontSize: '12px', fontWeight: 600 }}>
                  {createError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" style={S.btnGhost} onClick={() => setShowCreate(false)}>Cancel</button>
                <button
                  type="submit"
                  disabled={creating || (!!alias && aliasAvail === false)}
                  style={{ ...S.btnYellow, opacity: creating ? 0.6 : 1 }}
                >
                  {creating ? 'Creating...' : 'Create Link →'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── BULK UPLOAD ───────────────────────────────────────────────── */}
        {showBulk && (
          <div style={{ background: '#111', border: '1px solid #3F3F46', padding: '24px', marginBottom: '24px' }}>
            <div style={{ ...S.label, marginBottom: '12px' }}>Bulk Upload — Paste one URL per line</div>
            <textarea
              rows={6}
              placeholder={'https://example.com\nhttps://google.com\nhttps://github.com'}
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              style={{ ...S.input, resize: 'vertical', marginBottom: '12px' }}
            />
            <button
              onClick={handleBulk}
              disabled={bulkLoading}
              style={{ ...S.btnYellow, opacity: bulkLoading ? 0.6 : 1 }}
            >
              {bulkLoading ? 'Processing...' : `Upload ${bulkText.split('\n').filter(l => l.trim()).length} URLs`}
            </button>
            {bulkResults && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {bulkResults.map((r, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px',
                    background: r.success ? '#0a1f0a' : '#1a0000',
                    border: `1px solid ${r.success ? '#1a3a1a' : '#3a0a0a'}`,
                    fontSize: '12px'
                  }}>
                    <span style={{ color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                      {r.originalUrl}
                    </span>
                    {r.success
                      ? <span style={{ color: '#22c55e', fontWeight: 700 }}>/{r.shortCode}</span>
                      : <span style={{ color: '#ef4444' }}>{r.error}</span>
                    }
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── URL LIST ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#3F3F46' }}>

          {/* Header row */}
          <div style={{
            background: '#1a1a1a',
            display: 'grid',
            gridTemplateColumns: '1fr auto auto auto auto',
            gap: '16px',
            padding: '10px 20px',
            alignItems: 'center',
          }}>
            <span style={S.label}>Link</span>
            <span style={{ ...S.label, minWidth: '60px', textAlign: 'right' }}>Clicks</span>
            <span style={{ ...S.label, minWidth: '90px', textAlign: 'center' }}>Created</span>
            <span style={{ ...S.label, minWidth: '60px', textAlign: 'center' }}>Expiry</span>
            <span style={{ ...S.label, minWidth: '140px', textAlign: 'right' }}>Actions</span>
          </div>

          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} style={{ background: '#111', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ height: '14px', background: '#1a1a1a', flex: 1, borderRadius: '2px' }} />
                <div style={{ height: '14px', background: '#1a1a1a', width: '60px', borderRadius: '2px' }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div style={{
              background: '#09090B',
              padding: '60px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{ fontSize: '48px', fontWeight: 900, color: '#1a1a1a', letterSpacing: '-0.04em' }}>
                {search ? 'NO RESULTS' : 'EMPTY'}
              </div>
              <p style={{ color: '#555', fontSize: '12px', letterSpacing: '0.1em' }}>
                {search ? 'Try a different search term' : 'Create your first link to get started'}
              </p>
              {!search && (
                <button style={S.btnYellow} onClick={() => setShowCreate(true)}>
                  Create Your First Link
                </button>
              )}
            </div>
          ) : (
            filtered.map(url => (
              <div key={url.id} style={{ background: '#09090B' }}>
                {/* Main row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto auto',
                  gap: '16px',
                  padding: '16px 20px',
                  alignItems: 'center',
                  borderBottom: editingId === url.id ? 'none' : undefined,
                }}>
                  {/* Link info */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#DFE104', letterSpacing: '-0.01em' }}>
                        /{url.shortCode}
                      </span>
                      <button
                        onClick={() => copy(url.shortUrl)}
                        style={{ ...S.btnGhost, padding: '3px 8px', fontSize: '9px' }}
                        title="Copy short link"
                      >
                        Copy
                      </button>
                      {url.expiresAt && new Date(url.expiresAt) < new Date() && (
                        <span style={{ fontSize: '9px', background: '#ef4444', color: '#fff', padding: '2px 6px', fontWeight: 700 }}>
                          EXPIRED
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '12px', color: '#555',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {url.originalUrl}
                    </div>
                  </div>

                  {/* Clicks */}
                  <div style={{ textAlign: 'right', minWidth: '60px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#FAFAFA', lineHeight: 1 }}>{url.totalClicks}</div>
                    <div style={{ ...S.label, fontSize: '9px' }}>clicks</div>
                  </div>

                  {/* Created */}
                  <div style={{ minWidth: '90px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#555' }}>
                      {new Date(url.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Expiry */}
                  <div style={{ minWidth: '60px', textAlign: 'center' }}>
                    {url.expiresAt ? (
                      <span style={{ fontSize: '11px', color: new Date(url.expiresAt) < new Date() ? '#ef4444' : '#f59e0b' }}>
                        {new Date(url.expiresAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#27272A' }}>—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', minWidth: '140px', justifyContent: 'flex-end' }}>
                    <button style={S.btnGhost} onClick={() => setQrUrl(url.shortUrl)} title="QR Code">
                      QR
                    </button>
                    <button
                      style={S.btnGhost}
                      onClick={() => {
                        setEditingId(editingId === url.id ? null : url.id)
                        setEditUrl(url.originalUrl)
                      }}
                      title="Edit destination"
                    >
                      Edit
                    </button>
                    <button
                      style={S.btnGhost}
                      onClick={() => navigate(`/analytics/${url.shortCode}`)}
                      title="Analytics"
                    >
                      Stats
                    </button>
                    {confirmDelete === url.shortCode ? (
                      <>
                        <button
                          onClick={() => handleDelete(url.shortCode)}
                          disabled={deleting === url.shortCode}
                          style={{ ...S.btnDanger, background: '#ef4444', color: '#fff', padding: '7px 10px' }}
                        >
                          {deleting === url.shortCode ? '...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          style={S.btnGhost}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(url.shortCode)}
                        disabled={deleting === url.shortCode}
                        style={{
                          ...S.btnDanger,
                          opacity: deleting === url.shortCode ? 0.5 : 1,
                          cursor: deleting === url.shortCode ? 'wait' : 'pointer',
                        }}
                      >
                        Del
                      </button>
                    )}
                  </div>
                </div>

                {/* Edit row */}
                {editingId === url.id && (
                  <div style={{
                    background: '#111', padding: '16px 20px',
                    borderTop: '1px solid #DFE104',
                    display: 'flex', gap: '10px', alignItems: 'center'
                  }}>
                    <div style={{ ...S.label, whiteSpace: 'nowrap' }}>New URL:</div>
                    <input
                      autoFocus
                      type="url"
                      value={editUrl}
                      onChange={e => setEditUrl(e.target.value)}
                      style={{ ...S.input, flex: 1 }}
                      onKeyDown={e => e.key === 'Enter' && saveEdit(url.shortCode)}
                    />
                    <button
                      onClick={() => saveEdit(url.shortCode)}
                      disabled={editSaving}
                      style={{ ...S.btnYellow, whiteSpace: 'nowrap', opacity: editSaving ? 0.6 : 1 }}
                    >
                      {editSaving ? 'Saving...' : 'Save →'}
                    </button>
                    <button style={S.btnGhost} onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* ── FOOTER HINTS ──────────────────────────────────────────────── */}
        <div style={{ marginTop: '24px', textAlign: 'center', color: '#27272A', fontSize: '10px', letterSpacing: '0.15em' }}>
          {urls.length} LINKS · {totalClicks} TOTAL CLICKS · ZURL
        </div>

      </main>

      {/* ── QR MODAL ──────────────────────────────────────────────────────── */}
      {qrUrl && <QRModal shortUrl={qrUrl} onClose={() => setQrUrl(null)} />}
    </div>
  )
}
