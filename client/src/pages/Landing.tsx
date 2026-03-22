import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { 
  Shield, Globe, Zap, 
  ArrowRight, MousePointer2, ExternalLink,
  Search, Lock, CheckCircle2, ChevronRight, Play, Copy,
  BarChart2, Mouse, Sparkles, Terminal, Activity, Layers, Cpu
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Reveal, RevealText } from '../components/Reveal'
import Card3D from '../components/Card3D'
import Magnetic from '../components/Magnetic'
import CountUp from '../components/CountUp'

export default function Landing() {
  const [stats, setStats] = useState<{ totalLinks: number, totalClicks: number } | null>(null)
  const [url, setUrl] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  
  const targetRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"]
  })

  useEffect(() => {
    api.get('/api/stats')
      .then(res => setStats(res.data.data))
      .catch(() => {})
  }, [])

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

  // Adaptive Scroll Transforms
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -100])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])
  
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const textLeft = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"])
  const textRight = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])

  return (
    <div ref={targetRef} style={{ background: '#070707', color: '#fff', overflowX: 'hidden' }}>
      
      {/* ── BACKGROUND LAYER ────────────────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.4 }}>
        <motion.div 
          style={{ 
            height: '200%', width: '100%', 
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(203, 255, 0, 0.05) 0%, transparent 70%), 
                             linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), 
                             linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)`,
            backgroundSize: '100% 100%, 60px 60px, 60px 60px',
            y: bgY
          }} 
        />
      </div>

      {/* ── NAVBAR ──────────────────────────────────────────────────── */}
      <nav style={{
        backgroundColor: 'rgba(7,7,7,0.7)',
        backdropFilter: 'blur(30px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        height: '80px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 60px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="#000" strokeWidth={3} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 950, fontFamily: 'Space Grotesk', letterSpacing: '-0.05em' }}>ZURL</div>
        </div>
        
        <div style={{ display: 'flex', gap: '32px' }}>
          {['PRODUCT', 'ENTERPRISE', 'PRICING', 'RESOURCES'].map(link => (
            <Link key={link} to="/" style={{ 
              textDecoration: 'none', color: '#888', 
              fontSize: '11px', fontWeight: 900, letterSpacing: '0.15em',
              transition: 'all 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = '#888'}
            >
              {link}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <button 
             onClick={() => navigate('/login')}
             style={{ background: 'none', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 900, cursor: 'pointer', letterSpacing: '0.1em' }}>
             SIGN IN
          </button>
          <Magnetic>
            <button 
               onClick={() => navigate('/register')}
               style={{ 
                 background: 'var(--accent)', color: '#000', border: 'none', 
                 padding: '12px 28px', borderRadius: '50px', 
                 fontSize: '11px', fontWeight: 950, cursor: 'pointer',
                 boxShadow: '0 10px 30px rgba(203, 255, 0, 0.3)'
               }}>
               GET STARTED — FREE
            </button>
          </Magnetic>
        </div>
      </nav>

      {/* ── HERO SECTION ────────────────────────────────────────────── */}
      <section style={{ 
        height: '100vh', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '0 20px', position: 'relative'
      }}>
        <motion.div style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}>
          <Reveal delay={0.2}>
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '8px', 
              background: 'rgba(203, 255, 0, 0.05)', border: '1px solid rgba(203, 255, 0, 0.2)',
              padding: '8px 16px', borderRadius: '50px', marginBottom: '24px'
            }}>
              <Sparkles size={14} color="var(--accent)" />
              <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '0.1em' }}>NEXT-GEN LINK INFRASTRUCTURE</span>
            </div>
          </Reveal>
          
          <h1 style={{ fontSize: '100px', fontWeight: 950, letterSpacing: '-0.06em', lineHeight: 0.9, marginBottom: '24px' }}>
            Elevate every<br />
            <span style={{ color: 'var(--accent)' }}>connection.</span>
          </h1>

          <Reveal delay={0.4}>
            <p style={{ fontSize: '20px', color: '#888', maxWidth: '600px', margin: '0 auto 48px', lineHeight: 1.6, fontWeight: 500 }}>
              Premium link shortening for world-class brands. Real-time analytics, 
              custom domains, and bulletproof security.
            </p>
          </Reveal>

          <Reveal delay={0.6}>
            <div style={{ 
              minWidth: '600px', background: 'rgba(255,255,255,0.03)', 
              borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)',
              padding: '12px', display: 'flex', gap: '12px', backdropFilter: 'blur(10px)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.4)'
            }}>
              <input 
                placeholder="Securely shorten your long destination URL..."
                value={url} onChange={e => setUrl(e.target.value)}
                style={{ flex: 1, background: 'none', border: 'none', color: '#fff', padding: '0 20px', fontSize: '16px', outline: 'none' }}
              />
              <button 
                onClick={handleShorten}
                disabled={loading}
                style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '16px 32px', borderRadius: '14px', fontWeight: 950, fontSize: '12px', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {loading ? '...' : 'GENERATE LINK'}
              </button>
            </div>
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}
              >
                 <div style={{ background: '#111', border: '1px solid var(--border)', padding: '12px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 800 }}>{result}</span>
                    <button onClick={() => { navigator.clipboard.writeText(result); toast.success('COPIED') }} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><Copy size={16} /></button>
                 </div>
              </motion.div>
            )}
          </Reveal>
        </motion.div>

        {/* Floating Decorative Elements */}
        <motion.div style={{ position: 'absolute', bottom: '100px', left: '100px', y: useTransform(scrollYProgress, [0, 0.5], [0, -300]), opacity: heroOpacity }}>
           <div style={{ width: '120px', height: '120px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={40} color="#333" />
           </div>
        </motion.div>
        <motion.div style={{ position: 'absolute', top: '20%', right: '10%', y: useTransform(scrollYProgress, [0, 0.5], [0, -200]), opacity: heroOpacity }}>
           <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(203, 255, 0, 0.05)', border: '1px solid rgba(203, 255, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={32} color="var(--accent)" />
           </div>
        </motion.div>
        
        <motion.div 
          style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', opacity: heroOpacity }}
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Mouse size={32} color="#333" />
        </motion.div>
      </section>

      {/* ── PARALLAX STRIP ─────────────────────────────────────────── */}
      <section style={{ height: '30vh', background: '#000', display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap', borderTop: '1px solid #111', borderBottom: '1px solid #111' }}>
        <motion.div style={{ x: textLeft, display: 'flex', gap: '40px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ fontSize: '80px', fontWeight: 950, color: '#111', WebkitTextStroke: '1px rgba(255,255,255,0.05)' }}>
              DYNAMIC REDIRECTION — SMART ANALYTICS — CUSTOM DOMAINS — BULLETPROOF SECURITY
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── METRICS GRID ───────────────────────────────────────────── */}
      <section style={{ padding: '160px 60px', position: 'relative' }}>
         <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '60px' }}>
            {[
              { label: 'Links Created', value: stats?.totalLinks || 120500, icon: Layers },
              { label: 'Total Clicks Tracked', value: stats?.totalClicks || 4500000, icon: Activity },
              { label: 'Avg Latency', value: '0.04ms', icon: Cpu, suffix: '' }
            ].map((m, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                style={{ textAlign: 'center' }}
              >
                 <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <m.icon size={24} color={i === 1 ? 'var(--accent)' : '#555'} />
                 </div>
                 <div style={{ fontSize: '56px', fontWeight: 950, marginBottom: '8px', letterSpacing: '-0.04em' }}>
                    {typeof m.value === 'number' ? <CountUp value={m.value} /> : m.value}
                 </div>
                 <div style={{ fontSize: '11px', fontWeight: 900, color: '#555', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{m.label}</div>
              </motion.div>
            ))}
         </div>
      </section>

      {/* ── CORE FEATURES (Bento Grid) ────────────────────────────────── */}
      <section style={{ padding: '100px 60px 200px', maxWidth: '1440px', margin: '0 auto' }}>
          <div style={{ marginBottom: '80px', textAlign: 'center' }}>
            <RevealText text="The Link OS." />
            <p style={{ color: '#555', fontSize: '15px', fontWeight: 800, letterSpacing: '0.1em', marginTop: '12px' }}>EVERYTHING YOU NEED TO MANAGE YOUR DIGITAL REACH</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gridAutoRows: '400px', gap: '32px' }}>
            {/* Main Feature */}
            <motion.div 
              style={{ gridColumn: 'span 8', gridRow: 'span 1' }}
              whileHover={{ y: -10 }}
            >
              <div style={BENTO_STYLE}>
                <div style={{ flex: 1 }}>
                   <div style={{ width: '40px', height: '40px', background: 'var(--accent)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                      <Terminal size={20} color="#000" />
                   </div>
                   <h3 style={{ fontSize: '32px', fontWeight: 950, marginBottom: '20px' }}>Real-time Link Mastery</h3>
                   <p style={{ color: '#888', fontSize: '15px', lineHeight: 1.6, maxWidth: '300px' }}>
                     Our proprietary edge-network provides sub-40ms redirection logic globally. 
                     No lag, no downtime, just instant connection.
                   </p>
                </div>
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '24px', background: '#070707', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <motion.div 
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, var(--accent-glow) 0%, transparent 70%)' }} 
                    />
                    <div style={{ padding: '32px' }}>
                       <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                          <div style={{ width: '8px', height: '8px', background: '#333', borderRadius: '50%' }} />
                          <div style={{ width: '40px', height: '8px', background: '#222', borderRadius: '4px' }} />
                       </div>
                       <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                          {[40, 70, 45, 90, 65, 80, 50, 100].map((h, i) => (
                            <motion.div 
                              key={i} 
                              initial={{ height: 0 }}
                              whileInView={{ height: `${h}%` }}
                              style={{ flex: 1, background: i === 7 ? 'var(--accent)' : '#222', borderRadius: '4px' }}
                            />
                          ))}
                       </div>
                    </div>
                </div>
              </div>
            </motion.div>

            {/* Side Feature 1 */}
            <motion.div style={{ gridColumn: 'span 4' }} whileHover={{ y: -10 }}>
              <div style={{ ...BENTO_STYLE, flexDirection: 'column', background: 'var(--accent)', color: '#000', borderColor: 'transparent' }}>
                 <Lock size={32} style={{ marginBottom: '24px' }} />
                 <h3 style={{ fontSize: '24px', fontWeight: 950, marginBottom: '16px' }}>Zero Trust Redirects</h3>
                 <p style={{ color: 'rgba(0,0,0,0.6)', fontSize: '14px', lineHeight: 1.6 }}>
                   Enterprise-grade encryption on every hop. Your data and your users 
                   are protected by the most advanced fraud prevention in the industry.
                 </p>
              </div>
            </motion.div>

            {/* Side Feature 2 */}
            <motion.div style={{ gridColumn: 'span 5' }} whileHover={{ y: -10 }}>
               <div style={{ ...BENTO_STYLE, flexDirection: 'column' }}>
                  <Globe size={32} color="#444" style={{ marginBottom: '24px' }} />
                  <h3 style={{ fontSize: '24px', fontWeight: 950, marginBottom: '16px' }}>Global Edge Network</h3>
                  <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.6 }}>
                    Redirection nodes in 240+ cities worldwide ensure your 
                    audience hits their destination instantly, regardless of location.
                  </p>
               </div>
            </motion.div>

            {/* Custom Domain Feature */}
            <motion.div style={{ gridColumn: 'span 7' }} whileHover={{ y: -10 }}>
               <div style={{ ...BENTO_STYLE, padding: 0, overflow: 'hidden' }}>
                  <div style={{ flex: 1, padding: '48px' }}>
                     <h3 style={{ fontSize: '30px', fontWeight: 950, marginBottom: '16px' }}>Your Brand, Your Rules</h3>
                     <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.6 }}>
                       Connect your own domain in minutes. Professional, trusted links 
                       proven to boost Click-Through-Rates by 40%.
                     </p>
                  </div>
                  <div style={{ flex: 1, background: '#111', position: 'relative' }}>
                     <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', rotate: '-5deg', width: '120%' }}>
                        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', whiteSpace: 'nowrap', fontSize: '18px', fontWeight: 900, color: 'var(--accent)' }}>
                           go.brandname.com/exclusive-offer
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
      </section>

      {/* ── PARALLAX CTA ────────────────────────────────────────────── */}
      <section style={{ height: '80vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <motion.div 
           style={{ 
             scale: useTransform(scrollYProgress, [0.85, 1], [0.8, 1]),
             opacity: useTransform(scrollYProgress, [0.85, 0.95], [0, 1]),
             width: '90%', maxWidth: '1440px', height: '100%',
             background: 'linear-gradient(135deg, #111 0%, #070707 100%)',
             borderRadius: '60px 60px 0 0',
             border: '1px solid rgba(255,255,255,0.05)',
             padding: '120px 60px',
             display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
           }}
         >
            <RevealText text="Ready to upgrade?" />
            <p style={{ color: '#888', fontSize: '20px', maxWidth: '600px', margin: '24px auto 48px', lineHeight: 1.6 }}>
               Join the fastest growing companies using ZURL to power their digital growth.
            </p>
            <div style={{ display: 'flex', gap: '24px' }}>
               <Magnetic>
                 <button onClick={() => navigate('/register')} style={{ ...CTA_BTN, background: 'var(--accent)', color: '#000' }}>CREATE ACCOUNT — FREE</button>
               </Magnetic>
               <Magnetic>
                 <button style={{ ...CTA_BTN, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>TALK TO SALES</button>
               </Magnetic>
            </div>
         </motion.div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer style={{ background: '#111', padding: '100px 60px' }}>
         <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '80px' }}>
               <div>
                  <div style={{ fontSize: '24px', fontWeight: 950, letterSpacing: '-0.05em', marginBottom: '12px' }}>ZURL</div>
                  <p style={{ color: '#555', fontSize: '13px', maxWidth: '240px', lineHeight: 1.6 }}>
                    Redefining how the world connects to information, one short link at a time.
                  </p>
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 160px)', gap: '40px' }}>
                  {['Product', 'Company', 'Legal'].map((group, i) => (
                    <div key={i}>
                       <div style={{ fontSize: '10px', fontWeight: 900, color: '#fff', letterSpacing: '0.2em', marginBottom: '24px' }}>{group.toUpperCase()}</div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {['Feature 1', 'Feature 2', 'Feature 3'].map(l => (
                            <span key={l} style={{ fontSize: '13px', color: '#555', fontWeight: 600, cursor: 'pointer' }}>{l}</span>
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ fontSize: '12px', color: '#444', fontWeight: 600 }}>© 2026 ZURL INFRASTRUCTURE CORP.</div>
               <div style={{ display: 'flex', gap: '24px' }}>
                  <Globe size={18} color="#444" />
               </div>
            </div>
         </div>
      </footer>

      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #070707; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #333; }
      `}</style>
    </div>
  )
}

const BENTO_STYLE = {
  height: '100%',
  padding: '48px',
  background: 'rgba(255,255,255,0.02)',
  borderRadius: '32px',
  border: '1px solid rgba(255,255,255,0.05)',
  display: 'flex',
  gap: '32px',
  transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
  cursor: 'pointer'
}

const CTA_BTN = {
  padding: '18px 48px',
  borderRadius: '16px',
  fontSize: '12px',
  fontWeight: 950,
  border: 'none',
  cursor: 'pointer',
  letterSpacing: '0.1em'
}
