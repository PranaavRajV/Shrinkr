import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { User, Shield, Key, Camera, Mail, Info, Save, ShieldCheck, QrCode, Laptop, Copy, AlertCircle, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
    border: 'none', color: 'var(--foreground)', fontWeight: 700, fontSize: '13px',
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
  const [twoFactorAction, setTwoFactorAction] = useState<'setup' | 'disable' | null>(null)

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
          <h1 style={{ fontSize: '42px', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--foreground)' }}>Account Settings</h1>
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
                 <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--foreground)' }}>{user.name || 'Professional Member'}</h2>
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
                 <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '36px', display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--foreground)' }}>
                    <User size={22} color="var(--accent)" />
                    Profile Identity
                 </h3>
                 <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
                       <div>
                          <label style={S.label}><Mail size={12} /> Registered Email</label>
                          <input style={{ ...S.input, background: 'var(--background)', opacity: 0.5, cursor: 'not-allowed' }} value={user.email} disabled />
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
                 <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '36px', display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--foreground)' }}>
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
                    <button type="submit" disabled={changingPw} style={{ ...S.btnPrimary, background: '#fff', color: 'var(--primary-foreground)', width: 'fit-content', boxShadow: 'none' }}>
                       {changingPw ? 'MODIFYING...' : 'Apply New Password'}
                    </button>
                 </form>
              </div>

              <div style={{ ...S.card, marginBottom: 0 }}>
                 <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--foreground)' }}>
                    <ShieldCheck size={22} color="var(--accent)" />
                    Two-Factor Authentication
                 </h3>
                 <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '32px' }}>
                   Add an extra layer of security to your account by requiring a verification code from your mobile device.
                 </p>
                 
                 {user.twoFactorEnabled ? (
                   <div style={{ background: 'rgba(255,224,194,0.05)', border: '1px solid var(--accent)', padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                       <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircle2 color="#000" size={24} />
                       </div>
                       <div>
                          <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--foreground)' }}>2FA IS ENABLED</div>
                          <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 800 }}>SECURE ACCESS ACTIVE</div>
                       </div>
                     </div>
                     <button 
                        onClick={() => setTwoFactorAction('disable')}
                        style={{ background: 'transparent', border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444', padding: '10px 20px', borderRadius: '12px', fontSize: '11px', fontWeight: 900, cursor: 'pointer' }}
                     >
                        DISABLE 2FA
                     </button>
                   </div>
                 ) : (
                   <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                         <AlertCircle color="#ffcc00" size={32} />
                         <div>
                            <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--foreground)' }}>2FA IS DISABLED</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>YOUR ACCOUNT IS AT RISK</div>
                         </div>
                      </div>
                      <button 
                         onClick={() => setTwoFactorAction('setup')}
                         style={{ ...S.btnPrimary, width: 'fit-content' }}
                      >
                         ENABLE MFA
                      </button>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
      <TwoFactorModal action={twoFactorAction} onClose={() => { setTwoFactorAction(null); refreshProfile(); }} />
    </Layout>
  )
}

