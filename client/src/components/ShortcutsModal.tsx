import { motion } from 'framer-motion'
import { X, Command } from 'lucide-react'

interface ShortcutsModalProps {
  onClose: () => void
}

export default function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  const shortcuts = [
    { key: 'N', action: 'New link' },
    { key: '/', action: 'Search links' },
    { key: 'G + D', action: 'Go to Dashboard' },
    { key: 'G + A', action: 'Go to Analytics' },
    { key: '?', action: 'Show shortcuts' },
    { key: 'Esc', action: 'Close modal / cancel' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        style={{ width: '100%', maxWidth: '440px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}
      >
        <div style={{ padding: '32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--accent)', color: 'var(--primary-foreground)', padding: '8px', borderRadius: '10px' }}><Command size={18} /></div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--foreground)' }}>Shortcuts</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '32px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                <th style={{ textAlign: 'left', padding: '0 0 16px 0', fontSize: '10px', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Key</th>
                <th style={{ textAlign: 'left', padding: '0 0 16px 0', fontSize: '10px', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {shortcuts.map((s, i) => (
                <tr key={i} style={{ borderBottom: i === shortcuts.length - 1 ? 'none' : '1px solid #151515' }}>
                  <td style={{ padding: '16px 0' }}>
                    <code style={{ background: 'var(--background)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'monospace' }}>{s.key}</code>
                  </td>
                  <td style={{ padding: '16px 0', fontSize: '14px', color: '#ccc', fontWeight: 500 }}>{s.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: 700 }}>PRO TIP: USE G THEN D TO NAVIGATE INSTANTLY</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
