import { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { User, Shield, Key, Camera, Mail, Info, Save } from 'lucide-react'

const S = {
  card: {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '40px',
    boxShadow: 'var(--shadow-sm)',
    marginBottom: '32px'
  },
  label: {
    fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)',
    textTransform: 'uppercase' as const, letterSpacing: '0.12em',
    marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px'
  },
  input: {
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', fontSize: '14px', padding: '12px 16px',
    borderRadius: 'var(--radius-md)', outline: 'none', width: '100%',
    transition: 'all 0.2s',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #B0A483 0%, #8D7F5F 100%)',
    border: 'none', color: '#fff', fontWeight: 700, fontSize: '13px',
    textTransform: 'uppercase' as const, letterSpacing: '0.05em',
    cursor: 'pointer', padding: '14px 28px', borderRadius: 'var(--radius-full)',
    display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(176, 164, 131, 0.2)'
  }
}

export default function Profile() {
  const { user, refreshProfile, logout } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(user?.name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [saving, setSaving] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [changingPw, setChangingPw] = useState(false)

  // Sync with context if user changes (e.g. after background load or successful update)
  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setBio(user.bio || '')
      setAvatar(user.avatar || '')
    }
  }, [user])

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setAvatar(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch('/api/users/me', { name, bio, avatar })
      await refreshProfile()
      toast.success('PROFILE UPDATED')
    } catch {
      toast.error('UPDATE FAILED')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setChangingPw(true)
    try {
      await api.patch('/api/users/me/password', {
        currentPassword: currentPw,
        newPassword: newPw
      })
      toast.success('PASSWORD CHANGED')
      setCurrentPw(''); setNewPw('')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'ACTION FAILED')
    } finally {
      setChangingPw(false)
    }
  }

  if (!user) return null

  return (
    <Layout>
      <div className="fade-in" style={{ padding: '40px' }}>
        <div style={{ marginBottom: '56px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff' }}>Account Settings</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '15px', maxWidth: '600px' }}>
             Fine-tune your personal profile, manage security protocols, and configure your ZURL experience.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '40px', alignItems: 'start' }}>
           {/* Sidebar Info */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ ...S.card, textAlign: 'center', marginBottom: 0 }}>
                 <div 
                    onClick={handleAvatarClick}
                    style={{
                       width: '128px', height: '128px', borderRadius: '50%',
                       border: '2px solid var(--border)', margin: '0 auto 28px',
                       overflow: 'hidden', cursor: 'pointer', position: 'relative',
                       background: 'var(--bg-secondary)', transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                 >
                    {avatar ? (
                      <img src={avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ fontSize: '44px', fontWeight: 900, color: 'var(--accent)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {user.email.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ 
                      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0, transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                    >
                       <Camera color="#fff" size={24} />
                    </div>
                 </div>
                 <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>{user.name || 'Professional Member'}</h2>
                 <p style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: '6px' }}>PREMIUM ACCESS</p>
                 <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '12px', opacity: 0.7 }}>{user.email}</p>
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
              </div>

              <div style={{ ...S.card, marginBottom: 0 }}>
                 <h3 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={16} color="var(--accent)" />
                    Security Baseline
                 </h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {[
                      { l: 'Auth Method', v: 'Standard JWT' },
                      { l: 'Region Compliance', v: 'Verified (ISO)' },
                      { l: 'Session Status', v: 'Encrypted' }
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                         <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{item.l}</span>
                         <span style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>{item.v}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <button 
                 onClick={logout}
                 style={{ 
                   background: 'none', color: '#ff4444', 
                   border: '1px solid rgba(255,68,68,0.2)', width: '100%', height: '52px',
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   borderRadius: 'var(--radius-md)', cursor: 'pointer',
                   fontSize: '12px', fontWeight: 900, letterSpacing: '0.1em',
                   transition: 'all 0.2s'
                 }}
                 onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,68,68,0.05)'; e.currentTarget.style.borderColor = '#ff4444'; }}
                 onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(255,68,68,0.2)'; }}
              >
                 TERMINATE SESSION
              </button>
           </div>

           {/* Forms */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div style={{ ...S.card, marginBottom: 0 }}>
                 <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '36px', display: 'flex', alignItems: 'center', gap: '14px', color: '#fff' }}>
                    <User size={22} color="var(--accent)" />
                    Profile Identity
                 </h3>
                 <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
                       <div>
                          <label style={S.label}><Mail size={12} /> Registered Email</label>
                          <input style={{ ...S.input, background: '#0a0a0a', opacity: 0.5, cursor: 'not-allowed' }} value={user.email} disabled />
                       </div>
                       <div>
                          <label style={S.label}><User size={12} /> Preferred Name</label>
                          <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" />
                       </div>
                    </div>
                    <div>
                       <label style={S.label}><Info size={12} /> Identity Statement (Bio)</label>
                       <textarea 
                          style={{ ...S.input, minHeight: '120px', resize: 'vertical' }} 
                          value={bio} 
                          onChange={e => setBio(e.target.value)} 
                          placeholder="Tell us about yourself..."
                       />
                    </div>
                    <button type="submit" disabled={saving} style={{ ...S.btnPrimary, width: 'fit-content' }}>
                       <Save size={18} />
                       {saving ? 'UPDATING...' : 'Commit Changes'}
                    </button>
                 </form>
              </div>

              <div style={{ ...S.card, marginBottom: 0 }}>
                 <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '36px', display: 'flex', alignItems: 'center', gap: '14px', color: '#fff' }}>
                    <Key size={22} color="var(--accent)" />
                    Security Access
                 </h3>
                 <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
                      <div>
                         <label style={S.label}>Existing Password</label>
                         <input type="password" style={S.input} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
                      </div>
                      <div>
                         <label style={S.label}>New Secure Pattern</label>
                         <input type="password" style={S.input} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" />
                      </div>
                    </div>
                    <button type="submit" disabled={changingPw} style={{ ...S.btnPrimary, background: '#fff', color: '#000', width: 'fit-content', boxShadow: 'none' }}>
                       {changingPw ? 'MODIFYING...' : 'Apply New Password'}
                    </button>
                 </form>
              </div>
           </div>
        </div>
      </div>
    </Layout>
  )
}

