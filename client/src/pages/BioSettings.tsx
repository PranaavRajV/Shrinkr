import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Save, Layout as LayoutIcon, Link2, Palette, Globe, Check, AlertCircle, 
  Trash2, GripVertical, Plus, ExternalLink, Eye, Copy,
  Smartphone, Monitor, User
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../lib/api'
import Layout from '../components/Layout'
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, 
  useSensor, useSensors, DragEndEvent 
} from '@dnd-kit/core'
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, 
  verticalListSortingStrategy, useSortable 
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface BioLink {
  _id: string
  urlId: string
  shortCode: string
  originalUrl: string
  customTitle: string
  showClickCount: boolean
  totalClicks: number
  order: number
}

interface BioSettings {
  username: string
  bioName: string
  bioDescription: string
  bioAvatar: string
  bioTheme: 'dark' | 'light' | 'accent'
}

// ─── SORTABLE ITEM COMPONENT ─────────────────────────────────────────────────
function SortableLink({ link, onRemove, onUpdate }: { 
  link: BioLink, 
  onRemove: (id: string) => void,
  onUpdate: (id: string, updates: Partial<BioLink>) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link._id })
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 100 : 1 }

  return (
    <div ref={setNodeRef} style={style} className={`bio-link-card ${isDragging ? 'dragging' : ''}`}>
      <div {...attributes} {...listeners} style={{ cursor: 'grab', padding: '0 8px', color: '#333' }}>
        <GripVertical size={20} />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '10px', fontWeight: 900, color: '#555', display: 'block', marginBottom: '4px' }}>CUSTOM TITLE</label>
            <input 
              value={link.customTitle} 
              onChange={(e) => onUpdate(link._id, { customTitle: e.target.value })}
              onBlur={() => onUpdate(link._id, { customTitle: link.customTitle })} // Trigger save on blur
              placeholder="e.g. My Website"
              style={{ width: '100%', padding: '10px 12px', background: '#111', border: '1px solid #222', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
            />
          </div>
          <div style={{ width: '120px' }}>
            <label style={{ fontSize: '10px', fontWeight: 900, color: '#555', display: 'block', marginBottom: '4px' }}>CLICKS</label>
            <div style={{ padding: '10px 12px', background: '#111', border: '1px solid #222', borderRadius: '8px', color: 'var(--accent)', fontSize: '13px', fontWeight: 800 }}>
              {link.totalClicks}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#888' }}>
              <input 
                type="checkbox" 
                checked={link.showClickCount} 
                onChange={(e) => onUpdate(link._id, { showClickCount: e.target.checked })}
              />
              Show clicks to visitors
            </label>
          </div>
          <button 
            onClick={() => onRemove(link.urlId)}
            style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '4px' }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function BioSettings() {
  const [settings, setSettings] = useState<BioSettings>({
    username: '', bioName: '', bioDescription: '', bioAvatar: '', bioTheme: 'dark'
  })
  const [links, setLinks] = useState<BioLink[]>([])
  const [availableLinks, setAvailableLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [activeTab, setActiveTab] = useState<'profile' | 'links' | 'appearance'>('profile')
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [userRes, urlsRes] = await Promise.all([
        api.get('/api/users/me'),
        api.get('/api/urls')
      ])
      const user = userRes.data.data
      setSettings({
        username: user.username || '',
        bioName: user.bioName || user.email.split('@')[0],
        bioDescription: user.bioDescription || '',
        bioAvatar: user.bioAvatar || '',
        bioTheme: user.bioTheme || 'dark'
      })
      setLinks(user.bioLinks || [])
      setAvailableLinks(urlsRes.data.data.urls.filter((u: any) => !user.bioLinks.some((bl: any) => bl.urlId === u._id)))
    } catch (err) {
      toast.error('Failed to load bio settings')
    } finally {
      setLoading(false)
    }
  }

  const checkUsername = async (username: string) => {
    if (!username || username.length < 3) return setUsernameStatus('idle')
    setUsernameStatus('checking')
    try {
      const res = await api.get(`/api/bio/check/${username}`)
      setUsernameStatus(res.data.available ? 'available' : 'taken')
    } catch (err) {
      setUsernameStatus('taken')
    }
  }

  const saveSettings = async () => {
    try {
      const res = await api.put('/api/bio/settings', settings)
      toast.success(res.data.message)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save profile')
    }
  }

  const addLink = async (urlId: string) => {
    try {
      const res = await api.post(`/api/bio/links/${urlId}`)
      fetchData() // Refresh
      toast.success('Link added to bio')
    } catch (err) {
      toast.error('Failed to add link')
    }
  }

  const removeLink = async (urlId: string) => {
    try {
      await api.delete(`/api/bio/links/${urlId}`)
      fetchData()
      toast.success('Link removed from bio')
    } catch (err) {
      toast.error('Failed to remove link')
    }
  }

  const handleUpdateLink = async (id: string, updates: Partial<BioLink>) => {
    const newLinks = links.map(l => l._id === id ? { ...l, ...updates } : l)
    setLinks(newLinks)
    // Persist changes
    try {
      await api.put('/api/bio/links', { links: newLinks.map(l => ({ 
        urlId: l.urlId, 
        customTitle: l.customTitle, 
        showClickCount: l.showClickCount,
        order: l.order 
      })) })
    } catch (err) {
      toast.error('Failed to sync changes')
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex(l => l._id === active.id)
      const newIndex = links.findIndex(l => l._id === over.id)
      const newLinks = arrayMove(links, oldIndex, newIndex).map((l, i) => ({ ...l, order: i }))
      setLinks(newLinks)
      // Save order
      try {
        await api.put('/api/bio/links', { links: newLinks.map(l => ({ 
          urlId: l.urlId, 
          customTitle: l.customTitle, 
          showClickCount: l.showClickCount,
          order: l.order 
        })) })
      } catch (err) {
        toast.error('Failed to save order')
      }
    }
  }

  const copyBioLink = () => {
    const url = `${window.location.origin}/u/${settings.username}`
    navigator.clipboard.writeText(url)
    toast.success('Bio link copied to clipboard')
  }

  if (loading) return null

  return (
    <Layout>
      <div style={{ padding: '40px', display: 'flex', gap: '40px', minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Globe size={20} color="var(--accent)" />
                <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.04em' }}>LINK IN BIO</h1>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Curate your digital presence into a single, high-converting page.</p>
            </div>
            
            {settings.username && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={copyBioLink}
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: '#fff', padding: '10px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Copy size={14} /> COPY LINK
                </button>
                <Link2 
                  onClick={() => window.open(`/u/${settings.username}`, '_blank')}
                  size={42} 
                  style={{ background: 'var(--accent)', color: '#000', padding: '12px', borderRadius: '12px', cursor: 'pointer' }} 
                />
              </div>
            )}
          </header>

          {/* TABS */}
          <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--border)', marginBottom: '32px', paddingBottom: '1px' }}>
            {[
              { id: 'profile', label: 'PROFILE', icon: User },
              { id: 'links', label: 'LINKS', icon: Link2 },
              { id: 'appearance', label: 'THEME', icon: Palette },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  background: 'transparent', border: 'none', padding: '12px 0', cursor: 'pointer',
                  fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px',
                  color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: `2px solid ${activeTab === tab.id ? 'var(--accent)' : 'transparent'}`,
                  transition: 'all 0.2s'
                }}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>

          <div style={{ maxWidth: '600px' }}>
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  
                  {/* Username Field */}
                  <div className="settings-field">
                    <label>UNIQUE USERNAME</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#555', fontWeight: 800 }}>shrinkr.com/u/</span>
                      <input 
                        value={settings.username}
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                          setSettings({ ...settings, username: val })
                          checkUsername(val)
                        }}
                        placeholder="yourname"
                        style={{ paddingLeft: '115px' }}
                      />
                      <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                        {usernameStatus === 'checking' && <div className="loader-small" />}
                        {usernameStatus === 'available' && <Check size={18} color="var(--accent)" />}
                        {usernameStatus === 'taken' && <AlertCircle size={18} color="#ff4444" />}
                      </div>
                    </div>
                    {usernameStatus === 'available' && <p style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '8px', fontWeight: 800 }}>BOOM! THIS HANDLE IS FRESH.</p>}
                    {usernameStatus === 'taken' && <p style={{ fontSize: '11px', color: '#ff4444', marginTop: '8px', fontWeight: 800 }}>DAMN, THAT'S ALREADY CLAIMED.</p>}
                  </div>

                  {/* Display Name */}
                  <div className="settings-field">
                    <label>BIO DISPLAY NAME</label>
                    <input 
                      value={settings.bioName}
                      onChange={(e) => setSettings({ ...settings, bioName: e.target.value })}
                      placeholder="e.g. Satoshi Nakamoto"
                    />
                  </div>

                  {/* Bio Avatar */}
                  <div className="settings-field">
                    <label>AVATAR IMAGE URL</label>
                    <input 
                      value={settings.bioAvatar}
                      onChange={(e) => setSettings({ ...settings, bioAvatar: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  {/* Description */}
                  <div className="settings-field">
                    <label>SHORT BIO DESCRIPTION</label>
                    <textarea 
                      value={settings.bioDescription}
                      onChange={(e) => setSettings({ ...settings, bioDescription: e.target.value })}
                      placeholder="Tell the world who you are in 160 chars..."
                      style={{ minHeight: '100px', resize: 'vertical' }}
                    />
                  </div>

                  <button className="primary-button" onClick={saveSettings} style={{ width: 'fit-content', padding: '16px 40px' }}>
                    <Save size={18} /> SAVE PROFILE
                  </button>
                </div>
              </motion.div>
            )}

            {/* LINKS TAB */}
            {activeTab === 'links' && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                
                {/* Add Link Selector */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 900, color: 'var(--accent)', display: 'block', marginBottom: '16px', letterSpacing: '0.1em' }}>ADD LIVE URL TO BIO</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <select 
                      onChange={(e) => {
                        if (e.target.value) {
                          addLink(e.target.value)
                          e.target.value = ''
                        }
                      }}
                      style={{ flex: 1, background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '13px', fontWeight: 600 }}
                    >
                      <option value="">Select a link to add...</option>
                      {availableLinks.length === 0 ? (
                        <option disabled>No more links available to add</option>
                      ) : (
                        availableLinks.map(u => (
                          <option key={u._id} value={u._id}>{u.customAlias || u.shortCode} → {u.originalUrl}</option>
                        ))
                      )}
                    </select>
                    <button style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '12px', padding: '0 20px', fontWeight: 900, fontSize: '12px' }}>
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* Draggable List */}
                <DndContext 
                  sensors={sensors} 
                  collisionDetection={closestCenter} 
                  onDragEnd={handleDragEnd}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <SortableContext items={links.map((l: BioLink) => l._id)} strategy={verticalListSortingStrategy}>
                      {links.map((link: BioLink) => (
                        <SortableLink 
                          key={link._id} 
                          link={link} 
                          onRemove={removeLink} 
                          onUpdate={handleUpdateLink}
                        />
                      ))}
                    </SortableContext>
                    
                    {links.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#555', border: '2px dashed var(--border)', borderRadius: '16px' }}>
                        Your bio is currently empty. Add some links above!
                      </div>
                    )}
                  </div>
                </DndContext>
              </motion.div>
            )}

            {/* THEME TAB */}
            {activeTab === 'appearance' && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  {[
                    { id: 'dark', label: 'JET BLACK', bg: '#0A0A0A', border: '#222', accent: 'var(--accent)' },
                    { id: 'light', label: 'CLEAN WHITE', bg: '#FAFAFA', border: '#DDD', accent: '#000' },
                    { id: 'accent', label: 'NEON SHOCK', bg: 'var(--accent)', border: 'rgba(0,0,0,0.1)', accent: '#000' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSettings({ ...settings, bioTheme: t.id as any })
                        api.put('/api/bio/settings', { ...settings, bioTheme: t.id }) // Auto save theme
                      }}
                      style={{
                        background: t.bg, border: `2px solid ${settings.bioTheme === t.id ? 'var(--accent)' : t.border}`,
                        borderRadius: '16px', padding: '24px', height: '160px', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: t.accent, boxShadow: settings.bioTheme === t.id ? '0 0 20px var(--accent)' : 'none' }} />
                      <span style={{ fontSize: '10px', fontWeight: 900, color: t.id === 'light' ? '#000' : (t.id === 'accent' ? '#000' : '#fff'), letterSpacing: '0.1em' }}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* LIVE PREVIEW SECTION */}
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
           <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '12px', width: 'fit-content', marginLeft: 'auto' }}>
              <button 
                onClick={() => setPreviewMode('mobile')}
                style={{ background: previewMode === 'mobile' ? 'var(--bg)' : 'transparent', border: 'none', color: previewMode === 'mobile' ? 'var(--accent)' : '#555', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}
              >
                <Smartphone size={16} />
              </button>
              <button 
                onClick={() => setPreviewMode('desktop')}
                style={{ background: previewMode === 'desktop' ? 'var(--bg)' : 'transparent', border: 'none', color: previewMode === 'desktop' ? 'var(--accent)' : '#555', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}
              >
                <Monitor size={16} />
              </button>
           </div>

           <div className={`preview-container ${previewMode}`}>
              <div className="preview-screen">
                 {/* Iframe-like preview content */}
                 <PreviewContent settings={settings} links={links} />
              </div>
           </div>
           
           <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>
              <Eye size={12} style={{ marginRight: '6px' }} /> LIVE PREVIEW
           </div>
        </div>
      </div>

      <style>{`
        .settings-field { display: flex; flex-direction: column; gap: 8px; }
        .settings-field label { font-size: 10px; font-weight: 900; color: var(--text-muted); letter-spacing: 0.1em; }
        .settings-field input, .settings-field textarea {
          background: var(--bg-secondary); border: 1px solid var(--border);
          border-radius: 12px; padding: 14px 16px; color: #fff; font-size: 14px;
          transition: border-color 0.2s; width: 100%;
        }
        .settings-field input:focus { border-color: var(--accent); outline: none; }
        
        .bio-link-card {
          background: #111; border: 1px solid #222; border-radius: 16px;
          padding: 16px; display: flex; align-items: center; gap: 12px;
          transition: all 0.2s;
        }
        .bio-link-card.dragging { opacity: 0.5; border-color: var(--accent); }
        
        .preview-container.mobile {
          width: 320px; height: 600px; margin: 0 auto;
          border: 12px solid #1a1a1a; border-radius: 40px;
          overflow: hidden; background: #000;
          box-shadow: 0 40px 100px rgba(0,0,0,0.8);
        }
        .preview-screen { width: 100%; height: 100%; overflow-y: auto; }
        .preview-screen::-webkit-scrollbar { width: 0; }
        
        .loader-small { width: 14px; height: 14px; border: 2px solid #333; border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </Layout>
  )
}

function PreviewContent({ settings, links }: { settings: BioSettings, links: BioLink[] }) {
  const themeStyles: any = {
    dark: { bg: '#0A0A0A', text: '#FFFFFF', muted: '#555', card: '#161616', border: '#222', accent: 'var(--accent)' },
    light: { bg: '#FAFAFA', text: '#000000', muted: '#888', card: '#FFFFFF', border: '#EEE', accent: 'var(--accent)' },
    accent: { bg: 'var(--accent)', text: '#000000', muted: 'rgba(0,0,0,0.5)', card: 'rgba(0,0,0,0.05)', border: 'rgba(0,0,0,0.1)', accent: '#000' }
  }
  const s = themeStyles[settings.bioTheme] || themeStyles.dark

  return (
    <div style={{ minHeight: '100%', background: s.bg, padding: '40px 16px', color: s.text }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', border: `2px solid ${s.accent}`, margin: '0 auto 16px', overflow: 'hidden', background: s.card, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {settings.bioAvatar ? <img src={settings.bioAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User color={s.accent} />}
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '4px' }}>{settings.bioName || 'Brand Name'}</h2>
        <p style={{ fontSize: '12px', color: s.muted, marginBottom: '8px' }}>@{settings.username || 'username'}</p>
        <p style={{ fontSize: '11px', color: s.muted, lineHeight: 1.5 }}>{settings.bioDescription || 'Description goes here...'}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {links.map(l => (
          <div key={l._id} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
             <ExternalLink size={14} color={s.accent} style={{ flexShrink: 0 }} />
             <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.customTitle || 'Untitled Link'}</div>
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}
