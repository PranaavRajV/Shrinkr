import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [tempToken, setTempToken] = useState('')
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (requires2FA) {
        await verify2FA(tempToken, twoFactorToken)
        toast.success('WELCOME BACK')
        navigate('/dashboard')
        return
      }
      const data = await login(email, password)
      if (data?.requiresTwoFactor) {
        setRequires2FA(true)
        setTempToken(data.tempToken)
        toast.success('PLEASE ENTER MFA CODE')
      } else {
        toast.success('WELCOME BACK')
        navigate('/dashboard')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'LOGIN FAILED')
    } finally {
      setLoading(false)
    }
  }

  const { verify2FA } = useAuth()

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'grid', gridTemplateColumns: '1.2fr 1fr',
      overflow: 'hidden'
    }} className="fade-in">
      
      {/* ── LEFT COLUMN: Brand & Stats (Login Variant) ─────────────────── */}
      <div style={{
        backgroundColor: '#0F0F0F',
        display: 'flex', flexDirection: 'column',
        padding: '80px', position: 'relative',
        borderRight: '1px solid var(--border)'
      }}>
        <div style={{ marginBottom: '80px' }}>
          <h1 style={{ 
            fontSize: '48px', fontWeight: 900, 
            letterSpacing: '-0.05em', color: 'var(--accent)',
            fontFamily: 'Space Grotesk, sans-serif'
          }}>
            ZURL
            <div style={{ width: '60px', height: '4px', background: 'var(--accent)', marginTop: '8px', opacity: 0.5 }} />
          </h1>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ 
            fontSize: '52px', fontWeight: 900, 
            lineHeight: 1.1, letterSpacing: '-0.03em', 
            marginBottom: '40px', maxWidth: '500px'
          }}>
            Precision management<br />
            for your most<br />
            <span style={{ color: 'var(--accent)' }}>refined assets.</span>
          </h2>
          <p style={{ 
            fontSize: '18px', color: 'var(--text-secondary)', 
            lineHeight: 1.6, maxWidth: '440px', marginBottom: '60px' 
          }}>
            Access your curated dashboard to monitor real-time link performance 
            and campaign health with industrial-grade tools.
          </p>

          <div style={{ display: 'flex', gap: '80px' }}>
             <div>
                <div style={{ fontSize: '32px', fontWeight: 900 }}>99.9%</div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>
                  System Uptime
                </div>
             </div>
             <div>
                <div style={{ fontSize: '32px', fontWeight: 900 }}>Real-time</div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>
                  Analytics Engine
                </div>
             </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: '40px', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
           ENTERPRISE ACCESS · ZURL SECURE
        </div>
      </div>

      {/* ── RIGHT COLUMN: Login Form ───────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', padding: '60px'
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ marginBottom: '48px' }}>
            <h3 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Welcome Back</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Enter your security credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {!requires2FA ? (
              <>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'block' }}>
                    Account Email
                  </label>
                  <input 
                    type="email" placeholder="name@company.com" required value={email} onChange={e => setEmail(e.target.value)}
                    style={{ 
                      width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      padding: '16px 20px', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '15px'
                    }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'block' }}>
                    Security Password
                  </label>
                  <div style={{ position: 'relative' }}>
                      <input 
                        type={showPw ? 'text' : 'password'} placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)}
                        style={{ 
                          width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                          padding: '16px 20px', paddingRight: '50px', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '15px'
                        }} 
                      />
                      <button 
                        type="button" onClick={() => setShowPw(!showPw)}
                        style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px' }}>
                  <Link to="/forgot" style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>Forgot Password?</Link>
                </div>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                 <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'block' }}>
                    2FA Verification Code
                 </label>
                 <input 
                    type="text" 
                    placeholder="000000" 
                    required 
                    value={twoFactorToken} 
                    onChange={e => setTwoFactorToken(e.target.value)}
                    autoFocus
                    style={{ 
                       width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--accent)',
                       padding: '16px 20px', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '24px',
                       fontWeight: 900, textAlign: 'center', letterSpacing: '0.5em'
                    }} 
                 />
                 <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '16px', textAlign: 'center' }}>
                    Enter the 6-digit code or a backup code.
                 </p>
                 <button 
                   type="button" 
                   onClick={() => setRequires2FA(false)}
                   style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 800, cursor: 'pointer', width: '100%', marginTop: '16px' }}
                 >
                    ← BACK TO LOGIN
                 </button>
              </motion.div>
            )}

            <button 
              type="submit" disabled={loading}
              style={{
                height: '60px', background: 'var(--accent)', color: '#000',
                border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 800,
                fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '12px', boxShadow: '0 10px 30px rgba(203, 255, 0, 0.2)', marginTop: '10px'
              }}
            >
              {loading ? 'Authenticating...' : requires2FA ? 'Verify Identity' : <><LogIn size={20} /> Access Vault</>}
            </button>
          </form>

          <div style={{ position: 'relative', margin: '40px 0', textAlign: 'center' }}>
             <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border)', zIndex: 1 }} />
             <span style={{ position: 'relative', background: 'var(--bg)', padding: '0 20px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', zIndex: 2 }}>
               OR ACCESS VIA
             </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin 
              onSuccess={async (credentialResponse) => {
                 if (credentialResponse.credential) {
                    setLoading(true)
                    try {
                      const data = await googleLogin(credentialResponse.credential)
                      if (data?.requiresTwoFactor) {
                        setRequires2FA(true)
                        setTempToken(data.tempToken)
                        toast.success('PLEASE ENTER MFA CODE')
                      } else {
                        toast.success('SIGNED IN WITH GOOGLE')
                        navigate('/dashboard')
                      }
                    } catch (err: any) {
                      toast.error(err.response?.data?.message || err.response?.data?.error || 'GOOGLE SSO FAILED')
                    } finally {
                      setLoading(false)
                    }
                 }
              }}
              onError={() => {
                toast.error('GOOGLE LOGIN FAILED')
              }}
              useOneTap
              shape="circle"
              theme="filled_black"
              text="continue_with"
              width="440"
            />
          </div>

          <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
             New to the platform? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'none' }}>Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
