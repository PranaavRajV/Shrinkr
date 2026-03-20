import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function Landing() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleShorten = async () => {
    if (!url) return
    setLoading(true)
    try {
      const res = await api.post('/api/urls', { originalUrl: url })
      setResult(res.data.data.url.shortUrl)
    } catch {
      setResult('Please sign in to shorten links')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090B',
      color: '#FAFAFA',
      fontFamily: 'Space Grotesk, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* NAV */}
      <nav style={{
        height: '56px',
        borderBottom: '1px solid #3F3F46',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'fixed',
        top: 0, left: 0, right: 0,
        background: 'rgba(9,9,11,0.9)',
        backdropFilter: 'blur(12px)',
        zIndex: 50,
      }}>
        <span style={{
          fontSize: '18px', fontWeight: 700,
          letterSpacing: '-0.03em', textTransform: 'uppercase'
        }}>
          Zurl
        </span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate('/login')} style={{
            background: 'transparent',
            border: '1px solid #3F3F46',
            color: '#A1A1AA', padding: '8px 16px',
            fontSize: '11px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            cursor: 'pointer', fontFamily: 'inherit'
          }}>
            Sign In
          </button>
          <button onClick={() => navigate('/register')} style={{
            background: '#DFE104', border: 'none',
            color: '#000', padding: '8px 16px',
            fontSize: '11px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            cursor: 'pointer', fontFamily: 'inherit'
          }}>
            Sign Up →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 32px 48px',
        maxWidth: '1280px',
        margin: '0 auto',
        width: '100%',
      }}>
        <div style={{
          fontSize: '11px', color: '#A1A1AA',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          border: '1px solid #3F3F46',
          display: 'inline-block', padding: '8px 16px',
          marginBottom: '40px'
        }}>
          URL Shortener — Est. 2026
        </div>

        <h1 style={{
          fontSize: 'clamp(3.5rem, 9vw, 8rem)',
          fontWeight: 700, lineHeight: 0.88,
          letterSpacing: '-0.04em', textTransform: 'uppercase',
          marginBottom: '24px'
        }}>
          Short links<br />
          that tell<br />
          <span style={{ color: '#DFE104' }}>a story.</span>
        </h1>

        <p style={{
          fontSize: '17px', color: '#A1A1AA',
          lineHeight: 1.65, maxWidth: '440px',
          marginBottom: '40px', fontWeight: 400
        }}>
          Create, share, and track your links 
          with beautiful real-time analytics.
        </p>

        {/* URL INPUT CARD */}
        <div style={{
          maxWidth: '560px',
          border: '2px solid #3F3F46',
          padding: '20px', background: '#111111'
        }}>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleShorten()}
              placeholder="PASTE YOUR LONG URL HERE..."
              style={{
                width: '100%', height: '52px',
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid #3F3F46',
                color: '#FAFAFA', fontSize: '15px',
                fontWeight: 600, fontFamily: 'inherit',
                letterSpacing: '-0.01em',
                padding: '0 0 0 4px',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderBottomColor = '#DFE104'
              }}
              onBlur={(e) => {
                e.target.style.borderBottomColor = '#3F3F46'
              }}
            />
          </div>

          <button
            onClick={handleShorten}
            disabled={loading || !url}
            style={{
              width: '100%', height: '52px',
              background: loading ? '#3F3F46' : '#DFE104',
              border: 'none', color: '#000',
              fontSize: '13px', fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background 150ms',
            }}
          >
            {loading ? 'SHORTENING...' : 'SHORTEN IT →'}
          </button>

          {result && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              borderTop: '1px solid #3F3F46',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <span style={{
                color: '#DFE104', fontSize: '15px',
                fontWeight: 700, letterSpacing: '-0.01em',
                overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {result}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result)
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #3F3F46',
                  color: '#A1A1AA', padding: '6px 12px',
                  fontSize: '10px', fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  cursor: 'pointer', fontFamily: 'inherit',
                  flexShrink: 0,
                }}
              >
                COPY
              </button>
            </div>
          )}

          <p style={{
            marginTop: '12px', fontSize: '10px',
            color: '#555', textAlign: 'center',
            textTransform: 'uppercase', letterSpacing: '0.15em'
          }}>
            Free forever · No credit card · Instant
          </p>
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid #3F3F46',
        padding: '20px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: '13px', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '-0.02em'
        }}>
          Zurl © 2026
        </span>
        <span style={{
          fontSize: '10px', color: '#555',
          textTransform: 'uppercase', letterSpacing: '0.1em'
        }}>
          This project is a part of a hackathon 
          run by katomaran.com
        </span>
      </footer>
    </div>
  )
}
