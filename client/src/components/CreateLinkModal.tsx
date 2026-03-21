import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Link2, Tag, Calendar, Copy, Check, ExternalLink, Lock } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateLinkModal({ onClose, onSuccess }: Props) {
  const [originalUrl, setOriginalUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [linkPassword, setLinkPassword] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!originalUrl) return

    // Basic URL validation
    try { new URL(originalUrl) } catch {
      toast.error('Please enter a valid URL (include https://)')
      return
    }

    setLoading(true)
    try {
      const payload: any = { originalUrl }
      if (customAlias.trim()) payload.customAlias = customAlias.trim()
      if (expiresAt) payload.expiresAt = expiresAt
      if (linkPassword.trim()) payload.linkPassword = linkPassword.trim()
      if (tags.length > 0) payload.tags = tags

      const res = await api.post('/api/urls', payload)
      setResult(res.data.data.url)
      onSuccess()
      toast.success('LINK SHORTENED SUCCESSFULLY')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to shorten URL')
    } finally {
      setLoading(false)
    }
  }

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const t = tagInput.trim().toLowerCase()
      if (t && !tags.includes(t)) {
        setTags([...tags, t])
        setTagInput('')
      }
    }
  }

  const removeTag = (t: string) => setTags(tags.filter(tag => tag !== t))

  const handleCopy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result.shortUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111', border: '1px solid #222',
          borderRadius: '16px', padding: '40px',
          width: '100%', maxWidth: '520px',
          boxShadow: '0 40px 80px rgba(0,0,0,0.8)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em' }}>Create New Link</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Shorten and track any URL</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {result ? (
          /* Success State */
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 700, letterSpacing: '0.1em' }}>YOUR SHORT LINK IS READY</div>
            <div style={{
              background: 'var(--bg-secondary)', border: '2px solid var(--accent)',
              borderRadius: '12px', padding: '24px', marginBottom: '24px'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '-0.02em', wordBreak: 'break-all' }}>
                {result.shortUrl}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                → {result.originalUrl}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleCopy}
                style={{
                  background: 'var(--accent)', color: '#000', border: 'none',
                  padding: '14px 28px', borderRadius: 'var(--radius-full)',
                  fontSize: '12px', fontWeight: 900, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'COPIED!' : 'COPY LINK'}
              </button>
              <a
                href={result.shortUrl} target="_blank" rel="noreferrer"
                style={{
                  background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)',
                  padding: '14px 28px', borderRadius: 'var(--radius-full)', textDecoration: 'none',
                  fontSize: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <ExternalLink size={16} /> TEST LINK
              </a>
            </div>
            <button
              onClick={() => { setResult(null); setOriginalUrl(''); setCustomAlias(''); setExpiresAt(''); setLinkPassword(''); setTags([]) }}
              style={{ marginTop: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 800 }}
            >
              CREATE ANOTHER LINK
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Link2 size={12} /> Destination URL *
              </label>
              <input
                type="text"
                placeholder="https://your-long-url.com/page?param=value"
                value={originalUrl}
                onChange={e => setOriginalUrl(e.target.value)}
                required
                style={{
                  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: '14px', padding: '14px 16px',
                  borderRadius: '10px', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Tag size={12} /> Custom Alias <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                <span style={{ padding: '14px 12px 14px 16px', color: 'var(--text-muted)', fontSize: '13px', whiteSpace: 'nowrap', borderRight: '1px solid var(--border)' }}>
                  {window.location.host}/
                </span>
                <input
                  type="text"
                  placeholder="my-custom-alias"
                  value={customAlias}
                  onChange={e => setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                  style={{
                    flex: 1, background: 'none', border: 'none',
                    color: 'var(--text-primary)', fontSize: '14px', padding: '14px 16px',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>Only letters, numbers, hyphens, underscores. Min 3 chars.</div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Calendar size={12} /> Expiry Date <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                style={{
                  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: '14px', padding: '14px 16px',
                  borderRadius: '10px', outline: 'none', boxSizing: 'border-box',
                  colorScheme: 'dark'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Lock size={12} /> Access Password <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <input
                type="password"
                placeholder="Secure access code (optional)"
                value={linkPassword}
                onChange={e => setLinkPassword(e.target.value)}
                style={{
                  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: '14px', padding: '14px 16px',
                  borderRadius: '10px', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Tag size={12} /> Organizational Tags <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: tags.length > 0 ? '12px' : '0' }}>
                {tags.map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(203,255,0,0.1)', border: '1px solid rgba(203,255,0,0.3)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 800, color: 'var(--accent)' }}>
                    {t}
                    <X size={10} style={{ cursor: 'pointer' }} onClick={() => removeTag(t)} />
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="Type and press ENTR to add tags..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
                style={{
                  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: '14px', padding: '14px 16px',
                  borderRadius: '10px', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#333' : 'var(--accent)',
                color: loading ? '#666' : '#000',
                border: 'none', padding: '16px', borderRadius: '10px',
                fontSize: '13px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.08em', marginTop: '8px'
              }}
            >
              {loading ? 'SHORTENING...' : '⚡ SHORTEN URL'}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}
