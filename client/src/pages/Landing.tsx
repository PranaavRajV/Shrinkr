import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import { motion } from 'framer-motion'
import { 
  BarChart3, Shield, History, Globe, Zap, 
  ArrowRight, MousePointer2, ExternalLink,
  Search, Lock, CheckCircle2
} from 'lucide-react'
import toast from 'react-hot-toast'

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
      toast.success('LINK SHORTENED')
    } catch {
      toast.error('PLEASE SIGN IN TO SHORTEN LINKS')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ── NAVBAR (Image 3 layout) ─────────────────────────────────── */}
      <nav style={{
        backgroundColor: 'rgba(10,10,10,0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        height: 'var(--nav-height)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 60px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100
      }}>
        <div style={{ fontSize: '20px', fontWeight: 900, fontFamily: 'Space Grotesk' }}>ZURL</div>
        
        <div style={{ display: 'flex', gap: '40px' }}>
          {['DASHBOARD', 'MY LINKS', 'ANALYTICS'].map(link => (
            <Link key={link} to={`/${link.toLowerCase().replace(' ', '-')}`} style={{ 
              textDecoration: 'none', color: 'var(--text-secondary)', 
              fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em' 
            }}>
              {link}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button 
             onClick={() => navigate('/login')}
             style={{ 
               background: 'none', border: 'none', color: 'var(--text-secondary)', 
               fontSize: '12px', fontWeight: 800, cursor: 'pointer' 
             }}>
             SIGN IN
          </button>
          <button 
             onClick={() => navigate('/register')}
             style={{ 
               background: 'var(--accent)', color: '#000', border: 'none', 
               padding: '10px 24px', borderRadius: 'var(--radius-full)', 
               fontSize: '11px', fontWeight: 900, cursor: 'pointer' 
             }}>
             GET STARTED
          </button>
        </div>
      </nav>

      {/* ── HERO SECTION (Image 3 layout) ───────────────────────────── */}
      <header style={{ 
        paddingTop: '160px', paddingBottom: '100px', textAlign: 'center', 
        position: 'relative', overflow: 'hidden'
      }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ 
            fontSize: 'clamp(3rem, 7vw, 6rem)', fontWeight: 900, 
            lineHeight: 1.1, letterSpacing: '-0.05em', marginBottom: '24px' 
          }}>
            Shorten Links,<br />
            <span style={{ color: 'var(--accent)' }}>Simplify Sharing</span>
          </h1>
          <p style={{ 
            fontSize: '18px', color: 'var(--text-secondary)', 
            maxWidth: '650px', margin: '0 auto 48px', lineHeight: 1.6 
          }}>
            Transform long URLs into elegant, trackable assets. Real-time<br /> 
            analytics meets premium minimal management.
          </p>

          {/* LARGE INPUT BAR */}
          <div style={{ 
            maxWidth: '720px', margin: '0 auto', background: 'var(--bg-secondary)', 
            border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', 
            padding: '10px', display: 'flex', gap: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' 
          }}>
             <input 
               placeholder="Paste your long link here..."
               value={url} onChange={e => setUrl(e.target.value)}
               style={{ 
                 flex: 1, background: 'none', border: 'none', color: '#fff', 
                 padding: '0 20px', fontSize: '16px', outline: 'none' 
               }} 
             />
             <button 
               onClick={handleShorten}
               disabled={loading}
               style={{ 
                 background: 'var(--accent)', color: '#000', border: 'none', 
                 padding: '0 32px', height: '52px', borderRadius: '8px', 
                 fontWeight: 800, fontSize: '13px', cursor: 'pointer' 
               }}
             >
               {loading ? '...' : 'Shorten URL'}
             </button>
          </div>

          {result && (
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
               <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', padding: '8px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: '12px', fontWeight: 800 }}>
                  Preview: {result}
               </div>
               <button onClick={() => { navigator.clipboard.writeText(result); toast.success('COPIED'); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <Copy size={16} />
               </button>
            </div>
          )}
        </motion.div>

        {/* WAVY DIVIDER (Image 3 inspired) */}
        <div style={{ 
           marginTop: '100px', height: '120px', width: '100%', 
           background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 1440 320\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath fill=\'%23111\' d=\'M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,149.3C672,149,768,203,864,224C960,245,1056,235,1152,208C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z\'%3E%3C/path%3E%3C/svg%3E")',
           backgroundSize: 'cover'
        }} />
      </header>

      {/* ── METRICS SECTION ─────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#111', padding: '100px 60px' }}>
         <div style={{ 
           maxWidth: '1200px', margin: '0 auto', display: 'flex', 
           justifyContent: 'space-around', textAlign: 'center' 
         }}>
            <div>
               <div style={{ fontSize: '48px', fontWeight: 900 }}>10K+</div>
               <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Links Created</div>
            </div>
            <div>
               <div style={{ fontSize: '48px', fontWeight: 900 }}>1M+</div>
               <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Clicks Tracked</div>
            </div>
            <div>
               <div style={{ fontSize: '48px', fontWeight: 900 }}>99.9%</div>
               <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Uptime</div>
            </div>
         </div>
      </section>

      {/* ── FEATURE BENTO GRID (Image 3 layout) ──────────────────────── */}
      <section style={{ padding: '120px 60px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
         <div style={{ 
           display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', 
           gridAutoRows: 'minmax(300px, auto)', gap: '24px' 
         }}>
            {/* Card 1: Precision Analytics */}
            <div style={{ 
               gridColumn: 'span 8', background: 'var(--bg-secondary)', 
               borderRadius: 'var(--radius-lg)', padding: '60px', position: 'relative',
               overflow: 'hidden', display: 'flex', border: '1px solid var(--border)'
            }}>
               <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '20px' }}>Precision Analytics</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, maxWidth: '300px' }}>
                    Understand exactly who is clicking your links with geographic data, 
                    device tracking, and referral sources updated in real-time.
                  </p>
                  <button style={{ 
                    marginTop: '40px', background: 'none', border: 'none', 
                    color: 'var(--accent)', fontWeight: 800, fontSize: '13px', 
                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' 
                  }}>
                    Explore Insights <ArrowRight size={18} />
                  </button>
               </div>
               <div style={{ 
                 flex: 1, background: 'var(--bg)', borderRadius: '12px', 
                 border: '1px solid var(--border)', marginLeft: '40px',
                 boxShadow: '0 20px 40px rgba(0,0,0,0.3)', padding: '20px'
               }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                     <div style={{ width: '6px', height: '6px', background: '#333', borderRadius: '50%' }} />
                     <div style={{ width: '6px', height: '6px', background: '#333', borderRadius: '50%' }} />
                  </div>
                  <div style={{ height: '10px', width: '60%', background: '#222', borderRadius: '2px', marginBottom: '8px' }} />
                  <div style={{ height: '60px', width: '100%', background: 'linear-gradient(to right, #1a1a1a, #111)', borderRadius: '4px', marginBottom: '20px' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                     <div style={{ height: '40px', background: '#222', borderRadius: '4px' }} />
                     <div style={{ height: '40px', background: '#222', borderRadius: '4px' }} />
                     <div style={{ height: '40px', background: '#222', borderRadius: '4px' }} />
                  </div>
               </div>
            </div>

            {/* Card 2: Encrypted Paths */}
            <div style={{ 
               gridColumn: 'span 4', background: 'var(--accent-soft)', 
               borderRadius: 'var(--radius-lg)', padding: '48px',
               border: '1px solid var(--accent)', display: 'flex', flexDirection: 'column' as const
            }}>
               <Shield size={32} color="var(--accent)" style={{ marginBottom: 'auto' }} />
               <h3 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px', color: 'var(--accent)' }}>Encrypted Paths</h3>
               <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
                 Every shortened link is secured with enterprise-grade SSL and fraud protection.
               </p>
            </div>

            {/* Card 3: Link History */}
            <div style={{ 
               gridColumn: 'span 4', background: 'var(--bg-secondary)', 
               borderRadius: 'var(--radius-lg)', padding: '48px',
               border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' as const
            }}>
               <History size={32} color="var(--text-muted)" style={{ marginBottom: 'auto' }} />
               <h3 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px' }}>Link History</h3>
               <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
                 Never lose a redirect again. Access your full history from any device, anytime.
               </p>
            </div>

            {/* Card 4: Custom Domains */}
            <div style={{ 
               gridColumn: 'span 8', background: 'var(--bg-secondary)', 
               borderRadius: 'var(--radius-lg)', padding: '0', 
               position: 'relative', overflow: 'hidden', display: 'flex', border: '1px solid var(--border)'
            }}>
               <div style={{ flex: 1, padding: '60px' }}>
                  <h3 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '20px' }}>Custom Domains</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>
                    Replace zurl.io with your own brand. Increase CTR by up to 34% with trusted branded links.
                  </p>
                  <button style={{ 
                    marginTop: '40px', background: '#fff', border: 'none', 
                    color: '#000', fontWeight: 800, fontSize: '12px', 
                    padding: '12px 24px', borderRadius: '8px', cursor: 'pointer' 
                  }}>
                    Setup Domain
                  </button>
               </div>
               <div style={{ flex: 1, position: 'relative' }}>
                  <img 
                    src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                    alt="Code" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} 
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #161616, transparent)' }} />
               </div>
            </div>
         </div>
      </section>

      {/* ── FINAL CTA SECTION (Image 3 inspired) ─────────────────────── */}
      <section style={{ padding: '0 60px 120px' }}>
         <div style={{ 
           maxWidth: '1200px', margin: '0 auto', background: 'linear-gradient(135deg, var(--bg-secondary) 0%, #1a1a1a 100%)',
           borderRadius: 'var(--radius-lg)', padding: '100px 60px', textAlign: 'center', border: '1px solid var(--border)',
           backgroundImage: 'radial-gradient(circle at top right, var(--accent-glow), transparent)'
         }}>
            <h2 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '24px', letterSpacing: '-0.04em' }}>
               Ready to elevate your link management?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px' }}>
              Join thousands of creators and businesses who trust ZURL for their premium link shortening needs.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
               <button onClick={() => navigate('/register')} style={S_BTN.primary}>Get Started Free</button>
               <button style={S_BTN.secondary}>Contact Sales</button>
            </div>
         </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '60px' }}>
         <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 900 }}>ZURL</div>
            <div style={{ display: 'flex', gap: '32px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>
               {['PRIVACY', 'TERMS', 'API DOCUMENTATION', 'CONTACT'].map(f => (
                 <span key={f} style={{ cursor: 'pointer' }}>{f}</span>
               ))}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
               <Globe size={20} />
            </div>
         </div>
      </footer>
    </div>
  )
}

const Copy = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const S_BTN = {
  primary: {
    background: 'var(--accent)', color: '#000', border: 'none',
    padding: '16px 40px', borderRadius: 'var(--radius-full)',
    fontSize: '14px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 20px rgba(203, 255, 0, 0.2)'
  },
  secondary: {
    background: 'transparent', color: '#fff', border: '1px solid var(--border)',
    padding: '16px 40px', borderRadius: 'var(--radius-full)',
    fontSize: '14px', fontWeight: 900, cursor: 'pointer'
  }
}
