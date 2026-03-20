import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import toast from 'react-hot-toast'

type QRModalProps = {
  shortUrl: string   // the short code URL, e.g. http://localhost:4001/BBWK6vO
  shortCode?: string // optional override label
  onClose: () => void
}

export default function QRModal({ shortUrl, onClose }: QRModalProps) {
  // Direct ref to the underlying <canvas> element rendered by QRCodeCanvas
  const qrRef = useRef<HTMLCanvasElement>(null)
  const [downloading, setDownloading] = useState(false)

  const code = shortUrl.split('/').pop() || 'qr'

  // ── Download as proper padded PNG ────────────────────────────────────────
  const downloadPNG = () => {
    setDownloading(true)
    try {
      const src = qrRef.current
      if (!src) { toast.error('QR canvas not ready'); return }

      const PAD  = 32
      const SIZE = src.width
      const out  = document.createElement('canvas')
      out.width  = SIZE + PAD * 2
      out.height = SIZE + PAD * 2

      const ctx = out.getContext('2d')!
      // White background
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, out.width, out.height)
      // Paste the QR
      ctx.drawImage(src, PAD, PAD)

      // Force download
      out.toBlob(blob => {
        if (!blob) { toast.error('Failed to generate PNG'); return }
        const url  = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href     = url
        link.download = `zurl-qr-${code}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('QR downloaded!')
      }, 'image/png')
    } catch (e) {
      toast.error('Download failed')
    } finally {
      setDownloading(false)
    }
  }

  // ── Copy the short link ───────────────────────────────────────────────────
  const copyLink = () => {
    navigator.clipboard.writeText(shortUrl)
      .then(() => toast.success('Link copied!'))
      .catch(() => toast.error('Copy failed'))
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.90)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        fontFamily: 'Space Grotesk, sans-serif',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#09090B',
          border: '2px solid #3F3F46',
          width: '100%', maxWidth: '360px',
          padding: '36px 32px 28px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '14px', right: '16px',
          background: 'transparent', border: 'none',
          color: '#555', cursor: 'pointer', fontSize: '22px', lineHeight: 1,
        }}>×</button>

        {/* Tag */}
        <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.3em', color: '#555', marginBottom: '6px' }}>
          QR CODE
        </div>

        {/* Short code */}
        <div style={{ fontSize: '22px', fontWeight: 900, color: '#DFE104', letterSpacing: '-0.03em', textTransform: 'uppercase', marginBottom: '24px' }}>
          /{code}
        </div>

        {/* QR — ref directly on canvas */}
        <div style={{ background: '#fff', padding: '16px', border: '4px solid #DFE104', marginBottom: '20px' }}>
          <QRCodeCanvas
            ref={qrRef}
            value={shortUrl}
            size={200}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Short URL label */}
        <div style={{
          fontSize: '10px', color: '#555', marginBottom: '24px',
          maxWidth: '260px', textAlign: 'center',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          letterSpacing: '0.02em',
        }}>
          {shortUrl}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          <button
            onClick={downloadPNG}
            disabled={downloading}
            style={{
              height: '48px', width: '100%',
              background: downloading ? '#a0a800' : '#DFE104',
              border: 'none', color: '#000',
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700,
              fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em',
              cursor: downloading ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'background 150ms',
            }}
          >
            {/* Download icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="butt" strokeLinejoin="miter">
              <line x1="12" y1="3" x2="12" y2="16"/><polyline points="7 11 12 16 17 11"/><line x1="5" y1="21" x2="19" y2="21"/>
            </svg>
            {downloading ? 'Generating...' : 'Download PNG'}
          </button>

          <button
            onClick={copyLink}
            style={{
              height: '48px', width: '100%',
              background: 'transparent', border: '1px solid #3F3F46',
              color: '#A1A1AA',
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700,
              fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="9" y="9" width="13" height="13"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy Link
          </button>
        </div>

        <div style={{ marginTop: '18px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: '#27272A' }}>
          POINT CAMERA TO SCAN · ZURL
        </div>
      </div>
    </div>
  )
}
