import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useMotionValue, useReducedMotion } from 'framer-motion'
import {
  Shield, Globe, Zap, Copy,
  Activity, Layers, Lock, BarChart2, ArrowRight,
  CheckCircle2, Star, Terminal
} from 'lucide-react'
import toast from 'react-hot-toast'
import CountUp from '../components/CountUp'
import Magnetic from '../components/Magnetic'

// ─── Tiny hook: mouse parallax ───────────────────────────────────────────────
function useMouseParallax(strength = 30) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  useEffect(() => {
    const move = (e: MouseEvent) => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      x.set(((e.clientX - cx) / cx) * strength)
      y.set(((e.clientY - cy) / cy) * strength)
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [strength, x, y])
  return { x, y }
}

// ─── Animated ticker strip ───────────────────────────────────────────────────
function Ticker({ items }: { items: string[] }) {
  const content = [...items, ...items]
  return (
    <div style={{ overflow: 'hidden', position: 'relative', width: '100%' }}>
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
        style={{ display: 'flex', gap: '0px', width: 'max-content' }}
      >
        {content.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '0 40px', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>{item}</span>
            <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '20px' }}>✦</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

// ─── Reveal on scroll ────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ─── Glow orb background element ────────────────────────────────────────────
function GlowOrb({ color, size, top, left, blur = 120, opacity = 0.12 }: any) {
  return (
    <div style={{
      position: 'absolute', top, left,
      width: size, height: size,
      borderRadius: '50%',
      background: color,
      filter: `blur(${blur}px)`,
      opacity,
      pointerEvents: 'none',
      willChange: 'transform'
    }} />
  )
}

// ─── Feature card ────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, accent = false, delay = 0 }: any) {
  return (
    <FadeUp delay={delay}>
      <motion.div
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        style={{
          padding: '36px',
          borderRadius: '24px',
          border: accent ? 'none' : '1px solid rgba(255,255,255,0.07)',
          background: accent
            ? 'linear-gradient(135deg, rgba(255,224,194,0.15) 0%, rgba(255,224,194,0.04) 100%)'
            : 'rgba(255,255,255,0.025)',
          backdropFilter: 'blur(12px)',
          height: '100%',
          cursor: 'default',
          boxShadow: accent ? '0 0 40px rgba(255,224,194,0.08)' : 'none'
        }}
      >
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: accent ? 'rgba(255,224,194,0.2)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${accent ? 'rgba(255,224,194,0.3)' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'
        }}>
          <Icon size={20} color={accent ? '#ffe0c2' : 'rgba(255,255,255,0.5)'} />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em', color: accent ? '#ffe0c2' : '#fff' }}>{title}</h3>
        <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{desc}</p>
      </motion.div>
    </FadeUp>
  )
}


