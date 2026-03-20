import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('WELCOME BACK ⚡')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'LOGIN FAILED')
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
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        border: '2px solid #3F3F46',
        padding: '32px',
        background: '#111111'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ 
            textDecoration: 'none', color: '#DFE104', 
            fontSize: '24px', fontWeight: 700,
            letterSpacing: '-0.04em', textTransform: 'uppercase'
          }}>
            ZURL
          </Link>
          <h2 style={{ 
            fontSize: '28px', fontWeight: 700, 
            marginTop: '16px', textTransform: 'uppercase',
            letterSpacing: '-0.02em', lineHeight: 1
          }}>
            Welcome Back
          </h2>
          <p style={{ color: '#555', fontSize: '11px', marginTop: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            ENTER YOUR CREDENTIALS TO ACCESS DASHBOARD
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', color: '#A1A1AA', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '8px' }}>
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              style={{
                width: '100%',
                background: '#1a1a1a',
                border: '1px solid #3F3F46',
                padding: '12px',
                color: '#FAFAFA',
                fontFamily: 'inherit',
                outline: 'none',
                fontSize: '14px'
              }}
              onFocus={(e) => e.target.style.borderColor = '#DFE104'}
              onBlur={(e) => e.target.style.borderColor = '#3F3F46'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10px', color: '#A1A1AA', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '8px' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                background: '#1a1a1a',
                border: '1px solid #3F3F46',
                padding: '12px',
                color: '#FAFAFA',
                fontFamily: 'inherit',
                outline: 'none',
                fontSize: '14px'
              }}
              onFocus={(e) => e.target.style.borderColor = '#DFE104'}
              onBlur={(e) => e.target.style.borderColor = '#3F3F46'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '48px',
              background: loading ? '#333' : '#DFE104',
              color: '#000',
              border: 'none',
              fontWeight: 700,
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '12px'
            }}
          >
            {loading ? 'LOGGING IN...' : 'LOGIN →'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#555' }}>
          NEW HERE? <Link to="/register" style={{ color: '#DFE104', textDecoration: 'none', fontWeight: 700 }}>CREATE ACCOUNT</Link>
        </div>
      </div>
    </div>
  )
}
