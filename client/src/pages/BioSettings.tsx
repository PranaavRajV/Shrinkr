import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Save, Layout as LayoutIcon, Link2, Palette, Globe, Check, AlertCircle, 
  Trash2, GripVertical, Plus, ExternalLink, Eye, Copy,
  Smartphone, Monitor, User, Loader2
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
      <div {...attributes} {...listeners} style={{ cursor: 'grab', padding: '0 8px', color: 'var(--muted-foreground)' }}>
        <GripVertical size={20} />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '10px', fontWeight: 900, color: 'var(--muted-foreground)', display: 'block', marginBottom: '4px' }}>CUSTOM TITLE</label>
            <input 
              value={link.customTitle} 
              onChange={(e) => onUpdate(link._id, { customTitle: e.target.value })}
              onBlur={() => onUpdate(link._id, { customTitle: link.customTitle })} // Trigger save on blur
              placeholder="e.g. My Website"
              style={{ width: '100%', padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)', fontSize: '13px' }}
            />
          </div>
          <div style={{ width: '120px' }}>
            <label style={{ fontSize: '10px', fontWeight: 900, color: 'var(--muted-foreground)', display: 'block', marginBottom: '4px' }}>CLICKS</label>
            <div style={{ padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--accent)', fontSize: '13px', fontWeight: 800 }}>
              {link.totalClicks}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--muted-foreground)' }}>
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
  const [initialUsername, setInitialUsername] = useState('')
  const [links, setLinks] = useState<BioLink[]>([])
  const [availableLinks, setAvailableLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'too_short'>('idle')
  const [activeTab, setActiveTab] = useState<'profile' | 'links' | 'appearance'>('profile')
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile')
  const [pendingUrl, setPendingUrl] = useState('')
  const [selectedAvailableId, setSelectedAvailableId] = useState('')

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
        api.get('/api/urls', { params: { limit: 100 } })
      ])
      const user = userRes.data.data
      const existingBioLinks: any[] = user.bioLinks || []

      setSettings({
        username:       user.username       || '',
        bioName:        user.bioName        || (user.email ? user.email.split('@')[0] : ''),
        bioDescription: user.bioDescription || '',
        bioAvatar:      user.bioAvatar      || '',
        bioTheme:       user.bioTheme       || 'dark'
      })
      setInitialUsername(user.username || '')
      setLinks(existingBioLinks)

      // Filter out URLs already on the bio page
      const bioUrlIds = new Set(existingBioLinks.map((bl: any) => bl.urlId))
      const urls: any[] = urlsRes.data?.data?.urls || []
      setAvailableLinks(urls.filter((u: any) => !bioUrlIds.has(u._id)))
    } catch (err: any) {
      console.error('Bio settings load error:', err?.response?.data || err?.message || err)
      toast.error('Failed to load bio settings')
    } finally {
      setLoading(false)
    }
  }

  // Debounced username check
  useEffect(() => {
    if (!settings.username || settings.username === initialUsername) {
      setUsernameStatus('idle')
      return
    }
    
    if (settings.username.length < 3) {
      setUsernameStatus('too_short')
      return
    }

    const timer = setTimeout(async () => {
      setUsernameStatus('checking')
      try {
        const res = await api.get(`/api/bio/check/${settings.username}`)
        setUsernameStatus(res.data.data.available ? 'available' : 'taken')
      } catch (err) {
        setUsernameStatus('taken')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [settings.username, initialUsername])

  const saveSettings = async () => {
    if (usernameStatus === 'taken') return toast.error('ALREADY TAKEN. PICK ANOTHER NAME.')
    if (usernameStatus === 'checking') return
    
    setSaving(true)
    try {
      const res = await api.put('/api/bio/settings', settings)
      setInitialUsername(settings.username)
      setUsernameStatus('idle')
      toast.success(res.data.message || 'BIO PROFILE REWROTE ✓')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'COULD NOT SAVE PROFILE')
    } finally {
      setSaving(false)
    }
  }

  const addLink = async (urlId: string) => {
    if (!urlId) return
    try {
      await api.post(`/api/bio/links/${urlId}`)
      fetchData()
      setSelectedAvailableId('')
      toast.success('RESOURCE ADDED ✓')
    } catch (err) {
      toast.error('FAILED TO ADD RESOURCE')
    }
  }

  const handleQuickAdd = async () => {
    if (!pendingUrl) return
    setSaving(true)
    try {
      const res = await api.post('/api/urls', { originalUrl: pendingUrl })
      const newUrlId = res.data.data.url.id
      await api.post(`/api/bio/links/${newUrlId}`)
      setPendingUrl('')
      fetchData()
      toast.success('NEW LINK GENERATED & ADDED ✓')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'QUICK ADD FAILED')
    } finally {
      setSaving(false)
    }
  }

  const removeLink = async (urlId: string) => {
    try {
      await api.delete(`/api/bio/links/${urlId}`)
      fetchData()
      toast.success('BEYOND LINK REMOVED')
    } catch (err) {
      toast.error('FAILED TO REMOVE')
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
      // toast.error('Failed to sync changes')
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
    toast.success('UNIQUE URL COPIED ✓')
  }

  if (loading) return null

  return (
    <Layout>
      <div style={{ padding: '40px', display: 'flex', gap: '40px', minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Globe size={24} color="var(--accent)" />
                <h1 style={{ fontSize: '32px', fontWeight: 950, letterSpacing: '-0.04em' }}>LINK IN BIO</h1>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Curate your digital presence into a single, high-converting ecosystem.</p>
            </div>
            
            {settings.username && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={copyBioLink}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--foreground)', padding: '12px 20px', borderRadius: '12px', fontSize: '11px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.05em' }}
                >
                  <Copy size={16} /> COPY URL
                </button>
                <div 
                  onClick={() => window.open(`/u/${settings.username}`, '_blank')}
                  style={{ background: 'var(--accent)', color: 'var(--primary-foreground)', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                >
                  <ExternalLink size={20} color="#000" />
                </div>
              </div>
            )}
          </header>

          {/* TABS */}
          <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--border)', marginBottom: '32px', paddingBottom: '1px' }}>
            {[
              { id: 'profile', label: 'IDENTITY', icon: User },
              { id: 'links', label: 'RESOURCES', icon: Link2 },
              { id: 'appearance', label: 'AESTHETIC', icon: Palette },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  background: 'transparent', border: 'none', padding: '12px 0', cursor: 'pointer',
                  fontSize: '11px', fontWeight: 950, letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '8px',
                  color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: `2px solid ${activeTab === tab.id ? 'var(--accent)' : 'transparent'}`,
                  transition: 'all 0.2s',
                  textTransform: 'uppercase'
                }}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>

          <div style={{ maxWidth: '600px' }}>
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  
                  {/* Username Field */}
                  <div className="settings-field">
                    <label>UNIQUE IDENTIFIER (SHRINKR.COM/U/...)</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        value={settings.username}
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                          setSettings({ ...settings, username: val })
                        }}
                        placeholder="yourname"
                        style={{ 
                          paddingRight: '60px',
                          borderColor: usernameStatus === 'available' ? 'var(--accent)' : (usernameStatus === 'taken' ? '#ff4444' : 'var(--border)')
                        }}
                      />
                      <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                        {usernameStatus === 'checking' && <Loader2 size={18} className="animate-spin" color="var(--accent)" />}
                        {usernameStatus === 'available' && <Check size={18} color="var(--accent)" />}
                        {(usernameStatus === 'taken' || usernameStatus === 'too_short') && <AlertCircle size={18} color="#ff4444" />}
                      </div>
                    </div>
                    <AnimatePresence>
                      {usernameStatus === 'available' && (
                        <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ fontSize: '10px', color: 'var(--accent)', marginTop: '8px', fontWeight: 950, letterSpacing: '0.1em' }}>✓ SYSTEM STATUS: NAME IS OPEN</motion.p>
                      )}
                      {usernameStatus === 'taken' && (
                        <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ fontSize: '10px', color: '#ff4444', marginTop: '8px', fontWeight: 950, letterSpacing: '0.1em' }}>✕ CONFLICT: IDENTIFIER ALREADY IN USE</motion.p>
                      )}
                      {usernameStatus === 'too_short' && (
                        <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ fontSize: '10px', color: '#ff4444', marginTop: '8px', fontWeight: 950, letterSpacing: '0.1em' }}>✕ INVALID: MINIMUM 3 CHARACTERS REQUIRED</motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Display Name */}
                  <div className="settings-field">
                    <label>SIGNATURE DISPLAY NAME</label>
                    <input 
                      value={settings.bioName}
                      onChange={(e) => setSettings({ ...settings, bioName: e.target.value })}
                      placeholder="e.g. Satoshi Nakamoto"
                    />
                  </div>

                  {/* Bio Avatar */}
                  <div className="settings-field">
                    <label>AVATAR DATA URL</label>
                    <input 
                      value={settings.bioAvatar}
                      onChange={(e) => setSettings({ ...settings, bioAvatar: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  {/* Description */}
                  <div className="settings-field">
                    <label>MISSION STATEMENT (BIO)</label>
                    <textarea 
                      value={settings.bioDescription}
                      onChange={(e) => setSettings({ ...settings, bioDescription: e.target.value })}
                      placeholder="Tell the world who you are in 160 chars..."
                      style={{ minHeight: '120px', resize: 'vertical' }}
                    />
                  </div>

                  <button 
                    className="primary-button" 
                    onClick={saveSettings} 
                    disabled={saving || usernameStatus === 'taken' || usernameStatus === 'checking'}
                    style={{ 
                      width: 'fit-content', padding: '16px 40px', background: 'var(--accent)', color: 'var(--primary-foreground)', 
                      borderRadius: '12px', fontWeight: 950, border: 'none', cursor: 'pointer',
                      opacity: (saving || usernameStatus === 'taken' || usernameStatus === 'checking') ? 0.3 : 1
                    }}
                  >
                    {saving ? 'SYNCING...' : 'COMMIT PROFILE'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* LINKS TAB */}
            {activeTab === 'links' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                
                {/* Add Link Selector */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 950, color: 'var(--accent)', display: 'block', marginBottom: '16px', letterSpacing: '0.15em' }}>CONNECT SYSTEM RESOURCE</label>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                    <select 
                      value={selectedAvailableId}
                      onChange={(e) => setSelectedAvailableId(e.target.value)}
                      style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', color: 'var(--foreground)', fontSize: '13px', fontWeight: 600, outline: 'none' }}
                    >
                      <option value="">Select an existing link...</option>
                      {availableLinks.length === 0 ? (
                        <option disabled>NO AVAILABLE RESOURCES</option>
                      ) : (
                        availableLinks.map(u => (
                          <option key={u._id} value={u._id}>{u.customAlias || u.shortCode} → {u.originalUrl.substring(0, 30)}...</option>
                        ))
                      )}
                    </select>
                    <button 
                      onClick={() => addLink(selectedAvailableId)}
                      disabled={!selectedAvailableId}
                      style={{ background: 'var(--accent)', color: 'var(--primary-foreground)', border: 'none', borderRadius: '12px', padding: '0 24px', fontWeight: 950, fontSize: '12px', cursor: 'pointer', opacity: selectedAvailableId ? 1 : 0.3 }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div style={{ padding: '20px 0', borderTop: '1px dashed var(--border)', marginTop: '20px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 950, color: 'var(--text-muted)', display: 'block', marginBottom: '16px', letterSpacing: '0.15em' }}>OR QUICK-SYNC NEW URL</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input 
                        value={pendingUrl}
                        onChange={e => setPendingUrl(e.target.value)}
                        placeholder="https://paste-long-url-here.com"
                        style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', color: '#fff', fontSize: '13px' }}
                      />
                      <button 
                        onClick={handleQuickAdd}
                        disabled={!pendingUrl || saving}
                        style={{ background: 'var(--accent)', color: 'var(--primary-foreground)', border: 'none', borderRadius: '12px', padding: '0 24px', fontWeight: 950, fontSize: '11px', cursor: 'pointer', opacity: (pendingUrl && !saving) ? 1 : 0.3 }}
                      >
                        {saving ? 'SYNCING...' : 'GENERATE & ADD'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Draggable List */}
                <DndContext 
                  sensors={sensors} 
                  collisionDetection={closestCenter} 
                  onDragEnd={handleDragEnd}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted-foreground)', border: '2px dashed var(--border)', borderRadius: '24px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em' }}>
                         BIO ECOSYSTEM IS CURRENTLY OFFLINE. ADD RESOURCES ABOVE.
                      </div>
                    )}
                  </div>
                </DndContext>
              </motion.div>
            )}

            {/* THEME TAB */}
            {activeTab === 'appearance' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  {[
                    { id: 'dark', label: 'VOID BLACK', bg: '#0A0A0A', border: '#111', accent: 'var(--accent)' },
                    { id: 'light', label: 'BRIGHT WHITE', bg: '#FAFAFA', border: '#DDD', accent: '#000' },
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
                        borderRadius: '24px', padding: '32px', height: '180px', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: settings.bioTheme === t.id ? `0 10px 40px ${t.accent === '#000' ? 'rgba(0,0,0,0.2)' : 'rgba(255, 224, 194, 0.2)'}` : 'none'
                      }}
                    >
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: t.accent, border: t.id === 'light' ? '1px solid #ddd' : 'none' }} />
                      <span style={{ fontSize: '10px', fontWeight: 950, color: t.id === 'light' ? '#000' : (t.id === 'accent' ? '#000' : '#888'), letterSpacing: '0.2em' }}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* LIVE PREVIEW SECTION */}
        <div style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '40px', alignSelf: 'start' }}>
           <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '16px', width: 'fit-content', marginLeft: 'auto', border: '1px solid var(--border)' }}>
              <button 
                onClick={() => setPreviewMode('mobile')}
                style={{ background: previewMode === 'mobile' ? 'var(--bg)' : 'transparent', border: 'none', color: previewMode === 'mobile' ? 'var(--accent)' : '#444', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <Smartphone size={18} />
              </button>
              <button 
                onClick={() => setPreviewMode('desktop')}
                style={{ background: previewMode === 'desktop' ? 'var(--bg)' : 'transparent', border: 'none', color: previewMode === 'desktop' ? 'var(--accent)' : '#444', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <Monitor size={18} />
              </button>
           </div>

           <div className={`preview-container ${previewMode}`}>
              <div className="preview-screen">
                 <PreviewContent settings={settings} links={links} />
              </div>
           </div>
           
           <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: 950, color: 'var(--text-muted)', letterSpacing: '0.3em' }}>
              REAL-TIME SIMULATION
           </div>
        </div>
      </div>

      <style>{`
        .settings-field { display: flex; flex-direction: column; gap: 10px; }
        .settings-field label { font-size: 10px; font-weight: 950; color: var(--text-muted); letter-spacing: 0.15em; }
        .settings-field input, .settings-field textarea {
          background: #111; border: 1px solid var(--border);
          border-radius: 12px; padding: 16px 20px; color: #fff; font-size: 14px;
          transition: all 0.2s; width: 100%;
        }
        .settings-field input:focus { border-color: var(--accent); outline: none; background: #000; }
        
        .bio-link-card {
          background: #0D0D0D; border: 1px solid var(--border); border-radius: 20px;
          padding: 24px; display: flex; align-items: center; gap: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bio-link-card.dragging { opacity: 0.5; border-color: var(--accent); scale: 1.02; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .bio-link-card:hover { border-color: #333; }
        
        .preview-container.mobile {
          width: 320px; height: 600px; margin: 0 auto;
          border: 12px solid #1a1a1a; border-radius: 48px;
          overflow: hidden; background: #000;
          box-shadow: 0 40px 100px rgba(0,0,0,0.8);
        }
        .preview-container.desktop {
          width: 100%; height: 500px; border: 12px solid #1a1a1a; border-radius: 24px;
          overflow: hidden; background: #000;
        }
        .preview-screen { width: 100%; height: 100%; overflow-y: auto; }
        .preview-screen::-webkit-scrollbar { width: 0; }
        
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </Layout>
  )
}

function PreviewContent({ settings, links }: { settings: BioSettings, links: BioLink[] }) {
  const themeStyles: any = {
    dark: { bg: '#0A0A0A', text: '#FFFFFF', muted: '#555', card: '#111', border: '#222', accent: 'var(--accent)' },
    light: { bg: '#FAFAFA', text: '#000000', muted: '#AAA', card: '#FFF', border: '#EEE', accent: 'var(--accent)' },
    accent: { bg: 'var(--accent)', text: '#000000', muted: 'rgba(0,0,0,0.4)', card: 'rgba(0,0,0,0.05)', border: 'rgba(0,0,0,0.1)', accent: '#000' }
  }
  const s = themeStyles[settings.bioTheme] || themeStyles.dark

  return (
    <div style={{ minHeight: '100%', background: s.bg, padding: '48px 20px', color: s.text, transition: 'all 0.4s ease' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', border: `3px solid ${s.accent}`, margin: '0 auto 20px', overflow: 'hidden', background: s.card, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {settings.bioAvatar ? <img src={settings.bioAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={32} color={s.accent} />}
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 950, marginBottom: '6px', letterSpacing: '-0.02em' }}>{settings.bioName || 'Brand Identity'}</h2>
        <p style={{ fontSize: '13px', color: s.accent, marginBottom: '12px', fontWeight: 800 }}>@{settings.username || 'username'}</p>
        <p style={{ fontSize: '12px', color: s.muted, lineHeight: 1.6, maxWidth: '240px', margin: '0 auto' }}>{settings.bioDescription || 'Professional description goes here...'}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {links.map(l => (
          <div key={l._id} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: '16px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.2s' }}>
             <ExternalLink size={16} color={s.accent} style={{ flexShrink: 0 }} />
             <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.customTitle || 'Resource Title'}</div>
             </div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '48px', fontSize: '9px', fontWeight: 950, color: s.muted, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
         POWERED BY SHRINKR
      </div>
    </div>
  )
}
