import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Link2, Tag, Calendar, Copy, Check, ExternalLink, Lock, Loader2, AlertCircle, ChevronDown, ChevronUp, Settings2, Globe, Smartphone, Tablet, MousePointer2, Eye, EyeOff } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Magnetic from './Magnetic'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateLinkModal({ onClose, onSuccess }: Props) {
  const [originalUrl, setOriginalUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [aliasStatus, setAliasStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [expiresAt, setExpiresAt] = useState('')
  const [linkPassword, setLinkPassword] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isTagsFocused, setIsTagsFocused] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [isUtmOpen, setIsUtmOpen] = useState(false)
  const [utm, setUtm] = useState({ source: '', medium: '', campaign: '', term: '', content: '' })
  const [isTargetingOpen, setIsTargetingOpen] = useState(false)
  const [targeting, setTargeting] = useState<any>({ mobile: '', tablet: '', countries: [] })
  const [countryCode, setCountryCode] = useState('')
  const [countryUrl, setCountryUrl] = useState('')
  const [ogPreview, setOgPreview] = useState<any>(null)
  const [isOgLoading, setIsOgLoading] = useState(false)
  const [clickGoal, setClickGoal] = useState('')

  // Real-time alias check
  useEffect(() => {
    if (!customAlias || customAlias.length < 3) {
      setAliasStatus('idle')
      return
    }

    const timer = setTimeout(async () => {
      setAliasStatus('checking')
      try {
        const res = await api.get('/api/urls/check-alias', { params: { alias: customAlias } })
        setAliasStatus(res.data.data.available ? 'available' : 'taken')
      } catch {
        setAliasStatus('idle')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [customAlias])

  // OG Preview Effect
  useEffect(() => {
    if (!originalUrl) {
      setOgPreview(null)
      return
    }
    
    try { 
      const test = new URL(originalUrl.startsWith('http') ? originalUrl : `https://${originalUrl}`)
      if (test.hostname.length < 4) return
    } catch { return }

    const timer = setTimeout(async () => {
      setIsOgLoading(true)
      try {
        const urlToFetch = originalUrl.startsWith('http') ? originalUrl : `https://${originalUrl}`
        const res = await api.get('/api/urls/preview', { params: { url: urlToFetch } })
        if (res.data.data.og.title || res.data.data.og.description) {
          setOgPreview(res.data.data.og)
        } else {
          setOgPreview(null)
        }
      } catch {
        setOgPreview(null)
      } finally {
        setIsOgLoading(false)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [originalUrl])

  const buildUtmUrl = (url: string) => {
    if (!Object.values(utm).some(v => v)) return url
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      if (utm.source) urlObj.searchParams.set('utm_source', utm.source)
      if (utm.medium) urlObj.searchParams.set('utm_medium', utm.medium)
      if (utm.campaign) urlObj.searchParams.set('utm_campaign', utm.campaign)
      if (utm.term) urlObj.searchParams.set('utm_term', utm.term)
      if (utm.content) urlObj.searchParams.set('utm_content', utm.content)
      return urlObj.toString()
    } catch {
      return url
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!originalUrl) return
    if (customAlias && aliasStatus === 'taken') {
      toast.error('This alias is already taken')
      return
    }

    try { new URL(originalUrl) } catch {
      toast.error('Please enter a valid URL (include https://)')
      return
    }

    setLoading(true)
    try {
      const finalOriginalUrl = buildUtmUrl(originalUrl)
      const payload: any = { originalUrl: finalOriginalUrl }
      if (customAlias.trim()) payload.customAlias = customAlias.trim()
      if (expiresAt) payload.expiresAt = expiresAt
      if (linkPassword.trim()) payload.linkPassword = linkPassword.trim()
      if (tags.length > 0) payload.tags = tags
      if (clickGoal) payload.clickGoal = parseInt(clickGoal)

      const cleanTargeting: any = {}
      if (targeting.mobile?.trim()) cleanTargeting.mobile = targeting.mobile.trim()
      if (targeting.tablet?.trim()) cleanTargeting.tablet = targeting.tablet.trim()
      if (targeting.countries?.length > 0) cleanTargeting.countries = targeting.countries
      if (Object.keys(cleanTargeting).length > 0) payload.targeting = cleanTargeting

      const res = await api.post('/api/urls', payload)
      setResult(res.data.data.url)
      onSuccess()
      toast.success('LINK SHORTENED ✓')
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
      if (t && !tags.includes(t) && tags.length < 5) {
        setTags([...tags, t])
        setTagInput('')
      }
    }
  }

  const removeTag = (t: string) => setTags(tags.filter(tag => tag !== t))

  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggesting, setSuggesting] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSuggestions = async (urlValue: string) => {
    if (!urlValue || urlValue.length < 5) {
      setSuggestions([])
      return
    }

    try { 
      new URL(urlValue.startsWith('http') ? urlValue : `https://${urlValue}`) 
    } catch {
      setSuggestions([])
      return
    }

    setSuggesting(true)
    try {
      const res = await api.post('/api/ai/suggest', { url: urlValue })
      setSuggestions(res.data?.data?.suggestions || [])
    } catch {
      setSuggestions([])
    } finally {
      setSuggesting(false)
    }
  }

  const handleUrlChange = (value: string) => {
    setOriginalUrl(value)
    setSuggestions([])
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value)
    }, 700)
  }

  const handleCopy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result.shortUrl)
    setCopied(true)
    toast.success('COPIED!')
    setTimeout(() => setCopied(false), 2000)
  }

  const addCountryTarget = () => {
    if (!countryCode || !countryUrl) return
    if (targeting.countries.length >= 5) {
      toast.error('Maximum 5 country rules allowed')
      return
    }
    const code = countryCode.trim().toUpperCase()
    if (code.length !== 2) {
      toast.error('Use 2-letter ISO country code (e.g. US, GB, IN)')
      return
    }
    try { new URL(countryUrl) } catch {
      toast.error('Invalid country destination URL')
      return
    }
    setTargeting({
      ...targeting,
      countries: [...targeting.countries, { code, url: countryUrl.trim() }]
    })
    setCountryCode('')
    setCountryUrl('')
  }

  const removeCountryTarget = (code: string) => {
    setTargeting({
      ...targeting,
      countries: targeting.countries.filter((c: any) => c.code !== code)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111', border: '1px solid #1a1a1a',
          borderRadius: '24px', padding: '48px',
          width: '100%', maxWidth: '560px',
          boxShadow: '0 40px 100px rgba(0,0,0,0.9)',
          maxHeight: '90vh', overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.04em' }}>New Link</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '4px' }}>Transform any URL into a trackable link.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #222', borderRadius: '12px', padding: '10px', cursor: 'pointer', color: '#555' }}>
            <X size={20} />
          </button>
        </div>

        {result ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: 'var(--bg-secondary)', border: '2px solid var(--accent)', borderRadius: '20px', padding: '32px', marginBottom: '32px' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '0.2em', marginBottom: '16px' }}>LINK IS READY ✓</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', wordBreak: 'break-all', marginBottom: '12px' }}>
                {result.shortUrl}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                 → {result.originalUrl}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                onClick={handleCopy}
                style={{
                  background: 'var(--accent)', color: '#000', border: 'none',
                  padding: '16px 36px', borderRadius: '12px',
                  fontSize: '13px', fontWeight: 900, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'COPIED!' : 'COPY URL'}
              </button>
              <a href={result.shortUrl} target="_blank" rel="noreferrer" style={{ background: 'none', border: '1px solid #222', color: '#fff', padding: '16px 32px', borderRadius: '12px', textDecoration: 'none', fontSize: '13px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ExternalLink size={18} /> TEST
              </a>
            </div>
            <button onClick={() => { setResult(null); setOriginalUrl(''); setCustomAlias(''); setSuggestions([]); setSuggesting(false) }} style={{ marginTop: '32px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '12px', fontWeight: 900 }}>
              CREATE ANOTHER →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* DESTINATION */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Link2 size={13} /> Destination URL
              </label>
              <input
                type="text"
                placeholder="https://long-resource-path.com/..."
                value={originalUrl}
                onChange={e => handleUrlChange(e.target.value)}
                required
                style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#fff', fontSize: '15px', padding: '18px 20px', borderRadius: '14px', outline: 'none' }}
              />

              {/* AI SUGGESTIONS UI */}
              {(suggesting || suggestions.length > 0) && (
                <div style={{ marginTop: '12px', marginBottom: '4px' }}>
                  {suggesting && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                      <style>{`
                        @keyframes dotPulse {
                          0%, 100% { transform: scale(0.5); opacity: 0.5; }
                          50% { transform: scale(1); opacity: 1; }
                        }
                      `}</style>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[0, 150, 300].map(delay => (
                          <div key={delay} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', animation: `dotPulse 1s infinite ${delay}ms` }} />
                        ))}
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                        AI THINKING...
                      </span>
                    </div>
                  )}
                  {!suggesting && suggestions.length > 0 && (
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--accent)"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        AI SUGGESTIONS <span style={{ opacity: 0.5, fontWeight: 500 }}>— CLICK TO USE</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <AnimatePresence>
                          {suggestions.map((s, i) => (
                            <motion.button
                              key={s}
                              type="button"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.08 }}
                              onClick={() => {
                                setCustomAlias(s)
                                setSuggestions([])
                                const el = document.getElementById('custom-alias-input')
                                el?.focus()
                                el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                              }}
                              style={{ 
                                background: 'none', border: '1px solid var(--border)', 
                                borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: '11px', fontWeight: 800,
                                color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
                                transition: 'all 150ms ease'
                              }}
                              whileHover={{ 
                                backgroundColor: 'var(--accent)', 
                                color: '#000',
                                translateY: -1
                              }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {s}
                            </motion.button>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* UTM SECTION */}
              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsUtmOpen(!isUtmOpen)}
                  style={{
                    background: 'none', border: 'none', color: isUtmOpen ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 0', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.2s'
                  }}
                >
                  <Settings2 size={12} /> {isUtmOpen ? 'Hide UTM Builder' : 'Add UTM Parameters'}
                  {isUtmOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                <AnimatePresence>
                  {isUtmOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '24px', background: 'var(--bg-secondary)', borderRadius: '16px', marginTop: '12px', border: '1px solid var(--border)' }}>
                        {[
                          { key: 'source', label: 'Source', placeholder: 'twitter, newsletter' },
                          { key: 'medium', label: 'Medium', placeholder: 'social, email' },
                          { key: 'campaign', label: 'Campaign', placeholder: 'summer-sale' },
                          { key: 'term', label: 'Term', placeholder: 'running-shoes' },
                          { key: 'content', label: 'Content', placeholder: 'sidebar-link' },
                        ].map(f => (
                          <div key={f.key} style={{ gridColumn: f.key === 'content' ? 'span 2' : 'auto' }}>
                            <label style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px', display: 'block' }}>{f.label}</label>
                            <input
                              type="text"
                              placeholder={f.placeholder}
                              value={(utm as any)[f.key]}
                              onChange={e => setUtm({ ...utm, [f.key]: e.target.value })}
                              style={{ 
                                width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', 
                                color: '#fff', fontSize: '12px', padding: '10px 0', borderRadius: 0, outline: 'none',
                                transition: 'border-color 0.2s'
                              }}
                              onFocus={(e) => e.target.style.borderBottomColor = 'var(--accent)'}
                              onBlur={(e) => e.target.style.borderBottomColor = 'var(--border)'}
                            />
                          </div>
                        ))}
                        
                        {originalUrl && (Object.values(utm).some(v => v)) && (
                          <div style={{ gridColumn: 'span 2', marginTop: '12px', padding: '16px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                            <label style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', letterSpacing: '0.1em' }}>Final URL Preview</label>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', wordBreak: 'break-all', fontFamily: 'monospace', lineHeight: 1.6 }}>
                              {buildUtmUrl(originalUrl)}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* SMART TARGETING */}
              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsTargetingOpen(!isTargetingOpen)}
                  style={{
                    background: 'none', border: 'none', color: isTargetingOpen ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 0', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.2s'
                  }}
                >
                  <Globe size={12} /> {isTargetingOpen ? 'Hide Targeting' : 'Smart Redirect Targeting'}
                  {isTargetingOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                <AnimatePresence>
                  {isTargetingOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ 
                        display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', 
                        background: 'var(--bg-secondary)', borderRadius: '16px', marginTop: '12px', 
                        border: '1px solid var(--border)' 
                      }}>
                        
                        {/* DEVICE TARGETING */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                          <div>
                            <label style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px', display: 'block' }}>
                              <Smartphone size={10} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Mobile URL
                            </label>
                            <input
                              type="text"
                              placeholder="https://mobile.app/..."
                              value={targeting.mobile}
                              onChange={e => setTargeting({ ...targeting, mobile: e.target.value })}
                              style={{ 
                                width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', 
                                color: '#fff', fontSize: '12px', padding: '10px 0', borderRadius: 0, outline: 'none',
                                transition: 'border-color 0.2s'
                              }}
                              onFocus={(e) => e.target.style.borderBottomColor = 'var(--accent)'}
                              onBlur={(e) => e.target.style.borderBottomColor = 'var(--border)'}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px', display: 'block' }}>
                              <Tablet size={10} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Tablet URL
                            </label>
                            <input
                              type="text"
                              placeholder="https://tablet.app/..."
                              value={targeting.tablet}
                              onChange={e => setTargeting({ ...targeting, tablet: e.target.value })}
                              style={{ 
                                width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', 
                                color: '#fff', fontSize: '12px', padding: '10px 0', borderRadius: 0, outline: 'none',
                                transition: 'border-color 0.2s'
                              }}
                              onFocus={(e) => e.target.style.borderBottomColor = 'var(--accent)'}
                              onBlur={(e) => e.target.style.borderBottomColor = 'var(--border)'}
                            />
                          </div>
                        </div>

                        {/* COUNTRY TARGETING */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                          <label style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px', display: 'block' }}>Country Rules (Max 5)</label>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: targeting.countries.length > 0 ? '16px' : 0 }}>
                            <AnimatePresence>
                              {targeting.countries.map((c: any) => (
                                <motion.div 
                                  key={c.code}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 10 }}
                                  style={{ 
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                    background: 'rgba(0,0,0,0.2)', padding: '10px 16px', borderRadius: '8px', 
                                    border: '1px solid var(--border)' 
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '4px 8px', borderRadius: '4px', letterSpacing: '0.05em' }}>{c.code}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{c.url}</span>
                                  </div>
                                  <button type="button" onClick={() => removeCountryTarget(c.code)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>

                          {targeting.countries.length < 5 && (
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                              <div style={{ width: '56px' }}>
                                <input
                                  type="text"
                                  placeholder="US"
                                  maxLength={2}
                                  value={countryCode}
                                  onChange={e => setCountryCode(e.target.value.toUpperCase())}
                                  style={{ 
                                    width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', 
                                    color: '#fff', fontSize: '12px', padding: '10px 0', borderRadius: 0, outline: 'none', textAlign: 'center' 
                                  }}
                                  onFocus={(e) => e.target.style.borderBottomColor = 'var(--accent)'}
                                  onBlur={(e) => e.target.style.borderBottomColor = 'var(--border)'}
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <input
                                  type="text"
                                  placeholder="Destination URL for this country"
                                  value={countryUrl}
                                  onChange={e => setCountryUrl(e.target.value)}
                                  style={{ 
                                    width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', 
                                    color: '#fff', fontSize: '12px', padding: '10px 0', borderRadius: 0, outline: 'none' 
                                  }}
                                  onFocus={(e) => e.target.style.borderBottomColor = 'var(--accent)'}
                                  onBlur={(e) => e.target.style.borderBottomColor = 'var(--border)'}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={addCountryTarget}
                                style={{ 
                                  background: 'var(--accent)', color: '#000', border: 'none', 
                                  padding: '10px 16px', borderRadius: '8px', fontSize: '10px', 
                                  fontWeight: 900, cursor: 'pointer', letterSpacing: '0.05em' 
                                }}
                              >
                                ADD RULE
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* OG PREVIEW CARD */}
              <AnimatePresence>
                {(isOgLoading || ogPreview) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{ 
                      marginTop: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid #1a1a1a', 
                      borderRadius: '16px', padding: '16px', display: 'flex', gap: '16px', position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {isOgLoading ? (
                      <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                        <div className="skeleton" style={{ width: '80px', height: '60px', borderRadius: '8px', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div className="skeleton" style={{ width: '40%', height: '10px', marginBottom: '8px' }} />
                          <div className="skeleton" style={{ width: '80%', height: '14px', marginBottom: '8px' }} />
                          <div className="skeleton" style={{ width: '100%', height: '10px' }} />
                        </div>
                      </div>
                    ) : (
                      <>
                        {ogPreview.image && (
                          <img src={ogPreview.image} alt="" style={{ width: '100px', height: '80px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0, border: '1px solid #222' }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            {ogPreview.favicon && <img src={ogPreview.favicon} alt="" style={{ width: '14px', height: '14px', borderRadius: '2px' }} />}
                            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ogPreview.siteName}</span>
                          </div>
                          <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ogPreview.title}</h4>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ogPreview.description}</p>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ALIAS */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Tag size={13} /> Custom Alias
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="custom-alias-input"
                  type="text"
                  placeholder="brand-link-2026"
                  value={customAlias}
                  maxLength={30}
                  onChange={e => {
                    setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))
                    setSuggestions([])
                  }}
                  style={{ 
                    width: '100%', background: '#0a0a0a', border: 'none', borderBottom: `1px solid ${aliasStatus === 'available' ? 'var(--accent)' : '#1a1a1a'}`,
                    color: '#fff', fontSize: '15px', padding: '18px 20px', borderRadius: 0, outline: 'none',
                    transition: 'border-color 0.3s'
                  }}
                />
                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {aliasStatus === 'checking' && <Loader2 size={16} className="animate-spin" color="var(--accent)" />}
                  {aliasStatus === 'available' && <Check size={16} color="var(--accent)" />}
                  {aliasStatus === 'taken' && <AlertCircle size={16} color="#ff4444" />}
                  <span style={{ fontSize: '10px', fontWeight: 900, color: aliasStatus === 'available' ? 'var(--accent)' : aliasStatus === 'taken' ? '#ff4444' : '#444' }}>
                    {aliasStatus === 'checking' ? 'CHECKING...' : aliasStatus === 'available' ? 'AVAILABLE' : aliasStatus === 'taken' ? 'TAKEN' : ''}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* EXPIRY */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Calendar size={13} /> Expiry
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  style={{ 
                    width: '100%', background: 'var(--bg)', border: 'none', borderBottom: '1px solid var(--border)', 
                    color: '#fff', fontSize: '14px', padding: '16px 0', borderRadius: 0, colorScheme: 'dark', outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderBottomColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderBottomColor = 'var(--border)'}
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Lock size={13} /> Password
                </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={isPasswordVisible ? 'text' : 'password'}
                  placeholder="Secret key (optional)"
                  value={linkPassword}
                  onChange={e => setLinkPassword(e.target.value)}
                  style={{ 
                    height: '52px', width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)',
                    color: '#fff', fontSize: '14px', padding: '16px 44px', borderRadius: 0, outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderBottomColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderBottomColor = 'var(--border)'}
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: '4px' }}
                >
                  {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              </div>
            </div>

            {/* CLICK GOAL */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <MousePointer2 size={13} /> Click Goal
              </label>
              <input
                type="number"
                placeholder="Target number of clicks (e.g. 1000)"
                value={clickGoal}
                onChange={e => setClickGoal(e.target.value)}
                min="1"
                style={{ 
                  width: '100%', background: 'var(--bg)', border: 'none', borderBottom: '1px solid var(--border)', 
                  color: '#fff', fontSize: '14px', padding: '16px 0', borderRadius: 0, outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderBottomColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderBottomColor = 'var(--border)'}
              />
              <p style={{ fontSize: '10px', color: '#444', marginTop: '8px', fontWeight: 600 }}>We'll notify you and show a celebration once this goal is reached.</p>
            </div>

            {/* TAGS */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Tag size={13} /> Tags
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: tags.length > 0 ? '12px' : 0 }}>
                <AnimatePresence>
                  {tags.map(t => (
                    <motion.div
                      key={t}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 1.1, 1], opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ 
                        background: 'rgba(203,255,0,0.1)', color: 'var(--accent)', border: '1px solid rgba(203,255,0,0.3)', 
                        padding: '4px 12px', borderRadius: '0', fontSize: '11px', fontWeight: 900, 
                        display: 'flex', alignItems: 'center', gap: '6px' 
                      }}
                    >
                      {t} 
                      <X 
                        size={12} 
                        style={{ cursor: 'pointer', transition: 'color 150ms' }} 
                        className="tag-remove"
                        onClick={() => removeTag(t)} 
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <input
                type="text"
                placeholder={tags.length >= 5 ? 'MAX TAGS REACHED' : tags.length === 0 ? "TYPE AND PRESS ENTER..." : "ADD ANOTHER TAG..."}
                disabled={tags.length >= 5}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
                onFocus={() => setIsTagsFocused(true)}
                onBlur={() => setIsTagsFocused(false)}
                style={{ 
                  width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${isTagsFocused ? 'var(--accent)' : 'var(--border)'}`, 
                  color: '#fff', fontSize: '13px', fontWeight: 700, padding: '16px 0', borderRadius: 0, outline: 'none', 
                  opacity: tags.length >= 5 ? 0.3 : 1, transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.05em'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || aliasStatus === 'checking'}
              style={{
                background: (loading || aliasStatus === 'checking') ? '#1a1a1a' : 'var(--accent)',
                color: (loading || aliasStatus === 'checking') ? '#333' : '#000',
                height: '64px', borderRadius: '16px', border: 'none',
                fontSize: '15px', fontWeight: 900, letterSpacing: '0.04em',
                cursor: (loading || aliasStatus === 'checking') ? 'wait' : 'pointer',
                marginTop: '12px', transition: 'all 0.2s'
              }}
            >
              {loading ? 'GENERATING...' : '⚡ SHORTEN URL NOW'}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}
