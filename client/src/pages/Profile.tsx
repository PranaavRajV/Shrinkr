import { useState, useRef } from 'react'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import toast from 'react-hot-toast'

const S = {
  page: {
    minHeight: '100vh',
    background: '#09090B',
    color: '#FAFAFA',
    fontFamily: 'Space Grotesk, sans-serif',
  } as React.CSSProperties,
  main: {
    padding: '100px 24px 80px',
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
  } as React.CSSProperties,
  section: {
    background: '#111',
    border: '1px solid #3F3F46',
    padding: '32px',
    marginBottom: '32px',
    position: 'relative' as const,
  },
  label: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    color: '#A1A1AA',
    marginBottom: '8px',
    display: 'block',
  },
  input: {
    background: '#09090B',
    border: '1px solid #3F3F46',
    color: '#FAFAFA',
    fontFamily: 'Space Grotesk, sans-serif',
    fontSize: '14px',
    padding: '12px',
    outline: 'none',
    width: '100%',
    marginBottom: '20px',
  },
  btnYellow: {
    background: '#DFE104',
    border: 'none',
    color: '#000',
    fontFamily: 'Space Grotesk, sans-serif',
    fontWeight: 700,
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    cursor: 'pointer',
    padding: '12px 24px',
  },
  avatarWrap: {
    width: '100px',
    height: '100px',
    border: '3px solid #DFE104',
    background: '#09090B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 900,
    color: '#DFE104',
    marginBottom: '20px',
    cursor: 'pointer',
    position: 'relative' as const,
    overflow: 'hidden',
  },
}

export default function Profile() {
  const { user, refreshProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile data
  const [name, setName] = useState(user?.name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [saving, setSaving] = useState(false)

  // Password data
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [changingPw, setChangingPw] = useState(false)

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large (max 2MB)')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatar(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch('/api/users/me', { name, bio, avatar })
      await refreshProfile()
      toast.success('Profile updated')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Update failed')
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
      toast.success('Password changed successfully')
      setCurrentPw('')
      setNewPw('')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Password change failed')
    } finally {
      setChangingPw(false)
    }
  }

  if (!user) return null

  return (
    <div style={S.page}>
      <Navbar pageTitle="My Profile" />
      <main style={S.main}>
        
        <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '40px', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
          Profile Settings
        </h1>

        {/* ── PROFILE INFO ──────────────────────────────────────────────── */}
        <div style={S.section}>
          <div style={{ ...S.label, marginBottom: '24px' }}>Identity & Information</div>
          
          <form onSubmit={handleUpdateProfile}>
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              <div>
                <span style={S.label}>Profile Picture</span>
                <div 
                  className="avatar-upload"
                  style={S.avatarWrap} 
                  onClick={handleAvatarClick}
                >
                  {avatar ? (
                    <img src={avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
                  ) : (
                    user.email.charAt(0).toUpperCase()
                  )}
                  <div 
                    className="avatar-overlay"
                    style={{
                      position: 'absolute', inset: 0, background: 'rgba(223, 225, 4, 0.8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0, transition: 'opacity 0.2s', color: '#000', fontSize: '10px'
                    }}
                  >
                    CHANGE
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
              </div>

              <div style={{ flex: '1 1 300px' }}>
                <span style={S.label}>Email Address (Read-only)</span>
                <input style={{ ...S.input, opacity: 0.6, cursor: 'not-allowed' }} value={user.email} disabled />

                <span style={S.label}>Full Name</span>
                <input 
                  style={S.input} 
                  placeholder="Zurl User" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />

                <span style={S.label}>Short Bio</span>
                <textarea 
                  style={{ ...S.input, minHeight: '80px', resize: 'vertical' }} 
                  placeholder="Tell us about yourself..." 
                  value={bio} 
                  onChange={e => setBio(e.target.value)} 
                />

                <button 
                  type="submit" 
                  style={{ ...S.btnYellow, opacity: saving ? 0.6 : 1 }}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Update Profile →'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ── ACCOUNT SECURITY ──────────────────────────────────────────── */}
        <div style={S.section}>
          <div style={{ ...S.label, marginBottom: '20px' }}>Security Settings</div>
          
          <form onSubmit={handleChangePassword} style={{ maxWidth: '400px' }}>
            <span style={S.label}>Current Password</span>
            <input 
              type="password" 
              style={S.input} 
              value={currentPw} 
              onChange={e => setCurrentPw(e.target.value)} 
              required
            />

            <span style={S.label}>New Password</span>
            <input 
              type="password" 
              style={S.input} 
              value={newPw} 
              onChange={e => setNewPw(e.target.value)} 
              required
              minLength={8}
            />

            <button 
              type="submit" 
              style={{ ...S.btnYellow, opacity: changingPw ? 0.6 : 1 }}
              disabled={changingPw}
            >
              {changingPw ? 'Changing...' : 'Change Password →'}
            </button>
          </form>
        </div>

        {/* ── ACCOUNT DETAILS ───────────────────────────────────────────── */}
        <div style={{ ...S.section, borderColor: '#27272A', background: 'transparent' }}>
          <div style={S.label}>Account Details</div>
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#555' }}>
            User ID: <span style={{ fontFamily: 'monospace' }}>{user.id}</span>
          </div>
        </div>

      </main>
    </div>
  )
}
