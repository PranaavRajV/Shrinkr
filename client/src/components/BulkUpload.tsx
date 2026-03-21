import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Check, AlertCircle, X, Copy, ArrowLeft, Download, List, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'

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

  const parseCSVText = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim())
    // skip header row if it starts with "originalUrl" or "url"
    const dataLines = lines[0]?.toLowerCase().startsWith('original') ? lines.slice(1) : lines
    return dataLines.map(line => {
      const parts = line.split(/[,\t]/)
      const url = parts[0]?.trim() || ''
      const alias = parts[1]?.trim() || ''
      return { originalUrl: url, customAlias: alias, isValid: url.startsWith('http') }
    }).filter(u => u.originalUrl)
  }

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      const parsed = parseCSVText(e.target?.result as string)
      if (parsed.length === 0) { toast.error('No valid URLs found in file'); return }
      setUrls(parsed)
      setStep(2)
    }
    reader.readAsText(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) handleFile(file)
    else toast.error('Please drop a .csv file')
  }, [])

  const handleManualParse = () => {
    const parsed = parseCSVText(manualText)
    if (parsed.length === 0) { toast.error('No valid URLs found. Format: https://url.com, alias'); return }
    setUrls(parsed)
    setStep(2)
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
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px'
    }} onClick={onClose}>
      <motion.div
        initial={{ y: 24, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111',
          borderRadius: '20px',
          width: '100%', maxWidth: '600px',
          padding: '40px',
          position: 'relative',
          boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
          border: '1px solid #222',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '20px', right: '20px',
            background: 'none', border: '1px solid #222',
            borderRadius: '8px', padding: '7px', cursor: 'pointer',
            color: '#666', display: 'flex', transition: 'border-color 0.2s'
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', marginBottom: '6px' }}>
            Bulk Import
          </h2>
          <p style={{ fontSize: '13px', color: '#555', fontWeight: 500 }}>
            Upload a CSV or paste URLs to shorten multiple links at once.
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '36px' }}>
          {[1, 2, 3].map((s, idx) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 900,
                background: step > s ? '#CBFF00' : step === s ? '#fff' : '#1a1a1a',
                color: step > s ? '#000' : step === s ? '#000' : '#444',
                border: step === s ? '2px solid #CBFF00' : '2px solid transparent',
                transition: 'all 0.3s',
                boxShadow: step === s ? '0 0 16px rgba(203,255,0,0.3)' : 'none'
              }}>
                {step > s ? <Check size={14} /> : s}
              </div>
              {idx < 2 && (
                <div style={{
                  width: '48px', height: '2px',
                  background: step > s ? '#CBFF00' : '#1a1a1a',
                  transition: 'background 0.3s'
                }} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Input ─────────────────────────────────────────── */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Tabs */}
              <div style={{
                display: 'flex', gap: '4px', background: '#0a0a0a', borderRadius: '10px',
                padding: '4px', marginBottom: '24px', border: '1px solid #1a1a1a'
              }}>
                {(['file', 'paste'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)} style={{
                    flex: 1, padding: '10px', fontSize: '11px', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    border: 'none', cursor: 'pointer', borderRadius: '8px',
                    background: mode === m ? '#CBFF00' : 'transparent',
                    color: mode === m ? '#000' : '#555',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}>
                    {m === 'file' ? <Upload size={13} /> : <List size={13} />}
                    {m === 'file' ? 'CSV File' : 'Paste List'}
                  </button>
                ))}
              </div>

              {mode === 'file' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <input type="file" ref={fileInputRef} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} accept=".csv" style={{ display: 'none' }} />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    style={{
                      border: `2px dashed ${isDragging ? '#CBFF00' : '#222'}`,
                      borderRadius: '12px', background: isDragging ? 'rgba(203,255,0,0.03)' : '#0a0a0a',
                      padding: '60px 20px', cursor: 'pointer', textAlign: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: '52px', height: '52px', background: isDragging ? 'rgba(203,255,0,0.15)' : '#1a1a1a',
                      borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 20px', transition: 'all 0.2s'
                    }}>
                      <FileText size={24} color={isDragging ? '#CBFF00' : '#555'} />
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                      {isDragging ? 'Drop it!' : 'Drop CSV or click to browse'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#444', fontWeight: 500 }}>
                      Format: <span style={{ color: '#666', fontFamily: 'monospace' }}>originalUrl, customAlias</span>
                    </div>
                  </div>

                  <button onClick={downloadTemplate} style={{
                    background: 'none', border: '1px solid #222', color: '#CBFF00',
                    padding: '12px', borderRadius: '10px', fontSize: '12px', fontWeight: 800,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    letterSpacing: '0.05em'
                  }}>
                    <Download size={14} /> DOWNLOAD CSV TEMPLATE
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <textarea
                    value={manualText}
                    onChange={e => setManualText(e.target.value)}
                    placeholder={'https://google.com, my-alias\nhttps://apple.com, mac-link\nhttps://github.com'}
                    style={{
                      width: '100%', height: '200px', background: '#0a0a0a',
                      border: '1px solid #222', color: '#fff',
                      padding: '16px', fontFamily: 'monospace', fontSize: '13px',
                      outline: 'none', resize: 'none', borderRadius: '12px', lineHeight: 1.7,
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '12px', color: '#444', fontWeight: 500 }}>
                    One URL per line. Optional alias after a comma. Tab-separated also works.
                  </div>
                  <button
                    onClick={handleManualParse}
                    disabled={!manualText.trim()}
                    style={{
                      height: '52px', width: '100%',
                      background: manualText.trim() ? '#CBFF00' : '#1a1a1a',
                      color: manualText.trim() ? '#000' : '#333',
                      fontWeight: 900, fontSize: '13px', textTransform: 'uppercase',
                      border: 'none', cursor: manualText.trim() ? 'pointer' : 'not-allowed',
                      letterSpacing: '0.08em', borderRadius: '10px',
                      transition: 'all 0.2s'
                    }}
                  >
                    PARSE {manualText.split('\n').filter(l => l.trim()).length} LINKS →
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── STEP 2: Validation ──────────────────────────────────── */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>Pre-upload Validation</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ background: 'rgba(203,255,0,0.1)', color: '#CBFF00', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                    {validCount} VALID
                  </span>
                  {urls.length - validCount > 0 && (
                    <span style={{ background: 'rgba(255,68,68,0.1)', color: '#ff4444', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                      {urls.length - validCount} INVALID
                    </span>
                  )}
                </div>
              </div>

              <div style={{ border: '1px solid #1a1a1a', borderRadius: '10px', maxHeight: '220px', overflowY: 'auto', marginBottom: '24px', background: '#0a0a0a' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#111' }}>
                    <tr>
                      {['ORIGINAL URL', 'ALIAS', 'STATUS'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: '#444', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #1a1a1a' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {urls.map((u, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '11px 16px', fontSize: '12px', color: '#aaa', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.originalUrl || '—'}</td>
                        <td style={{ padding: '11px 16px', fontSize: '12px', color: '#666' }}>{u.customAlias || '—'}</td>
                        <td style={{ padding: '11px 16px' }}>
                          <span style={{
                            fontSize: '10px', fontWeight: 800, borderRadius: '4px', padding: '3px 8px',
                            background: u.isValid ? 'rgba(203,255,0,0.1)' : 'rgba(255,68,68,0.1)',
                            color: u.isValid ? '#CBFF00' : '#ff4444',
                          }}>
                            {u.isValid ? 'READY' : 'INVALID'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setStep(1)} style={{
                  height: '52px', padding: '0 20px', background: '#1a1a1a', border: '1px solid #222',
                  borderRadius: '10px', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  fontWeight: 800, fontSize: '12px'
                }}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  onClick={handleBulkShorten}
                  disabled={uploading || validCount === 0}
                  style={{
                    height: '52px', flex: 1,
                    background: uploading || validCount === 0 ? '#1a1a1a' : '#CBFF00',
                    color: uploading || validCount === 0 ? '#333' : '#000',
                    fontWeight: 900, fontSize: '13px', textTransform: 'uppercase',
                    border: 'none', cursor: uploading || validCount === 0 ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.08em', borderRadius: '10px', transition: 'all 0.2s'
                  }}
                >
                  {uploading ? '⚡ Processing...' : `⚡ SHORTEN ${validCount} LINKS NOW`}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Results ─────────────────────────────────────── */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  width: '60px', height: '60px', background: 'rgba(203,255,0,0.1)',
                  border: '1px solid rgba(203,255,0,0.3)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
                }}>
                  <Check size={28} color="#CBFF00" />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>Import Successful</h3>
                <p style={{ color: '#555', fontSize: '14px' }}>
                  <span style={{ color: '#CBFF00', fontWeight: 800 }}>{successCount}</span> of{' '}
                  <span style={{ fontWeight: 800 }}>{results.length}</span> links were created.
                </p>
              </div>

              <div style={{ border: '1px solid #1a1a1a', borderRadius: '10px', maxHeight: '200px', overflowY: 'auto', marginBottom: '24px', background: '#0a0a0a' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px 16px', width: '32px' }}>
                          {r.success
                            ? <Check size={14} color="#CBFF00" />
                            : <AlertCircle size={14} color="#ff4444" />}
                        </td>
                        <td style={{ padding: '12px 8px', fontSize: '13px', fontWeight: 700, color: r.success ? '#fff' : '#ff4444' }}>
                          {r.success ? `/${r.shortCode}` : r.error}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          {r.success && (
                            <button
                              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${r.shortCode}`); toast.success('COPIED!') }}
                              style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <Copy size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => {
                  const txt = results.filter(r => r.success).map(r => `${window.location.origin}/${r.shortCode}`).join('\n')
                  navigator.clipboard.writeText(txt); toast.success('ALL LINKS COPIED')
                }} style={{
                  height: '52px', padding: '0 20px', background: '#1a1a1a', border: '1px solid #222',
                  borderRadius: '10px', color: '#fff', cursor: 'pointer',
                  fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap'
                }}>
                  <Copy size={14} /> COPY ALL
                </button>
                <button onClick={() => { onSuccess(); onClose() }} style={{
                  height: '52px', flex: 1, background: '#CBFF00', color: '#000',
                  fontWeight: 900, fontSize: '13px', textTransform: 'uppercase',
                  border: 'none', cursor: 'pointer', letterSpacing: '0.08em', borderRadius: '10px'
                }}>
                  FINISH
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  )
}