function TwoFactorModal({ action, onClose }: { action: 'setup' | 'disable' | null, onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [setupData, setSetupData] = useState<any>(null);
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (action === 'setup') {
       setStep(1);
       setToken('');
       startSetup();
    }
  }, [action]);

  const startSetup = async () => {
    try {
      const res = await api.post('/api/auth/2fa/setup');
      setSetupData(res.data.data);
    } catch (err) {
      toast.error('Failed to start setup');
      onClose();
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/2fa/verify-setup', { token });
      setBackupCodes(res.data.data.backupCodes);
      setStep(3);
      toast.success('MFA ENABLED ✓');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'INVALID CODE');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await api.post('/api/auth/2fa/disable', { token, password });
      toast.success('2FA DISABLED');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'DEACTIVATION FAILED');
    } finally {
      setLoading(false);
    }
  };

  if (!action) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
       <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'var(--background)', border: '1px solid var(--border)', padding: '48px', borderRadius: '32px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          
          <AnimatePresence mode="wait">
             {action === 'setup' ? (
                <div key="setup">
                   {step === 1 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                         <div style={{ width: 64, height: 64, background: 'rgba(255,224,194,0.1)', borderRadius: '16px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                            <QrCode size={32} />
                         </div>
                         <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px', color: 'var(--foreground)' }}>SCAN QR CODE</h2>
                         <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '32px', lineHeight: 1.6 }}>Scan the image below with Google Authenticator or Authy to begin setup.</p>
                         
                         {setupData ? (
                            <img src={setupData.qrCode} style={{ width: '200px', height: '200px', borderRadius: '12px', border: '8px solid #fff', margin: '0 auto 24px' }} alt="QR" />
                         ) : <div style={{ height: '200px' }} />}
                         
                         <button style={{ ...S.btnPrimary, margin: '0 auto' }} onClick={() => setStep(2)}>NEXT STEP</button>
                      </motion.div>
                   )}
                   {step === 2 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                         <div style={{ width: 64, height: 64, background: 'rgba(255,224,194,0.1)', borderRadius: '16px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                            <ShieldCheck size={32} />
                         </div>
                         <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px', color: 'var(--foreground)' }}>VERIFY DEVICE</h2>
                         <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '32px' }}>Enter the 6-digit code from your app.</p>
                         
                         <input 
                            value={token} 
                            onChange={e => setToken(e.target.value.replace(/[^0-9]/g, '').slice(0,6))}
                            placeholder="000000"
                            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', color: 'var(--foreground)', fontSize: '24px', fontWeight: 900, textAlign: 'center', letterSpacing: '0.4em', width: '100%', marginBottom: '24px', outline: 'none' }}
                         />
                         
                         <button style={{ ...S.btnPrimary, margin: '0 auto' }} disabled={token.length !== 6 || loading} onClick={handleVerify}>
                            {loading ? 'VERIFYING...' : 'FINALIZE SETUP'}
                         </button>
                      </motion.div>
                   )}
                   {step === 3 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                         <div style={{ width: 64, height: 64, background: 'rgba(255,224,194,0.1)', borderRadius: '16px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                            <Key size={32} />
                         </div>
                         <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px', color: 'var(--foreground)' }}>BACKUP CODES</h2>
                         <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '32px' }}>Save these codes! You'll need them if you lose your phone.</p>
                         
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--background)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '32px' }}>
                            {backupCodes.map(code => (
                               <div key={code} style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '12px', fontWeight: 800 }}>{code}</div>
                            ))}
                         </div>
                         
                         <button style={{ ...S.btnPrimary, margin: '0 auto' }} onClick={onClose}>I'VE SAVED THEM</button>
                      </motion.div>
                   )}
                </div>
             ) : (
                <div key="disable">
                   <div style={{ width: 64, height: 64, background: 'rgba(255,68,68,0.1)', borderRadius: '16px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4444' }}>
                      <AlertCircle size={32} />
                   </div>
                   <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px', color: 'var(--foreground)' }}>DISABLE MFA?</h2>
                   <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '32px' }}>Enter your password and 2FA code to confirm.</p>
                   
                   <div style={{ textAlign: 'left', marginBottom: '24px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 900, color: 'var(--muted-foreground)', marginBottom: '8px', display: 'block' }}>ACCOUNT PASSWORD</label>
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', color: 'var(--foreground)', fontSize: '14px', width: '100%', marginBottom: '16px', outline: 'none' }} />
                      
                      <label style={{ fontSize: '10px', fontWeight: 900, color: 'var(--muted-foreground)', marginBottom: '8px', display: 'block' }}>APP CODE</label>
                      <input value={token} onChange={e => setToken(e.target.value)} placeholder="000000" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', color: 'var(--foreground)', fontSize: '14px', width: '100%', outline: 'none' }} />
                   </div>
                   
                   <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={onClose} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted-foreground)', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', height: '48px' }}>CANCEL</button>
                      <button onClick={handleDisable} disabled={loading} style={{ flex: 1, background: '#ff4444', color: 'var(--foreground)', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', height: '48px' }}>
                         {loading ? 'DISABLING...' : 'CONFIRM'}
                      </button>
                   </div>
                </div>
             )}
          </AnimatePresence>
       </motion.div>
    </div>
  );
}