// ─── Main Component ───────────────────────────────────────────────────────────
export default function Landing() {
  const [stats, setStats] = useState<{ totalLinks: number; totalClicks: number } | null>(null)
  const [url, setUrl] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const prefersReduced = useReducedMotion()

  const wrapperRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: wrapperRef, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 25, restDelta: 0.001 })

  const { x: mouseX, y: mouseY } = useMouseParallax(20)
  const slowX = useSpring(mouseX, { stiffness: 60, damping: 20 })
  const slowY = useSpring(mouseY, { stiffness: 60, damping: 20 })

  // ── All motion values must be unconditional (Rules of Hooks) ─────────────

  // Scroll-driven parallax
  const heroY     = useTransform(smooth, [0, 0.25], [0, -120])
  const heroOp    = useTransform(smooth, [0, 0.18], [1, 0])
  const heroScale = useTransform(smooth, [0, 0.2], [1, 0.94])
  const bgOrbY    = useTransform(smooth, [0, 1], [0, -200])

  // Floating card parallax derived from mouse — always computed, only applied when !prefersReduced
  const card1X = useTransform(slowX, v => -v * 0.5)
  const card1Y = useTransform(slowY, v => -v * 0.5)
  const card2X = useTransform(slowX, v =>  v * 0.4)
  const card2Y = useTransform(slowY, v =>  v * 0.4)
  const card3X = useTransform(slowX, v =>  v * 0.3)
  const card3Y = useTransform(slowY, v => -v * 0.3)

  useEffect(() => {
    api.get('/api/stats')
      .then(r => setStats(r.data.data))
      .catch(() => {})
  }, [])

  const handleShorten = async () => {
    if (!url) return
    setLoading(true)
    try {
      const res = await api.post('/api/urls', { originalUrl: url })
      setResult(res.data.data.url.shortUrl)
      toast.success('Link shortened!')
    } catch {
      toast.error('Please sign in to shorten links')
    } finally {
      setLoading(false)
    }
  }

  const TICKER_ITEMS = [
    'Dynamic Redirects', 'Smart Analytics', 'Custom Domains',
    'Real-time Tracking', 'Bulletproof Security', 'QR Codes',
    'Bulk Upload', 'API Access', 'Bio Pages', 'Edge Network'
  ]

  const FEATURES = [
    { icon: Activity, title: 'Real-time Analytics', desc: 'Track every click, device, location, and referral source as they happen. No lag, no sampling.' },
    { icon: Lock, title: 'Password Protection', desc: 'Gate your links with passwords and expiry dates. Full control over who sees what.' },
    { icon: Terminal, title: 'Developer API', desc: 'REST API with webhook support, SDK integrations, and granular API key permissions.' },
    { icon: Globe, title: 'Custom Domains', desc: 'Bring your own branded domain. Build trust with every link you share.', accent: true },
    { icon: Shield, title: 'Security Scans', desc: 'Every link gets scanned for malware and phishing before being publishedlive.' },
    { icon: Layers, title: 'Bulk Operations', desc: 'Upload thousands of URLs via CSV, manage them in bulk, and export results.', },
  ]

  return (
    <div
      ref={wrapperRef}
      style={{
        background: '#0a0a0a', color: '#fff', overflowX: 'hidden',
        fontFamily: "'Inter', sans-serif",
        contain: 'paint' // isolate paint to avoid full-page repaints
      }}
    >

      {/* ── DEEP BACKGROUND ──────────────────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* Grain texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.025,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px'
        }} />

        {/* Grid lines */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '72px 72px'
        }} />

        {/* Glow orbs */}
        <motion.div style={{ position: 'absolute', inset: 0, y: bgOrbY }}>
          <GlowOrb color="radial-gradient(circle, #ffe0c2, transparent)" size="700px" top="-200px" left="30%" opacity={0.18} blur={180} />
          <GlowOrb color="radial-gradient(circle, #644a40, transparent)" size="500px" top="40%" left="-10%" opacity={0.14} blur={140} />
          <GlowOrb color="radial-gradient(circle, #ffe0c2, transparent)" size="400px" top="60%" left="70%" opacity={0.1} blur={120} />
        </motion.div>
      </div>

      {/* ── NAVBAR ───────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          height: '72px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 clamp(20px, 5vw, 80px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(24px)',
          background: 'rgba(10,10,10,0.75)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #ffe0c2, #644a40)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(255,224,194,0.3)'
          }}>
            <Zap size={16} color="#0a0a0a" strokeWidth={3} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.05em', fontFamily: "'Space Grotesk', sans-serif" }}>ZURL</span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '36px' }}>
          {['Product', 'Pricing', 'Docs', 'Blog'].map(l => (
            <Link key={l} to="/" style={{
              textDecoration: 'none', color: 'rgba(255,255,255,0.45)',
              fontSize: '13px', fontWeight: 600, letterSpacing: '0.01em',
              transition: 'color 0.2s'
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            >{l}</Link>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button onClick={() => navigate('/login')} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: '8px 16px'
          }}>Sign In</button>
          <Magnetic>
            <button onClick={() => navigate('/register')} style={{
              background: 'linear-gradient(135deg, #ffe0c2 0%, #c8967a 100%)',
              color: '#1a0e08', border: 'none',
              padding: '10px 22px', borderRadius: '50px',
              fontSize: '13px', fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 6px 24px rgba(255,224,194,0.25)',
              letterSpacing: '-0.01em'
            }}>Get started →</button>
          </Magnetic>
        </div>
      </motion.nav>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{
        height: '100vh', minHeight: '700px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', position: 'relative', padding: '0 20px',
        paddingTop: '72px'
      }}>
        <motion.div style={{
          y: prefersReduced ? 0 : heroY,
          opacity: heroOp,
          scale: heroScale,
          willChange: 'transform, opacity',
          position: 'relative', zIndex: 1
        }}>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '36px' }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 18px', borderRadius: '50px',
              border: '1px solid rgba(255,224,194,0.2)',
              background: 'rgba(255,224,194,0.06)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffe0c2', boxShadow: '0 0 8px #ffe0c2', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffe0c2', letterSpacing: '0.1em' }}>NEXT-GEN LINK INFRASTRUCTURE</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: 'clamp(52px, 9vw, 112px)',
              fontWeight: 900,
              lineHeight: 0.92,
              letterSpacing: '-0.055em',
              marginBottom: '28px',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            Links that<br />
            <span style={{
              background: 'linear-gradient(135deg, #ffe0c2 0%, #c8967a 50%, #ffe0c2 100%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmer 4s ease infinite'
            }}>move fast.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            style={{
              fontSize: 'clamp(16px, 2vw, 19px)',
              color: 'rgba(255,255,255,0.42)',
              maxWidth: '520px',
              margin: '0 auto 48px',
              lineHeight: 1.65,
              fontWeight: 500
            }}
          >
            Shorten, brand, track and secure every link you share — with sub-40ms redirects, real-time analytics, and zero compromise.
          </motion.p>

          {/* Hero Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75 }}
          >
            <div className="hero-input-wrap">
              <input
                placeholder="Paste a long URL to shorten…"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleShorten()}
                className="hero-input"
              />
              <button onClick={handleShorten} disabled={loading} className="hero-btn">
                {loading ? <div className="btn-spinner" /> : <>Shorten <ArrowRight size={14} /></>}
              </button>
            </div>

            <AnimatePresence>
              {result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{ marginTop: '20px' }}
                >
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '12px',
                    background: 'rgba(255,224,194,0.06)', border: '1px solid rgba(255,224,194,0.2)',
                    padding: '12px 20px', borderRadius: '14px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <span style={{ fontSize: '14px', color: '#ffe0c2', fontWeight: 700 }}>{result}</span>
                    <button onClick={() => { navigator.clipboard.writeText(result); toast.success('Copied!') }}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex' }}>
                      <Copy size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trust line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              style={{ marginTop: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}
            >
              {[
                { icon: CheckCircle2, label: 'No credit card' },
                { icon: Zap, label: 'Instant setup' },
                { icon: Shield, label: 'SOC 2 Ready' }
              ].map(({ icon: I, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 600 }}>
                  <I size={13} color="rgba(255,224,194,0.5)" />
                  {label}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Floating cards — mouse parallax — rendered always, hidden when prefersReduced */}
        <motion.div
          style={{
            position: 'absolute', left: '8%', bottom: '20%', zIndex: 1,
            x: card1X, y: card1Y,
            opacity: prefersReduced ? 0 : 1,
            pointerEvents: prefersReduced ? 'none' : 'auto'
          }}
        >
          <div style={FLOAT_CARD}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={11} fill="#ffe0c2" color="#ffe0c2" strokeWidth={0} />)}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Blazing fast</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Sub-40ms globally</div>
          </div>
        </motion.div>

        <motion.div
          style={{
            position: 'absolute', right: '8%', top: '22%', zIndex: 1,
            x: card2X, y: card2Y,
            opacity: prefersReduced ? 0 : 1,
            pointerEvents: prefersReduced ? 'none' : 'auto'
          }}
        >
          <div style={FLOAT_CARD}>
            <BarChart2 size={20} color="#ffe0c2" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{stats?.totalClicks?.toLocaleString() ?? '4.5M+'}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Clicks tracked</div>
          </div>
        </motion.div>

        <motion.div
          style={{
            position: 'absolute', right: '12%', bottom: '22%', zIndex: 1,
            x: card3X, y: card3Y,
            opacity: prefersReduced ? 0 : 1,
            pointerEvents: prefersReduced ? 'none' : 'auto'
          }}
        >
          <div style={{ ...FLOAT_CARD, background: 'rgba(255,224,194,0.07)' }}>
            <CheckCircle2 size={20} color="#ffe0c2" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffe0c2' }}>Link Active</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>zurl.app/launch</div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          style={{ position: 'absolute', bottom: '36px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '26px', height: '42px', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: '13px', display: 'flex', justifyContent: 'center', paddingTop: '8px' }}
          >
            <div style={{ width: '4px', height: '8px', borderRadius: '2px', background: 'rgba(255,224,194,0.5)' }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── TICKER STRIP ─────────────────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '22px 0',
        background: 'rgba(255,255,255,0.018)',
        overflow: 'hidden',
        position: 'relative', zIndex: 1
      }}>
        <Ticker items={TICKER_ITEMS} />
      </div>

      {/* ── STATS SECTION ────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(80px, 12vw, 140px) clamp(20px, 6vw, 80px)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <FadeUp>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,224,194,0.6)', letterSpacing: '0.2em', marginBottom: '16px', textTransform: 'uppercase' }}>By the numbers</div>
              <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, fontFamily: "'Space Grotesk', sans-serif" }}>
                Built for scale.<br /><span style={{ color: 'rgba(255,255,255,0.3)' }}>Proven in production.</span>
              </h2>
            </div>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', overflow: 'hidden' }}>
            {[
              { label: 'Links Created', value: stats?.totalLinks ?? 120500, suffix: '+', icon: Layers },
              { label: 'Clicks Tracked', value: stats?.totalClicks ?? 4500000, suffix: '+', icon: Activity },
              { label: 'Avg Redirect', value: '< 40ms', icon: Zap, raw: true },
              { label: 'Uptime SLA', value: '99.99%', icon: CheckCircle2, raw: true },
            ].map((m, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div style={{
                  padding: '48px 36px',
                  background: 'rgba(255,255,255,0.022)',
                  textAlign: 'center',
                  borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none'
                }}>
                  <m.icon size={20} color="rgba(255,224,194,0.4)" style={{ marginBottom: '20px', display: 'block', margin: '0 auto 20px' }} />
                  <div style={{ fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '8px', fontFamily: "'Space Grotesk', sans-serif" }}>
                    {m.raw ? m.value : <><CountUp value={m.value as number} />{m.suffix}</>}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{m.label}</div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(80px, 12vw, 140px) clamp(20px, 6vw, 80px)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <FadeUp>
            <div style={{ marginBottom: '72px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,224,194,0.6)', letterSpacing: '0.2em', marginBottom: '16px', textTransform: 'uppercase' }}>Everything you need</div>
              <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, maxWidth: '600px', fontFamily: "'Space Grotesk', sans-serif" }}>
                Link infrastructure for ambitious teams.
              </h2>
            </div>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} {...f} delay={i * 0.07} />
            ))}
          </div>
        </div>
      </section>

      {/* ── BIG BENTO / VISUAL ───────────────────────────────────────── */}
      <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(20px, 6vw, 80px)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="bento-grid2">
            {/* Left big card */}
            <FadeUp>
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                style={{
                  borderRadius: '28px',
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.025)',
                  overflow: 'hidden',
                  height: '100%',
                  minHeight: '380px',
                  padding: '48px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end'
                }}
              >
                {/* Chart preview */}
                <div style={{ position: 'absolute', top: '32px', right: '32px', left: '32px', height: '160px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                  {[35, 55, 40, 80, 60, 90, 45, 100, 72, 85].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: i * 0.06, ease: 'easeOut' }}
                      style={{
                        flex: 1,
                        borderRadius: '4px 4px 0 0',
                        background: i === 9 ? 'linear-gradient(180deg, #ffe0c2, #c8967a)' : 'rgba(255,255,255,0.06)',
                        boxShadow: i === 9 ? '0 0 20px rgba(255,224,194,0.3)' : 'none'
                      }}
                    />
                  ))}
                </div>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(10,10,10,0.96) 40%, transparent 100%)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,224,194,0.5)', letterSpacing: '0.15em', marginBottom: '12px' }}>REAL-TIME ANALYTICS</div>
                  <h3 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '12px', fontFamily: "'Space Grotesk', sans-serif" }}>Know exactly who's clicking — and when.</h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.65, color: 'rgba(255,255,255,0.4)', maxWidth: '340px' }}>Geo, device, referrer, OS — every dimension tracked, live, with zero sampling.</p>
                </div>
              </motion.div>
            </FadeUp>

            {/* Right column: 2 stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FadeUp delay={0.1}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  style={{
                    borderRadius: '24px',
                    background: 'linear-gradient(135deg, rgba(255,224,194,0.1) 0%, rgba(100,74,64,0.06) 100%)',
                    border: '1px solid rgba(255,224,194,0.12)',
                    padding: '36px',
                    boxShadow: '0 0 40px rgba(255,224,194,0.05)'
                  }}
                >
                  <Lock size={28} color="#ffe0c2" style={{ marginBottom: '20px' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px', letterSpacing: '-0.02em' }}>Password-protected links</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>Gate access with passwords, expiry timestamps, and click budgets.</p>
                </motion.div>
              </FadeUp>
              <FadeUp delay={0.15}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  style={{
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: 'rgba(255,255,255,0.025)',
                    padding: '36px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    {['csv', 'json', 'api'].map(t => (
                      <span key={t} style={{ padding: '4px 12px', borderRadius: '50px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t}</span>
                    ))}
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px', letterSpacing: '-0.02em' }}>Bulk import & export</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>Upload thousands of links via CSV or REST API. Export everything, anytime.</p>
                </motion.div>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(80px, 10vw, 120px) clamp(20px, 6vw, 80px)', position: 'relative', zIndex: 1 }}>
        <FadeUp>
          <div style={{
            maxWidth: '1100px', margin: '0 auto',
            borderRadius: '36px',
            border: '1px solid rgba(255,224,194,0.12)',
            background: 'linear-gradient(135deg, rgba(255,224,194,0.06) 0%, rgba(100,74,64,0.04) 50%, rgba(255,224,194,0.03) 100%)',
            padding: 'clamp(60px, 8vw, 100px) clamp(32px, 6vw, 80px)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background glow inside CTA */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 110%, rgba(255,224,194,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            {/* Shimmer border top */}
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,224,194,0.4), transparent)' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,224,194,0.6)', letterSpacing: '0.2em', marginBottom: '20px', textTransform: 'uppercase' }}>Start today</div>
              <h2 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 0.95, marginBottom: '24px', fontFamily: "'Space Grotesk', sans-serif" }}>
                Upgrade every<br />link you share.
              </h2>
              <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(255,255,255,0.4)', maxWidth: '480px', margin: '0 auto 48px', lineHeight: 1.6, fontWeight: 500 }}>
                Join thousands of teams using ZURL to build smarter link experiences.
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Magnetic>
                  <button onClick={() => navigate('/register')} style={{
                    background: 'linear-gradient(135deg, #ffe0c2 0%, #c8967a 100%)',
                    color: '#1a0e08', border: 'none',
                    padding: '16px 36px', borderRadius: '50px',
                    fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 8px 32px rgba(255,224,194,0.25)',
                    letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                    Start for free <ArrowRight size={16} />
                  </button>
                </Magnetic>
                <Magnetic>
                  <button onClick={() => navigate('/login')} style={{
                    background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '16px 36px', borderRadius: '50px',
                    fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                    backdrop: 'blur(12px)'
                  }}>
                    Sign in
                  </button>
                </Magnetic>
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(40px,6vw,60px) clamp(20px,6vw,80px)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'linear-gradient(135deg, #ffe0c2, #644a40)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={14} color="#0a0a0a" strokeWidth={3} />
            </div>
            <span style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '-0.04em', fontFamily: "'Space Grotesk', sans-serif" }}>ZURL</span>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontWeight: 600, letterSpacing: '0.05em' }}>
            © 2026 ZURL Infrastructure Corp.
          </div>
          <div style={{ display: 'flex', gap: '28px' }}>
            {['Privacy', 'Terms', 'Status', 'Docs'].map(l => (
              <Link key={l} to="/" style={{ textDecoration: 'none', fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              >{l}</Link>
            ))}
          </div>
        </div>
      </footer>

      {/* ── INLINE STYLES ────────────────────────────────────────────── */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px #ffe0c2; }
          50% { opacity: 0.5; box-shadow: 0 0 4px #ffe0c2; }
        }

        .hero-input-wrap {
          display: flex; gap: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 20px;
          padding: 8px;
          max-width: 580px;
          margin: 0 auto;
          backdrop-filter: blur(16px);
          box-shadow: 0 24px 80px rgba(0,0,0,0.5);
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .hero-input-wrap:focus-within {
          border-color: rgba(255,224,194,0.25);
          box-shadow: 0 0 0 4px rgba(255,224,194,0.06), 0 24px 80px rgba(0,0,0,0.5);
        }
        .hero-input {
          flex: 1; background: none; border: none; outline: none;
          color: #fff; font-size: 15px; padding: 12px 16px; font-family: inherit;
        }
        .hero-input::placeholder { color: rgba(255,255,255,0.28); }
        .hero-btn {
          background: linear-gradient(135deg, #ffe0c2 0%, #c8967a 100%);
          color: #1a0e08; border: none;
          padding: 12px 24px; border-radius: 14px;
          font-size: 13px; font-weight: 800; cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          white-space: nowrap; font-family: inherit;
          box-shadow: 0 4px 20px rgba(255,224,194,0.2);
          transition: box-shadow 0.2s, transform 0.15s;
          letter-spacing: -0.01em;
        }
        .hero-btn:hover { box-shadow: 0 8px 32px rgba(255,224,194,0.35); transform: translateY(-1px); }
        .hero-btn:active { transform: scale(0.97); }
        .hero-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(26,14,8,0.25);
          border-top-color: #1a0e08;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .bento-grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 800px) {
          .bento-grid2 { grid-template-columns: 1fr; }
          nav { padding: 0 20px !important; }
          nav > div:nth-child(2) { display: none; }
        }
        @media (max-width: 480px) {
          .hero-input-wrap { flex-direction: column; border-radius: 16px; }
          .hero-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  )
}

const FLOAT_CARD: React.CSSProperties = {
  padding: '20px 24px',
  borderRadius: '18px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  minWidth: '150px'
}
