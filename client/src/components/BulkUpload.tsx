import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Check, AlertCircle, X, Copy, ArrowLeft, Download, List, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import Papa from 'papaparse'

type BulkUploadProps = {
  onClose: () => void
  onSuccess: () => void
}

export default function BulkUpload({ onClose, onSuccess }: BulkUploadProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [urls, setUrls] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [mode, setMode] = useState<'file' | 'paste'>('paste')
  const [manualText, setManualText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processData = (data: any[]) => {
    const parsed = data.map(row => {
      const url = (row.originalUrl || row.url || row[0] || '').trim()
      const alias = (row.customAlias || row.alias || row[1] || '').trim()
      let isValid = false
      try { new URL(url); isValid = true } catch {}
      return { originalUrl: url, customAlias: alias, isValid }
    }).filter(u => u.originalUrl && u.originalUrl !== 'originalUrl')
    
    if (parsed.length === 0) { toast.error('No valid URLs found'); return }
    setUrls(parsed)
    setStep(2)
  }

  const handleFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => processData(results.data),
      error: () => toast.error('CSV Parsing failed')
    })
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) handleFile(file)
    else toast.error('Please drop a .csv file')
  }, [])

  const handleManualParse = () => {
    const results = Papa.parse(manualText, { header: false, skipEmptyLines: true })
    processData(results.data)
  }

  const handleBulkShorten = async () => {
    const validUrls = urls.filter(u => u.isValid)
    if (validUrls.length === 0) { toast.error('No valid URLs to shorten'); return }
    setUploading(true)
    try {
      const payload = validUrls.map(u => ({
        originalUrl: u.originalUrl,
        ...(u.customAlias ? { customAlias: u.customAlias } : {})
      }))
      const res = await api.post('/api/urls/bulk', { urls: payload })
      setResults(res.data.data.results)
      setStep(3)
      onSuccess()
      toast.success('BATCH PROCESSING COMPLETE')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'UPLOAD FAILED')
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    const csv = "originalUrl,customAlias\nhttps://google.com,google-link\nhttps://youtube.com,yt-link\nhttps://github.com,"
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'zurl-template.csv'
    document.body.appendChild(a); a.click(); a.remove()
  }

  const validCount = urls.filter(u => u.isValid).length
  const successCount = results.filter(r => r.success).length

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(32px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px'
    }} onClick={onClose}>
      <motion.div
        initial={{ y: 24, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111',
          borderRadius: '32px',
          width: '100%', maxWidth: '640px',
          padding: '56px',
          position: 'relative',
          boxShadow: '0 40px 120px rgba(0,0,0,1)',
          border: '1px solid #1a1a1a',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '24px', right: '24px',
            background: 'none', border: '1px solid #1a1a1a',
            borderRadius: '12px', padding: '10px', cursor: 'pointer',
            color: '#555', display: 'flex'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', marginBottom: '8px' }}>
            Bulk Shorten
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
            Process up to 50 links simultaneously via CSV or direct input.
          </p>
        </div>

        {/* PROGRESS */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '48px' }}>
          {[1, 2, 3].map((s, idx) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 900,
                background: step > s ? 'var(--accent)' : step === s ? '#fff' : '#0a0a0a',
                color: '#000',
                border: step === s ? '2px solid var(--accent)' : '2px solid transparent',
              }}>{step > s ? <Check size={18} /> : s}</div>
              {idx < 2 && <div style={{ width: '60px', height: '2px', background: step > s ? 'var(--accent)' : '#1a1a1a' }} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ display: 'flex', gap: '8px', background: '#0a0a0a', borderRadius: '16px', padding: '6px', marginBottom: '32px', border: '1px solid #1a1a1a' }}>
                {(['file', 'paste'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '12px', fontSize: '12px', fontWeight: 900, border: 'none', cursor: 'pointer', borderRadius: '12px', background: mode === m ? 'var(--accent)' : 'transparent', color: mode === m ? '#000' : '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {m === 'file' ? <Upload size={14} /> : <List size={14} />} {m === 'file' ? 'CSV FILE' : 'PASTE LIST'}
                  </button>
                ))}
              </div>

              {mode === 'file' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <input type="file" ref={fileInputRef} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} accept=".csv" style={{ display: 'none' }} />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    style={{ border: `2px dashed ${isDragging ? 'var(--accent)' : '#1a1a1a'}`, borderRadius: '24px', background: isDragging ? 'rgba(203,255,0,0.03)' : '#0a0a0a', padding: '80px 20px', cursor: 'pointer', textAlign: 'center' }}
                  >
                    <div style={{ width: '60px', height: '60px', background: '#111', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid #1a1a1a' }}>
                      <FileText size={28} color={isDragging ? 'var(--accent)' : '#444'} />
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>{isDragging ? 'Release to drop' : 'Drop CSV or click to browse'}</div>
                    <div style={{ fontSize: '13px', color: '#444' }}>Structure: <span style={{ color: '#666', fontFamily: 'monospace' }}>originalUrl, customAlias</span></div>
                  </div>
                  <button onClick={downloadTemplate} style={{ background: 'none', border: '1px solid #1a1a1a', color: 'var(--accent)', padding: '16px', borderRadius: '16px', fontSize: '12px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Download size={16} /> DOWNLOAD TEMPLATE
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <textarea
                    value={manualText}
                    onChange={e => setManualText(e.target.value)}
                    placeholder={'https://google.com, home-link\nhttps://github.com, git-repo\nhttps://twitter.com'}
                    style={{ width: '100%', height: '240px', background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#fff', padding: '24px', fontFamily: 'monospace', fontSize: '14px', outline: 'none', resize: 'none', borderRadius: '20px', lineHeight: 1.8, boxSizing: 'border-box' }}
                  />
                  <button onClick={handleManualParse} disabled={!manualText.trim()} style={{ height: '64px', width: '100%', background: manualText.trim() ? 'var(--accent)' : '#1a1a1a', color: manualText.trim() ? '#000' : '#333', fontWeight: 900, fontSize: '14px', border: 'none', cursor: manualText.trim() ? 'pointer' : 'not-allowed', borderRadius: '16px' }}>
                    PROCESS {manualText.split('\n').filter(l => l.trim()).length} LINKS →
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>Preview</h3>
                <div style={{ background: 'rgba(203,255,0,0.1)', color: 'var(--accent)', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 900 }}>{validCount} READY</div>
              </div>
              <div style={{ border: '1px solid #1a1a1a', borderRadius: '16px', maxHeight: '280px', overflowY: 'auto', marginBottom: '32px', background: '#0a0a0a' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#111', zIndex: 1 }}>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #1a1a1a' }}>
                      <th style={{ padding: '16px', fontSize: '11px', fontWeight: 900, color: '#444' }}>DESTINATION</th>
                      <th style={{ padding: '16px', fontSize: '11px', fontWeight: 900, color: '#444' }}>ALIAS</th>
                      <th style={{ padding: '16px', fontSize: '11px', fontWeight: 900, color: '#444' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {urls.map((u, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #111' }}>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#888', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.originalUrl}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#555' }}>{u.customAlias || '—'}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 900, padding: '4px 8px', borderRadius: '4px', background: u.isValid ? 'rgba(203,255,0,0.1)' : 'rgba(255,68,68,0.1)', color: u.isValid ? 'var(--accent)' : '#ff4444' }}>{u.isValid ? 'VALID' : 'INVALID'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button onClick={() => setStep(1)} style={{ height: '64px', padding: '0 32px', background: 'none', border: '1px solid #1a1a1a', borderRadius: '16px', color: '#555', cursor: 'pointer', fontWeight: 900, fontSize: '14px' }}>BACK</button>
                <button onClick={handleBulkShorten} disabled={uploading || validCount === 0} style={{ height: '64px', flex: 1, background: (uploading || validCount === 0) ? '#1a1a1a' : 'var(--accent)', color: '#000', fontWeight: 900, fontSize: '14px', border: 'none', cursor: 'pointer', borderRadius: '16px' }}>
                  {uploading ? 'PROCESSING...' : `⚡ SHORTEN ${validCount} LINKS`}
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ width: '80px', height: '80px', background: 'rgba(203,255,0,0.1)', border: '2px solid rgba(203,255,0,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}><Check size={40} color="var(--accent)" /></div>
                <h3 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>Processing Complete</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Successfully processed <span style={{ color: 'var(--accent)', fontWeight: 900 }}>{successCount}</span> of {results.length} links.</p>
              </div>
              <div style={{ border: '1px solid #1a1a1a', borderRadius: '16px', maxHeight: '240px', overflowY: 'auto', marginBottom: '40px', background: '#0a0a0a' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #111' }}>
                        <td style={{ padding: '16px', width: '40px' }}>{r.success ? <Check size={16} color="var(--accent)" /> : <AlertCircle size={16} color="#ff4444" />}</td>
                        <td style={{ padding: '16px 8px', fontSize: '14px', fontWeight: 700, color: r.success ? '#fff' : '#ff4444' }}>{r.success ? `/${r.shortCode}` : r.error}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>{r.success && <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${r.shortCode}`); toast.success('COPIED') }} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}><Copy size={16} /></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button onClick={() => { const txt = results.filter(r => r.success).map(r => `${window.location.origin}/${r.shortCode}`).join('\n'); navigator.clipboard.writeText(txt); toast.success('ALL COPIED') }} style={{ height: '64px', flex: 1, background: '#111', border: '1px solid #1a1a1a', borderRadius: '16px', color: '#fff', fontWeight: 900, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <Copy size={20} /> COPY ALL
                </button>
                <button onClick={() => { onSuccess(); onClose() }} style={{ height: '64px', flex: 1, background: 'var(--accent)', color: '#000', fontWeight: 900, fontSize: '14px', border: 'none', cursor: 'pointer', borderRadius: '16px' }}>DONE</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
