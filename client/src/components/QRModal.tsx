import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { QRCodeCanvas } from 'qrcode.react'
import { Download, Copy, X, Check, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

type QRModalProps = {
  shortUrl: string
  onClose: () => void
}

export default function QRModal({ shortUrl, onClose }: QRModalProps) {
  const qrRef = useRef<HTMLCanvasElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const code = shortUrl.split('/').pop() || 'qr'

  const downloadPNG = async () => {
    const src = qrRef.current
    if (!src) { toast.error('QR canvas not ready'); return }
    setDownloading(true)
    try {
      // Build a new canvas with padding + dark background
      const PAD = 48
      const SIZE = src.width
      const out = document.createElement('canvas')
      out.width = SIZE + PAD * 2
      out.height = SIZE + PAD * 2 + 60  // extra space for label at bottom

      const ctx = out.getContext('2d')!

      // Dark background
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, out.width, out.height)

      // White QR tile
      ctx.fillStyle = '#FFFFFF'
      const corner = 16
      const rx = PAD - 8, ry = PAD - 8, rw = SIZE + 16, rh = SIZE + 16
      ctx.beginPath()
      ctx.moveTo(rx + corner, ry)
      ctx.lineTo(rx + rw - corner, ry)
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + corner)
      ctx.lineTo(rx + rw, ry + rh - corner)
      ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - corner, ry + rh)
      ctx.lineTo(rx + corner, ry + rh)
      ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - corner)
      ctx.lineTo(rx, ry + corner)
      ctx.quadraticCurveTo(rx, ry, rx + corner, ry)
      ctx.closePath()
      ctx.fill()

      // Draw actual QR
      ctx.drawImage(src, PAD, PAD)

      // Label at bottom
      ctx.fillStyle = '#CBFF00'
      ctx.font = 'bold 14px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`zurl.app/${code}`, out.width / 2, out.height - 18)

      // Download
      await new Promise<void>((resolve, reject) => {
        out.toBlob(blob => {
          if (!blob) { reject(new Error('Blob generation failed')); return }
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `zurl-qr-${code}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          setTimeout(() => URL.revokeObjectURL(url), 100)
          resolve()
        }, 'image/png', 1.0)
      })

      toast.success('QR CODE DOWNLOADED AS PNG ✓')
    } catch (e) {
      console.error(e)
      toast.error('Download failed — try again')
    } finally {
      setDownloading(false)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl)
      setCopied(true)
      toast.success('LINK COPIED!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('COPY FAILED')
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        style={{
          background: '#111',
          borderRadius: '20px',
          border: '1px solid #1a1a1a',
          width: '100%', maxWidth: '380px',
          padding: '36px 28px 28px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          position: 'relative',
          boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'none', border: '1px solid #222', borderRadius: '8px',
            padding: '6px', color: '#555', cursor: 'pointer', display: 'flex'
          }}
        >
          <X size={15} />
        </button>

        {/* Label */}
        <div style={{ fontSize: '10px', fontWeight: 800, color: '#CBFF00', letterSpacing: '0.2em', marginBottom: '6px' }}>
          SECURE QR CODE
        </div>
        <div style={{ fontSize: '26px', fontWeight: 900, color: '#fff', marginBottom: '28px', letterSpacing: '-0.03em' }}>
          /{code}
        </div>

        {/* QR Container — white tile on dark background */}
        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '16px',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.4)',
          marginBottom: '24px',
          position: 'relative',
        }}>
          {/* Corner accents */}
          {[
            { top: '-2px', left: '-2px', borderTop: '3px solid #CBFF00', borderLeft: '3px solid #CBFF00' },
            { top: '-2px', right: '-2px', borderTop: '3px solid #CBFF00', borderRight: '3px solid #CBFF00' },
            { bottom: '-2px', left: '-2px', borderBottom: '3px solid #CBFF00', borderLeft: '3px solid #CBFF00' },
            { bottom: '-2px', right: '-2px', borderBottom: '3px solid #CBFF00', borderRight: '3px solid #CBFF00' },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: '16px', height: '16px', borderRadius: '2px', ...s }} />
          ))}
          <QRCodeCanvas
            ref={qrRef}
            value={shortUrl}
            size={200}
            level="H"
            includeMargin={false}
            fgColor="#000000"
            bgColor="#FFFFFF"
          />
        </div>

        {/* URL label */}
        <div style={{
          fontSize: '11px', color: '#444', marginBottom: '24px',
          textAlign: 'center', maxWidth: '280px',
          wordBreak: 'break-all', lineHeight: 1.5
        }}>
          {shortUrl}
        </div>

        {/* Open link */}
        <a
          href={shortUrl} target="_blank" rel="noreferrer"
          style={{
            fontSize: '11px', color: '#555', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none',
            fontWeight: 700
          }}
        >
          <ExternalLink size={12} /> Test this link
        </a>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          <button
            onClick={downloadPNG}
            disabled={downloading}
            style={{
              height: '52px', width: '100%',
              background: downloading ? '#1a1a1a' : '#CBFF00',
              border: 'none',
              color: downloading ? '#444' : '#000',
              fontWeight: 900, fontSize: '13px', textTransform: 'uppercase',
              cursor: downloading ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              borderRadius: '12px', letterSpacing: '0.06em',
              transition: 'all 0.2s',
            }}
          >
            <Download size={17} />
            {downloading ? 'GENERATING...' : 'DOWNLOAD PNG'}
          </button>

          <button
            onClick={copyLink}
            style={{
              height: '52px', width: '100%',
              background: copied ? 'rgba(203,255,0,0.1)' : '#1a1a1a',
              border: `1px solid ${copied ? 'rgba(203,255,0,0.3)' : '#222'}`,
              color: copied ? '#CBFF00' : '#aaa',
              fontWeight: 800, fontSize: '13px', textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              borderRadius: '12px',
              transition: 'all 0.2s',
            }}
          >
            {copied ? <Check size={17} /> : <Copy size={17} />}
            {copied ? 'COPIED!' : 'COPY LINK'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
