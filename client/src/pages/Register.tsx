import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Check, ArrowRight } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const { register, googleLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('PASSWORDS DO NOT MATCH')
      return
    }
    setLoading(true)
    try {
      await register(email, password)
      toast.success('ACCOUNT CREATED')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'REGISTRATION FAILED')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'grid', gridTemplateColumns: '1.2fr 1fr',
      overflow: 'hidden'
    }} className="fade-in">
      
      {/* ── LEFT COLUMN: Brand & Stats ─────────────────────────────────── */}
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
            Elevate your digital<br />
            presence with premium<br />
            <span style={{ color: 'var(--accent)' }}>link architecture.</span>
          </h2>
          <p style={{ 
            fontSize: '18px', color: 'var(--text-secondary)', 
            lineHeight: 1.6, maxWidth: '440px', marginBottom: '60px' 
          }}>
            Join the world's most sophisticated editorial link management platform. 
            Designed for creators who value precision and tactile elegance.
          </p>

          <div style={{ display: 'flex', gap: '80px' }}>
             <div>
                <div style={{ fontSize: '32px', fontWeight: 900 }}>4.8k</div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>
                  Active Curators
                </div>
             </div>
             <div>
                <div style={{ fontSize: '32px', fontWeight: 900 }}>12M+</div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>
                  Links Crafted
                </div>
             </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: '40px', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
           NEO EDITION 2024 · THE TACTILE OASIS
        </div>
      </div>

      {/* ── RIGHT COLUMN: Registration Form ────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', padding: '60px'
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ marginBottom: '48px' }}>
            <h3 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Create your sanctuary</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Begin your journey with a Premium Account.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
               <input 
                 placeholder="First Name" 
                 style={{ 
                   background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                   padding: '16px 20px', borderRadius: 'var(--radius-md)', color: '#fff'
                 }} 
               />
               <input 
                 placeholder="Last Name" 
                 style={{ 
                   background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                   padding: '16px 20px', borderRadius: 'var(--radius-md)', color: '#fff'
                 }} 
               />
            </div>

            <input 
              type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)}
              style={{ 
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                padding: '16px 20px', borderRadius: 'var(--radius-md)', color: '#fff'
              }} 
            />

            <div style={{ position: 'relative' }}>
               <input 
                 type={showPw ? 'text' : 'password'} placeholder="Create Password" required value={password} onChange={e => setPassword(e.target.value)}
                 style={{ 
                   width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                   padding: '16px 20px', paddingRight: '50px', borderRadius: 'var(--radius-md)', color: '#fff'
                 }} 
               />
               <button 
                 type="button" onClick={() => setShowPw(!showPw)}
                 style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
               >
                 {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
               </button>
            </div>

            <div style={{ position: 'relative' }}>
               <input 
                 type="password" placeholder="Confirm Password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                 style={{ 
                   width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                   padding: '16px 20px', borderRadius: 'var(--radius-md)', color: '#fff'
                 }} 
               />
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
               <input type="checkbox" required style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', marginTop: '2px' }} />
               <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                 I agree to the <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Terms of Service</span> and <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Privacy Policy</span>, confirming my preference for editorial link management.
               </p>
            </div>

            <button 
              type="submit" disabled={loading}
              style={{
                height: '60px', background: 'var(--accent)', color: '#000',
                border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 800,
                fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '10px', boxShadow: '0 10px 30px rgba(203, 255, 0, 0.2)', marginTop: '10px'
              }}
            >
              {loading ? 'Processing...' : 'Create My Account'}
            </button>
          </form>

          <div style={{ position: 'relative', margin: '40px 0', textAlign: 'center' }}>
             <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border)', zIndex: 1 }} />
             <span style={{ position: 'relative', background: 'var(--bg)', padding: '0 20px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', zIndex: 2 }}>
               OR CURATE WITH
             </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin 
              onSuccess={async (credentialResponse) => {
                 if (credentialResponse.credential) {
                    setLoading(true)
                    try {
                      await googleLogin(credentialResponse.credential)
                      toast.success('SIGNED IN WITH GOOGLE')
                      navigate('/dashboard')
                    } catch (err: any) {
                      toast.error(err.response?.data?.error || 'GOOGLE SSO FAILED')
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
             Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'none' }}>Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
