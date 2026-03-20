import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Check, AlertCircle, X, Copy, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      const parsedUrls = lines.slice(1).map(line => {
        const [originalUrl, customAlias] = line.split(',')
        return { 
          originalUrl: originalUrl?.trim() || '', 
          customAlias: customAlias?.trim() || '',
          isValid: originalUrl?.trim().startsWith('http')
        }
      })
      setUrls(parsedUrls)
      setStep(2)
    }
    reader.readAsText(file)
  }

  const handleBulkShorten = async () => {
    setUploading(true)
    try {
      const res = await api.post('/api/urls/bulk', { urls })
      setResults(res.data.data.results)
      setStep(3)
      toast.success('COMPLETED!')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'UPLOAD FAILED')
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = "originalUrl,customAlias\nhttps://google.com,google-link\nhttps://youtube.com,yt-link"
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'shrinkr-template.csv'
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/95 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative w-full max-w-2xl border-4 border-[#3F3F46] bg-[#09090B] p-10 my-auto"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-[#A1A1AA] hover:text-[#DFE104] transition-colors">
           <X size={24} />
        </button>

        <header className="mb-12 flex flex-col items-center">
           <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[#FAFAFA] leading-none mb-8">BULK UPLOAD</h2>
           
           <div className="flex gap-4 items-center mb-8">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center">
                   <div className={`w-10 h-10 border-2 flex items-center justify-center text-xs font-black transition-all ${
                     step === s ? 'border-[#DFE104] text-[#DFE104] scale-110 shadow-[0_0_15px_rgba(223,225,4,0.3)]' : 
                     step > s ? 'bg-[#DFE104] border-[#DFE104] text-black' : 
                     'border-[#3F3F46] text-[#A1A1AA]'
                   }`}>
                      {step > s ? <Check size={16} /> : `0${s}`}
                   </div>
                   {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-[#DFE104]' : 'bg-[#3F3F46]'}`} />}
                </div>
              ))}
           </div>
        </header>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1" 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center"
            >
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleFileUpload} 
                 accept=".csv" 
                 className="hidden" 
               />
               <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-4 border-dashed border-[#3F3F46] p-24 group hover:border-[#DFE104] hover:bg-[#DFE104]/5 transition-all text-center flex flex-col items-center gap-6"
               >
                  <Upload size={48} className="text-[#A1A1AA] group-hover:text-[#DFE104] group-hover:scale-110 transition-all" />
                  <div>
                    <span className="text-3xl font-black tracking-tighter uppercase text-[#FAFAFA] group-hover:text-[#DFE104]">DROP CSV HERE</span>
                    <p className="text-[10px] font-bold tracking-[0.4em] text-[#A1A1AA] mt-4">OR CLICK TO BROWSE FILES</p>
                  </div>
               </button>
               <Button variant="ghost" size="sm" onClick={downloadTemplate} className="mt-8 text-[10px] font-black tracking-widest text-[#A1A1AA] hover:text-[#FAFAFA]">
                  DOWNLOAD SAMPLE TEMPLATE
               </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2" 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            >
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black tracking-tighter text-[#DFE104] uppercase italic">{urls.length} LINKS READY</h3>
                  <Badge variant="active">{urls.filter(u => u.isValid).length} VALID</Badge>
               </div>

               <div className="border-2 border-[#3F3F46] max-h-64 overflow-y-auto mb-10 custom-scrollbar">
                  <table className="w-full text-left text-[10px] font-bold tracking-widest uppercase">
                    <thead className="sticky top-0 bg-[#27272A] border-b-2 border-[#3F3F46] z-10">
                       <tr>
                          <th className="px-4 py-3">#</th>
                          <th className="px-4 py-3">URL</th>
                          <th className="px-4 py-3">ALIAS</th>
                          <th className="px-4 py-3">STATUS</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3F3F46]">
                       {urls.map((u, i) => (
                         <tr key={i} className="hover:bg-[#27272A]/50">
                            <td className="px-4 py-3 text-[#A1A1AA]">{i+1}</td>
                            <td className="px-4 py-3 max-w-[120px] truncate text-[#FAFAFA]">{u.originalUrl}</td>
                            <td className="px-4 py-3 text-[#FAFAFA]">{u.customAlias || '-'}</td>
                            <td className="px-4 py-3">
                               {u.isValid ? (
                                 <span className="text-[#DFE104]">READY</span>
                               ) : (
                                 <span className="text-red-500">INVALID</span>
                               )}
                            </td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
               </div>

               <div className="flex justify-between gap-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="h-16 px-8 border-2 border-[#3F3F46]">
                     <ArrowLeft size={16} className="mr-2" /> REUPLOAD
                  </Button>
                  <Button onClick={handleBulkShorten} loading={uploading} className="flex-1 h-16 text-lg">
                     SHORTEN {urls.length} LINKS →
                  </Button>
               </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3" 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            >
               <div className="flex flex-col items-center mb-10 text-center">
                  <div className="w-20 h-20 bg-[#DFE104] text-black flex items-center justify-center mb-6">
                     <Check size={40} />
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter text-[#DFE104] uppercase">
                    {results.filter(r => r.success).length}/{results.length} CREATED
                  </h3>
               </div>

               <div className="border-2 border-[#3F3F46] max-h-64 overflow-y-auto mb-10 custom-scrollbar">
                  <table className="w-full text-left text-[10px] font-bold tracking-widest uppercase">
                    <thead className="sticky top-0 bg-[#27272A] border-b-2 border-[#3F3F46] z-10">
                       <tr>
                          <th className="px-4 py-3">ST.</th>
                          <th className="px-4 py-3">SHORT CODE</th>
                          <th className="px-4 py-3">ACTION</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3F3F46]">
                       {results.map((r, i) => (
                         <tr key={i} className="hover:bg-[#27272A]/50">
                            <td className="px-4 py-3">
                               {r.success ? <Check size={12} className="text-[#DFE104]" /> : <AlertCircle size={12} className="text-red-500" />}
                            </td>
                            <td className="px-4 py-3 min-w-[150px]">
                               {r.success ? (
                                 <span className="text-[#FAFAFA] font-black">{r.shortCode}</span>
                               ) : (
                                 <span className="text-red-500 lowercase leading-tight">{r.error}</span>
                               )}
                            </td>
                            <td className="px-4 py-4">
                               {r.success && (
                                 <div className="flex gap-2">
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/${r.shortCode}`)
                                        toast.success('COPIED')
                                      }}
                                      className="p-1 hover:text-[#DFE104] transition-colors"
                                    >
                                       <Copy size={12}/>
                                    </button>
                                 </div>
                               )}
                            </td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
               </div>

               <div className="flex justify-between gap-4">
                  <Button variant="outline" onClick={() => {
                    const allLinks = results.filter(r => r.success).map(r => `${window.location.origin}/${r.shortCode}`).join('\n')
                    navigator.clipboard.writeText(allLinks)
                    toast.success('ALL COPIED')
                  }} className="h-16 px-8 border-2 border-[#3F3F46]">
                     <Copy size={16} className="mr-2" /> COPY ALL
                  </Button>
                  <Button onClick={() => { onSuccess(); onClose(); }} className="flex-1 h-16 text-lg">
                     BACK TO DASHBOARD →
                  </Button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
