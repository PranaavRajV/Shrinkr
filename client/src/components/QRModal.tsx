import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { QRCodeCanvas } from 'qrcode.react'
import { Download, Copy, X, Check, ExternalLink, Printer } from 'lucide-react'
import toast from 'react-hot-toast'

type QRModalProps = {
  shortUrl: string
  onClose: () => void
}

export default function QRModal({ shortUrl, onClose }: QRModalProps) {
  useEffect(() => {
    localStorage.setItem('shrinkr_qr_generated', 'true')
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

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
      ctx.fillStyle = '#ffe0c2'
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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) { toast.error('Popup blocked — please allow to print'); return }

    const qrSrc = qrRef.current?.toDataURL('image/png')
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${code}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0; 
              color: #000;
              text-align: center;
            }
            .container { padding: 40px; border: 2px solid #eee; border-radius: 20px; }
            .qr-id { font-size: 32px; font-weight: 900; margin-bottom: 8px; }
            .url { font-size: 14px; color: #666; margin-bottom: 32px; font-weight: 400; }
            img { width: 300px; height: 300px; margin-bottom: 32px; }
            .footer { font-size: 12px; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: 0.1em; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="qr-id">shrinkr.co/${code}</div>
            <div class="url">${shortUrl}</div>
            <img src="${qrSrc}" />
            <div class="footer">Created with Shrinkr</div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
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
          background: 'var(--card)',
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
            background: 'none', border: '1px solid var(--border)', borderRadius: '8px',
            padding: '6px', color: 'var(--muted-foreground)', cursor: 'pointer', display: 'flex'
          }}
        >
          <X size={15} />
        </button>

        {/* Label */}
        <div style={{ fontSize: '10px', fontWeight: 800, color: '#ffe0c2', letterSpacing: '0.2em', marginBottom: '6px' }}>
          SECURE QR CODE
        </div>
        <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--foreground)', marginBottom: '28px', letterSpacing: '-0.03em' }}>
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
            { top: '-2px', left: '-2px', borderTop: '3px solid #ffe0c2', borderLeft: '3px solid #ffe0c2' },
            { top: '-2px', right: '-2px', borderTop: '3px solid #ffe0c2', borderRight: '3px solid #ffe0c2' },
            { bottom: '-2px', left: '-2px', borderBottom: '3px solid #ffe0c2', borderLeft: '3px solid #ffe0c2' },
            { bottom: '-2px', right: '-2px', borderBottom: '3px solid #ffe0c2', borderRight: '3px solid #ffe0c2' },
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
          fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '24px',
          textAlign: 'center', maxWidth: '280px',
          wordBreak: 'break-all', lineHeight: 1.5
        }}>
          {shortUrl}
        </div>

        {/* Open link */}
        <a
          href={shortUrl} target="_blank" rel="noreferrer"
          style={{
            fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '20px',
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
              background: downloading ? '#1a1a1a' : '#ffe0c2',
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={handlePrint}
              style={{
                height: '52px',
                background: '#1a1a1a',
                border: '1px solid var(--border)',
                color: '#aaa',
                fontWeight: 800, fontSize: '13px', textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                borderRadius: '12px',
                transition: 'all 0.2s',
              }}
            >
              <Printer size={16} /> PRINT
            </button>
            <button
              onClick={copyLink}
              style={{
                height: '52px',
                background: copied ? 'rgba(255,224,194,0.1)' : '#1a1a1a',
                border: `1px solid ${copied ? 'rgba(255,224,194,0.3)' : '#222'}`,
                color: copied ? '#ffe0c2' : '#aaa',
                fontWeight: 800, fontSize: '13px', textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                borderRadius: '12px',
                transition: 'all 0.2s',
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'COPIED!' : 'COPY'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
