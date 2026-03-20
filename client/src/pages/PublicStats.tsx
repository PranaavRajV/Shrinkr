import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

// Public shareable stats page — no login required
// Accessible at /s/:shortCode
export default function PublicStats() {
  const { shortCode } = useParams<{ shortCode: string }>()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4001'

  useEffect(() => {
    fetch(`${baseUrl}/api/analytics/public/${shortCode}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setData(json.data)
        else setError(json.error || 'Not found')
      })
      .catch(() => setError('Failed to load stats'))
      .finally(() => setLoading(false))
  }, [shortCode])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', color: '#555', letterSpacing: '0.2em', fontSize: '11px' }}>
        LOADING...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', color: '#FAFAFA' }}>
        <div style={{ fontSize: '80px', fontWeight: 900, color: '#ef4444', lineHeight: 1 }}>404</div>
        <div style={{ color: '#555', letterSpacing: '0.2em', fontSize: '11px', marginTop: '16px' }}>
          {error || 'LINK NOT FOUND'}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090B',
      color: '#FAFAFA',
      fontFamily: 'Space Grotesk, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      {/* Brand */}
      <a href="/" style={{ textDecoration: 'none', color: '#DFE104', fontWeight: 700, fontSize: '14px', letterSpacing: '0.2em', marginBottom: '40px' }}>
        ZURL
      </a>

      {/* Code */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ fontSize: '11px', color: '#555', letterSpacing: '0.3em', fontWeight: 700, marginBottom: '8px' }}>
          PUBLIC STATISTICS
        </div>
        <h1 style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>
          /{shortCode}
        </h1>
      </div>

      {/* Stats grid */}
      <div style={{
        width: '100%',
        maxWidth: '640px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1px',
        background: '#3F3F46',
        marginBottom: '32px',
      }}>
        {[
          { label: 'Total Clicks', value: data.totalClicks },
          { label: 'Last Visited', value: data.lastVisited ? new Date(data.lastVisited).toLocaleDateString() : 'Never' },
          { label: 'Created', value: new Date(data.createdAt).toLocaleDateString() },
          { label: 'Top Device', value: data.topDevices?.[0]?._id || 'N/A' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#111', padding: '28px 24px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', color: '#555', marginBottom: '8px' }}>{s.label.toUpperCase()}</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#DFE104', lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center' }}>
        <a href="/register" style={{
          display: 'inline-block',
          background: '#DFE104',
          color: '#000',
          padding: '12px 32px',
          fontWeight: 700,
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          textDecoration: 'none',
          marginBottom: '16px',
        }}>
          Create Your Own Short Links
        </a>
        <div style={{ fontSize: '10px', color: '#27272A', letterSpacing: '0.15em' }}>POWERED BY ZURL</div>
      </div>
    </div>
  )
}
