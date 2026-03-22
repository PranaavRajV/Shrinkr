import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Key, Plus, Trash2, Copy, Check, Eye, EyeOff, 
  Terminal, Shield, Zap, Clock, Code2, ExternalLink,
  ChevronRight, AlertTriangle, Lock, Globe
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../lib/api'
import Layout from '../components/Layout'
import { format } from 'date-fns'

interface ApiKey {
  _id: string
  name: string
  keyPrefix: string
  permissions: {
    read: boolean
    create: boolean
    update: boolean
    delete: boolean
  }
  rateLimit: number
  usageCount: number
  lastUsed: string | null
  expiresAt: string | null
  isActive: boolean
  createdAt: string
}

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyData, setNewKeyData] = useState<any>(null)
  
  // NEW KEY FORM
  const [formData, setFormData] = useState({
    name: '',
    rateLimit: 100,
    expiresAt: '',
    permissions: {
      read: true,
      create: true,
      update: true,
      delete: false
    }
  })

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    try {
      const res = await api.get('/api/apikeys')
      setKeys(res.data.data.keys)
    } catch (err) {
      toast.error('Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  const createKey = async () => {
    if (!formData.name) return toast.error('Key name is required')
    try {
      const payload = {
        ...formData,
        expiresAt: formData.expiresAt || null
      }
      const res = await api.post('/api/apikeys', payload)
      setNewKeyData(res.data.data) // Raw key here
      setShowCreateModal(false)
      fetchKeys()
      toast.success('API Key generated successfully')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create key')
    }
  }

  const revokeKey = async (id: string) => {
    if (!window.confirm('Permanently delete this API key? This cannot be undone.')) return
    // Optimistically remove from UI immediately
    setKeys(prev => prev.filter(k => k._id !== id))
    try {
      await api.delete(`/api/apikeys/${id}`)
      toast.success('API key deleted')
    } catch (err) {
      // Rollback on failure
      fetchKeys()
      toast.error('Failed to delete key')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'node' | 'python'>('curl')

  const codeSnippets = {
    curl: `curl -X POST "${window.location.origin}/api/urls" \\
  -H "X-API-Key: ${newKeyData?.key || 'sk_live_...'}" \\
  -H "Content-Type: application/json" \\
  -d '{"originalUrl": "https://google.com"}'`,
    node: `const axios = require('axios');

const createLink = async () => {
  const res = await axios.post('${window.location.origin}/api/urls', {
    originalUrl: 'https://google.com'
  }, {
    headers: { 'X-API-Key': '${newKeyData?.key || 'sk_live_...'}' }
  });
  console.log(res.data);
};`,
    python: `import requests

url = "${window.location.origin}/api/urls"
headers = { "X-API-Key": "${newKeyData?.key || 'sk_live_...'}" }
data = { "originalUrl": "https://google.com" }

response = requests.post(url, json=data, headers=headers)
print(response.json())`
  }

  if (loading) return null

  return (
    <Layout>
      <div style={{ padding: '40px' }}>
        
        <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Terminal size={24} color="var(--accent)" />
              <h1 style={{ fontSize: '32px', fontWeight: 950, letterSpacing: '-0.04em' }}>API & DEVELOPERS</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Build programmatic integrations with our enterprise-grade URL API.</p>
          </div>
          <button 
             onClick={() => setShowCreateModal(true)}
             className="primary-button" 
             style={{ width: 'fit-content', padding: '12px 24px', background: 'var(--accent)', color: 'var(--primary-foreground)', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> GENERATE NEW KEY
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px' }}>
           
           {/* KEYS LIST */}
           <section>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {keys.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', border: '1px solid var(--border)', borderRadius: '24px', background: 'var(--bg-secondary)', borderStyle: 'dashed' }}>
                       <Lock size={48} color="#222" style={{ marginBottom: '24px' }} />
                       <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '8px' }}>NO ACTIVE KEYS</h3>
                       <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>Generate your first API key to start building with Shrinkr.</p>
                    </div>
                 ) : (
                    keys.map(key => (
                       <motion.div 
                          key={key._id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{
                             background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px',
                             display: 'flex', alignItems: 'center', gap: '24px', opacity: key.isActive ? 1 : 0.5
                          }}
                       >
                          <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(255, 224, 194, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                             <Key size={22} />
                          </div>

                          <div style={{ flex: 1 }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 900 }}>{key.name}</h3>
                                {!key.isActive && <span style={{ fontSize: '10px', fontWeight: 900, background: '#ff4444', color: 'var(--foreground)', padding: '2px 8px', borderRadius: '4px' }}>REVOKED</span>}
                             </div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <span style={{ fontFamily: 'monospace', color: 'var(--muted-foreground)' }}>{key.keyPrefix}</span>
                                <span>{key.usageCount} CLICKS</span>
                                <span>{key.lastUsed ? `LAST USED ${format(new Date(key.lastUsed), 'MMM d, h:mm a')}` : 'NEVER USED'}</span>
                             </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                             {key.permissions.create && <Shield size={14} color="var(--accent)" />}
                             {key.permissions.delete && <AlertTriangle size={14} color="#ff4444" />}
                          </div>

                          <button 
                           onClick={() => revokeKey(key._id)}
                           title="Delete key permanently"
                           style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'background 0.15s' }}
                           onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
                           onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                           <Trash2 size={18} />
                        </button>
                       </motion.div>
                    ))
                 )}
              </div>
           </section>

           {/* SIDEBAR TIPS & DOCS */}
           <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <Zap size={18} color="var(--accent)" />
                    <h4 style={{ fontSize: '14px', fontWeight: 900 }}>QUICK START</h4>
                 </div>
                 <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                    Use the <b>X-API-Key</b> header to authenticate your requests. Never share your secret keys in client-side code.
                 </p>
                  <a 
                    href="/api/docs" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontSize: '12px', fontWeight: 900, textDecoration: 'none', padding: '10px 18px', background: 'rgba(255,224,194,0.06)', border: '1px solid rgba(255,224,194,0.15)', borderRadius: '10px', transition: 'all 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,224,194,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,224,194,0.06)')}
                  >
                     VIEW FULL API DOCS <ExternalLink size={14} />
                  </a>
              </div>

              <div style={{ background: 'var(--background)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <Code2 size={18} color="#888" />
                    <h4 style={{ fontSize: '14px', fontWeight: 900 }}>RATE LIMITS</h4>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 900 }}>
                       <span style={{ color: 'var(--muted-foreground)' }}>BASIC TIER</span>
                       <span style={{ color: 'var(--foreground)' }}>100 REQ/HR</span>
                    </div>
                    <div style={{ height: '4px', background: '#333', borderRadius: '2px' }}>
                       <div style={{ width: '40%', height: '100%', background: 'var(--accent)', borderRadius: '2px' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '4px' }}>Contact support for enterprise limits up to 10M requests/mo.</p>
                 </div>
              </div>
           </aside>
        </div>

        {/* REVEAL MODAL */}
        <AnimatePresence>
          {newKeyData && (
            <div className="modal-overlay">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-content" style={{ maxWidth: '600px', padding: '32px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '20px', background: 'rgba(255, 224, 194, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', margin: '0 auto 24px' }}>
                    <Shield size={32} />
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px' }}>YOUR SECRET API KEY</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Save this key now. We won't show it to you again for security reasons.</p>
                </div>

                <div style={{ background: 'var(--background)', borderRadius: '16px', border: '1px solid var(--border)', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                   <span style={{ flex: 1, fontFamily: 'monospace', color: 'var(--accent)', fontSize: '16px', fontWeight: 800, wordBreak: 'break-all' }}>{newKeyData.key}</span>
                   <button 
                     onClick={() => copyToClipboard(newKeyData.key)}
                     style={{ background: 'var(--accent)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
                   >
                     <Copy size={16} color="#000" />
                   </button>
                </div>

                {/* CODE SNIPPETS */}
                <div style={{ marginBottom: '32px' }}>
                   <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                      {['curl', 'node', 'python'].map(tab => (
                         <button key={tab} onClick={() => setActiveCodeTab(tab as any)} style={{ background: 'transparent', border: 'none', color: activeCodeTab === tab ? 'var(--accent)' : '#555', padding: '8px 0', borderBottom: `2px solid ${activeCodeTab === tab ? 'var(--accent)' : 'transparent'}`, cursor: 'pointer', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>{tab}</button>
                      ))}
                   </div>
                   <pre style={{ background: '#080808', padding: '20px', borderRadius: '12px', fontSize: '13px', color: 'var(--muted-foreground)', overflowX: 'auto', border: '1px solid var(--border)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {codeSnippets[activeCodeTab]}
                   </pre>
                </div>

                <button style={{ width: '100%', background: 'var(--accent)', color: 'var(--primary-foreground)', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }} onClick={() => setNewKeyData(null)}>
                   I'VE SAVED THE KEY
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* CREATE MODAL */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="modal-overlay">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-content" style={{ maxWidth: '480px' }}>
                 <h2 style={{ fontSize: '24px', fontWeight: 950, marginBottom: '8px' }}>CREATE API KEY</h2>
                 <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>Configure your new programmatic access key.</p>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="input-group">
                       <label>KEY NAME</label>
                       <input 
                         value={formData.name}
                         onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                         placeholder="e.g. Production Backend"
                         style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', color: 'var(--foreground)' }}
                       />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                       <div className="input-group">
                          <label>RATE LIMIT (/HR)</label>
                          <input 
                             type="number"
                             value={formData.rateLimit}
                             onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) })}
                             style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', color: 'var(--foreground)' }}
                          />
                       </div>
                       <div className="input-group">
                          <label>EXPIRES AT (OPTIONAL)</label>
                          <input 
                             type="date"
                             value={formData.expiresAt}
                             onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                             style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', color: 'var(--foreground)' }}
                          />
                       </div>
                    </div>

                    <div className="input-group">
                       <label>PERMISSIONS</label>
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                          {Object.entries(formData.permissions).map(([perm, val]) => (
                             <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                                <input 
                                  type="checkbox" 
                                  checked={val} 
                                  onChange={(e) => setFormData({ ...formData, permissions: { ...formData.permissions, [perm]: e.target.checked } })}
                                />
                                {perm.toUpperCase()}
                             </label>
                          ))}
                       </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                       <button style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--foreground)', border: '1px solid var(--border)', padding: '14px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }} onClick={() => setShowCreateModal(false)}>CANCEL</button>
                       <button style={{ flex: 1, background: 'var(--accent)', color: 'var(--primary-foreground)', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 950, cursor: 'pointer' }} onClick={createKey}>GENERATE KEY</button>
                    </div>
                 </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
         .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(20px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
         .modal-content { background: var(--bg); border: 1px solid var(--border); border-radius: 32px; padding: 40px; width: 100%; box-shadow: 0 40px 100px rgba(0,0,0,1); }
         .input-group label { display: block; font-size: 10px; font-weight: 900; color: #555; margin-bottom: 8px; letter-spacing: 0.1em; }
         .input-group input:focus { border-color: var(--accent) !important; outline: none; }
      `}</style>
    </Layout>
  )
}
