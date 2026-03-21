import { motion } from 'framer-motion'
import { Twitter, MessageCircle, Linkedin, Globe, X } from 'lucide-react'
import { useState } from 'react'

interface OGData {
  title: string
  description: string
  image: string
  favicon: string
  siteName: string
}

interface Props {
  data: OGData | null
  loading: boolean
  onClose: () => void
}

export default function OGPreview({ data, loading, onClose }: Props) {
  const [platform, setPlatform] = useState<'x' | 'whatsapp' | 'linkedin'>('x')

  if (!loading && !data) return null

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      style={{ 
        marginTop: '24px', 
        background: 'rgba(255,255,255,0.02)', 
        border: '1px solid #1a1a1a', 
        borderRadius: '20px', 
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <button 
        onClick={onClose}
        style={{ 
          position: 'absolute', top: '12px', right: '12px', zIndex: 10,
          background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
          padding: '4px', cursor: 'pointer', color: '#fff'
        }}
      >
        <X size={14} />
      </button>

      {/* TABS */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a1a' }}>
        {[
          { id: 'x', label: 'X / Twitter', icon: <Twitter size={12} /> },
          { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={12} /> },
          { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={12} /> }
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setPlatform(t.id as any)}
            style={{
              flex: 1, padding: '12px', background: 'none', border: 'none',
              borderBottom: platform === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: platform === t.id ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '10px', fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.1em', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="skeleton" style={{ width: '100%', height: '140px', borderRadius: '12px' }} />
            <div className="skeleton" style={{ width: '40%', height: '10px' }} />
            <div className="skeleton" style={{ width: '80%', height: '14px' }} />
            <div className="skeleton" style={{ width: '100%', height: '10px' }} />
          </div>
        ) : data ? (
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            {platform === 'x' && (
              <div style={{ background: '#000', border: '1px solid #333', borderRadius: '12px', overflow: 'hidden' }}>
                {data.image ? (
                  <img src={data.image} alt="" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '200px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Globe size={40} color="#222" />
                  </div>
                )}
                <div style={{ padding: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#71767b', marginBottom: '2px' }}>{new URL(data.siteName || 'https://link.com').hostname}</div>
                  <div style={{ fontSize: '14px', fontWeight: 400, color: '#e7e9ea', marginBottom: '2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{data.title}</div>
                  <div style={{ fontSize: '14px', color: '#71767b', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{data.description}</div>
                </div>
              </div>
            )}

            {platform === 'whatsapp' && (
              <div style={{ background: '#0b141a', borderLeft: '4px solid #00a884', borderRadius: '4px 12px 12px 4px', padding: '8px 12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#00a884', marginBottom: '2px' }}>{data.siteName}</div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#e9edef', marginBottom: '2px' }}>{data.title}</div>
                  <div style={{ fontSize: '13px', color: '#8696a0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{data.description}</div>
                </div>
                {data.image && <img src={data.image} alt="" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />}
              </div>
            )}

            {platform === 'linkedin' && (
              <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                {data.image && <img src={data.image} alt="" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />}
                <div style={{ padding: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#000', marginBottom: '4px' }}>{data.title}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{new URL(data.siteName || 'https://link.com').hostname}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
            <Globe size={32} style={{ marginBottom: '12px', opacity: 0.2 }} />
            <div style={{ fontSize: '12px', fontWeight: 800 }}>No preview available for this URL</div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
