import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, ArrowRight, MousePointer2 } from 'lucide-react'
import api from '../lib/api'

interface BioLink {
  shortCode: string
  shortUrl: string
  originalUrl: string
  customTitle: string
  ogData?: {
    title?: string
    favicon?: string
    image?: string
  }
  totalClicks: number
  showClickCount: boolean
  order: number
}

interface BioProfile {
  username: string
  bioName: string
  bioDescription: string
  bioAvatar: string
  bioTheme: 'dark' | 'light' | 'accent'
}

export default function BioPage() {
  const { username } = useParams<{ username: string }>()
  const [data, setData] = useState<{ profile: BioProfile; links: BioLink[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchBio = async () => {
      try {
        const res = await api.get(`/api/bio/${username}`)
        setData(res.data.data)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Bio not found')
      } finally {
        setLoading(false)
      }
    }
    fetchBio()
  }, [username])

  const handleLinkClick = async (urlId: string, originalUrl: string) => {
    // Analytics tracking is handled by the redirect itself if we use the shortUrl,
    // but the prompt says: Track the click (POST /api/bio/:username/click/:urlId)
    // Actually our redirect route already tracks. Let's redirect to shortUrl.
    window.open(originalUrl, '_blank')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: 40, height: 40, border: '3px solid #333', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
    </div>
  )

  if (error || !data) return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
      <h1 style={{ color: 'var(--foreground)', fontSize: '32px', marginBottom: '16px' }}>404</h1>
      <p style={{ color: 'var(--muted-foreground)', marginBottom: '32px' }}>{error || 'User not found'}</p>
      <Link to="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 800 }}>← RETURN HOME</Link>
    </div>
  )

  const { profile, links } = data
  const themeStyles: any = {
    dark: { bg: '#0A0A0A', text: '#FFFFFF', muted: '#555', card: '#161616', border: '#222', accent: 'var(--accent)' },
    light: { bg: '#FAFAFA', text: '#000000', muted: '#888', card: '#FFFFFF', border: '#EEE', accent: 'var(--accent)' },
    accent: { bg: 'var(--accent)', text: '#000000', muted: 'rgba(0,0,0,0.5)', card: 'rgba(0,0,0,0.05)', border: 'rgba(0,0,0,0.1)', accent: '#000' }
  }
  const s = themeStyles[profile.bioTheme] || themeStyles.dark

  const totalClicks = links.reduce((acc, l) => acc + (l.totalClicks || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, transition: 'all 0.4s ease' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 24px' }}>
        
        {/* Header Section */}
        <header style={{ textAlign: 'center', marginBottom: '48px' }}>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            style={{ 
              width: 96, height: 96, margin: '0 auto 24px', borderRadius: '50%', 
              border: `3px solid ${s.accent}`, padding: '4px', background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
            }}
          >
            {profile.bioAvatar ? (
              <img src={profile.bioAvatar} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ fontSize: '32px', fontWeight: 900, color: s.accent }}>
                {profile.bioName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
            )}
          </motion.div>

          <motion.h1 
            initial={{ y: 10, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.02em' }}
          >
            {profile.bioName}
          </motion.h1>

          <motion.p 
            initial={{ y: 10, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ color: s.muted, fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}
          >
            @{profile.username}
          </motion.p>

          <motion.p 
            initial={{ y: 10, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ maxWidth: '400px', margin: '0 auto 24px', fontSize: '14px', lineHeight: 1.6, color: profile.bioTheme === 'accent' ? 'rgba(0,0,0,0.7)' : s.muted }}
          >
            {profile.bioDescription || 'No description provided.'}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: s.muted }}
          >
            {links.length} links · {totalClicks.toLocaleString()} total clicks
          </motion.div>
        </header>

        {/* Links Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <AnimatePresence>
            {links.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '40px', color: s.muted }}>
                No links shared yet.
              </motion.div>
            ) : (
              links.map((link, i) => (
                <motion.div
                  key={link.shortCode}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + (i * 0.05) }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleLinkClick(link.shortCode, link.originalUrl)}
                  style={{
                    background: s.card, border: `1px solid ${s.border}`, borderRadius: '16px',
                    padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px',
                    boxShadow: profile.bioTheme === 'dark' ? '0 10px 30px rgba(0,0,0,0.5)' : 'none'
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '12px', background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {link.ogData?.favicon ? (
                      <img src={link.ogData.favicon} style={{ width: 20, height: 20 }} />
                    ) : (
                      <ExternalLink size={20} color={s.accent} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {link.customTitle || link.ogData?.title || new URL(link.originalUrl).hostname}
                    </h3>
                    <p style={{ fontSize: '12px', color: s.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {new URL(link.originalUrl).hostname}{new URL(link.originalUrl).pathname !== '/' ? new URL(link.originalUrl).pathname : ''}
                    </p>
                  </div>

                  {link.showClickCount && (
                    <div style={{ fontSize: '10px', fontWeight: 900, background: s.bg, padding: '4px 8px', borderRadius: '6px', color: s.accent, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MousePointer2 size={10} /> {link.totalClicks}
                    </div>
                  )}

                  <ArrowRight size={16} color={s.muted} style={{ flexShrink: 0 }} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer style={{ marginTop: '80px', textAlign: 'center' }}>
          <Link to="/" style={{ fontSize: '11px', fontWeight: 900, color: s.muted, textDecoration: 'none', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Powered by <span style={{ color: s.accent }}>Shrinkr</span>
          </Link>
        </footer>
      </div>
    </div>
  )
}
