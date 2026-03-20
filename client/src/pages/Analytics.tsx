import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts'
import { 
  BarChart3, MousePointer2, Calendar, 
  ArrowLeft, Download, ExternalLink, Globe, Layout, Smartphone, Monitor 
} from 'lucide-react'

const S = {
  label: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    color: '#A1A1AA',
    display: 'block',
    marginBottom: '6px',
  },
  card: {
    background: '#111',
    border: '1px solid #3F3F46',
    padding: '24px',
    position: 'relative' as const,
  } as React.CSSProperties,
}

const DEVICE_COLORS: Record<string, string> = {
  Desktop: '#DFE104',
  Mobile:  '#60a5fa',
  Tablet:  '#a78bfa',
  Unknown: '#3F3F46',
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function Analytics() {
  const { shortCode } = useParams<{ shortCode: string }>()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError ] = useState('')
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [shortCode])

  const fetchData = async () => {
    try {
      const res = await api.get(`/api/analytics/${shortCode}`)
      setData(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const [exporting, setExporting] = useState(false)

  const exportCSV = async () => {
    setExporting(true)
    try {
      const token = localStorage.getItem('shrinkr_token')
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4001'
      const res = await fetch(`${baseUrl}/api/analytics/${shortCode}/export`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      const text = await res.text()
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href     = url
      link.download = `zurl-clicks-${shortCode}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success(`CSV downloaded (${text.split('\n').length - 2} rows)`)
    } catch (err: any) {
      toast.error(err.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', color: '#545455', letterSpacing: '0.2em', fontSize: '11px' }}>
        LOADING ANALYTICS...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', color: '#FAFAFA' }}>
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ fontSize: '80px', fontWeight: 900, color: '#ef4444', lineHeight: 1 }}>ERR</motion.div>
        <div style={{ color: '#555', letterSpacing: '0.2em', fontSize: '11px', marginTop: '16px' }}>{error || 'ANALYTICS UNAVAILABLE'}</div>
        <button onClick={() => navigate('/dashboard')} style={{ marginTop: '24px', background: '#DFE104', border: 'none', color: '#000', padding: '12px 24px', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
          RETURN TO DASHBOARD
        </button>
      </div>
    )
  }

  const deviceData = (data.topDevices || []).map((d: any) => ({
    name: d._id || 'Unknown',
    value: d.count,
    fill: DEVICE_COLORS[d._id] || '#3F3F46',
  }))

  const countryData = (data.topCountries || []).slice(0, 5).map((c: any) => ({
    country: c._id || 'Unknown',
    clicks: c.count,
  }))

  return (
    <div style={{ minHeight: '100vh', background: '#09090B', color: '#FAFAFA', fontFamily: 'Space Grotesk, sans-serif' }}>
      <Navbar />

      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ padding: '72px 24px 80px', maxWidth: '1200px', margin: '0 auto' }}
      >

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', borderBottom: '2px solid #3F3F46', paddingBottom: '24px', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <span style={S.label}>Analytics Stream</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '42px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.04em', margin: 0, color: '#DFE104', lineHeight: 1 }}>
                /{shortCode}
              </h1>
              <a href={data.originalUrl} target="_blank" rel="noreferrer" style={{ color: '#555', marginTop: '8px' }}>
                <ExternalLink size={18} />
              </a>
            </div>
            <div style={{ fontSize: '12px', color: '#555', marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
              {data.originalUrl}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={exportCSV} 
              disabled={exporting} 
              style={{ 
                background: 'transparent', border: '1px solid #3F3F46', 
                color: exporting ? '#27272A' : '#FAFAFA', 
                padding: '10px 18px', fontSize: '10px', fontWeight: 800, 
                letterSpacing: '0.1em', cursor: exporting ? 'not-allowed' : 'pointer', 
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px',
                textTransform: 'uppercase'
              }}
            >
              <Download size={14} /> {exporting ? 'Exporting...' : 'Export List'}
            </button>
            <button 
              onClick={() => navigate('/dashboard')} 
              style={{ 
                background: 'transparent', border: '1px solid #3F3F46', color: '#FAFAFA', 
                padding: '10px 18px', fontSize: '10px', fontWeight: 800, 
                letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: '8px',
                textTransform: 'uppercase'
              }}
            >
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        </motion.div>

        {/* ── STAT CARDS ──────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '32px' }}>
          {[
            { label: 'Cumulative Traffic', value: data.totalClicks, icon: <MousePointer2 size={16} /> },
            { label: 'Unique Visitors', value: new Set((data.recentClicks || []).map((c: any) => c.ip)).size, icon: <Globe size={16} /> },
            { label: 'Daily Average', value: (data.totalClicks / 7).toFixed(1), icon: <BarChart3 size={16} /> },
            { label: 'Last Capture', value: data.lastVisited ? new Date(data.lastVisited).toLocaleDateString() : 'Never', icon: <Calendar size={16} /> },
          ].map((s, i) => (
            <div key={i} style={{ ...S.card, background: '#111', border: '1px solid #3F3F46' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={S.label}>{s.label}</span>
                <span style={{ color: '#3F3F46' }}>{s.icon}</span>
              </div>
              <div style={{ fontSize: '42px', fontWeight: 900, color: '#DFE104', lineHeight: 1, letterSpacing: '-0.02em' }}>{s.value}</div>
            </div>
          ))}
        </motion.div>

        {/* ── MAIN TREND CHART ────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} style={{ ...S.card, marginBottom: '24px', padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span style={S.label}>Engagement Trend (7D)</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DFE104' }}></div>
              <div style={{ fontSize: '9px', color: '#555', textTransform: 'uppercase', fontWeight: 700 }}>Active Clicks</div>
            </div>
          </div>
          <div style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.clicksLast7Days || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClick" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DFE104" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#DFE104" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#3F3F46" 
                  tick={{ fill: '#555', fontSize: 10, fontWeight: 600 }} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v: string) => v.slice(5)} 
                />
                <YAxis 
                  stroke="#3F3F46" 
                  tick={{ fill: '#555', fontSize: 10, fontWeight: 600 }} 
                  tickLine={false} 
                  axisLine={false} 
                  allowDecimals={false} 
                />
                <Tooltip 
                  cursor={{ stroke: '#DFE104', strokeWidth: 1 }}
                  contentStyle={{ background: '#000', border: '2px solid #DFE104', borderRadius: 0, padding: '12px' }}
                  labelStyle={{ color: '#DFE104', fontWeight: 900, marginBottom: '4px', fontSize: '10px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#DFE104" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorClick)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── SECONDARY CHARTS ────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          
          {/* Device Pie */}
          <div style={S.card}>
            <span style={S.label}>Distribution by Platform</span>
            {deviceData.length === 0 ? (
              <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#27272A', fontSize: '11px', letterSpacing: '0.15em' }}>
                AWAITING TRAFFIC
              </div>
            ) : (
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2}>
                      {deviceData.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.fill} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#000', border: '1px solid #3F3F46', fontSize: '10px' }} />
                    <Legend 
                      iconType="rect"
                      formatter={(v) => <span style={{ fontSize: '10px', color: '#A1A1AA', textTransform: 'uppercase', fontWeight: 700 }}>{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Location Bar */}
          <div style={S.card}>
            <span style={S.label}>Top Traffic Regions</span>
            {countryData.length === 0 ? (
              <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#27272A', fontSize: '11px', letterSpacing: '0.15em' }}>
                GEOLOCATION PENDING
              </div>
            ) : (
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={countryData} layout="vertical" margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category" 
                      dataKey="country" 
                      stroke="#3F3F46" 
                      tick={{ fill: '#FAFAFA', fontSize: 11, fontWeight: 700 }} 
                      tickLine={false} 
                      axisLine={false} 
                      width={100} 
                    />
                    <Tooltip contentStyle={{ background: '#000', border: '1px solid #3F3F46', fontSize: '10px' }} />
                    <Bar dataKey="clicks" fill="#DFE104" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── LOGS ────────────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} style={{ ...S.card, border: 'none', background: 'transparent', padding: '0' }}>
          <div style={{ background: '#111', border: '1px solid #3F3F46', padding: '32px' }}>
            <span style={S.label}>Real-time Capture Log</span>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '1px', background: '#3F3F46' }}>
              {/* Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(180px, 1fr) 100px 80px 100px minmax(150px, 1fr)',
                padding: '12px 16px',
                background: '#09090B',
                gap: '20px',
                alignItems: 'center',
              }}>
                {['Timestamp', 'Origin IP', 'Device', 'Client', 'Referrer'].map(h => (
                  <span key={h} style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.15em', color: '#555', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              
              <AnimatePresence>
                {(data.recentClicks || []).length === 0 ? (
                   <div style={{ padding: '40px', textAlign: 'center', background: '#09090B', color: '#27272A', fontSize: '11px', letterSpacing: '0.2em' }}>
                    AWAITING CONNECTIONS
                   </div>
                ) : (
                  (data.recentClicks || []).slice(0, 10).map((click: any, i: number) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(180px, 1fr) 100px 80px 100px minmax(150px, 1fr)',
                        padding: '16px',
                        background: i % 2 === 0 ? '#111' : '#09090B',
                        gap: '20px',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 500 }}>{new Date(click.timestamp).toLocaleString()}</span>
                      <span style={{ fontSize: '11px', color: '#DFE104', fontFamily: 'monospace', fontWeight: 700 }}>{click.ip}</span>
                      <span style={{ fontSize: '10px', color: '#FAFAFA', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {click.device === 'mobile' ? <Smartphone size={12} /> : click.device === 'desktop' ? <Monitor size={12} /> : <Layout size={12} />}
                        <span style={{ textTransform: 'uppercase' }}>{click.device || 'Unk'}</span>
                      </span>
                      <span style={{ fontSize: '11px', color: '#555', textTransform: 'capitalize' }}>{click.browser || '—'}</span>
                      <span style={{ fontSize: '11px', color: '#3F3F46', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {click.referrer || 'Direct Entry'}
                      </span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

      </motion.main>
    </div>
  )
}
