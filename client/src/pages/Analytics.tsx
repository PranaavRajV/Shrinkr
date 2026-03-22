import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts'
import { 
  Download, ArrowLeft, MousePointer2, Clock, Globe, BarChart2, Loader2, Share2, ExternalLink,
  ShieldCheck, ShieldAlert, Cpu
} from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { format } from 'date-fns'
import { Reveal, RevealText } from '../components/Reveal'
import Card3D from '../components/Card3D'
import Magnetic from '../components/Magnetic'
import CountUp from '../components/CountUp'
import { motion, AnimatePresence } from 'framer-motion'
import AnalyticsHeatmap from '../components/HeatmapChart'
import confetti from 'canvas-confetti'
import { Sparkles, Trophy } from 'lucide-react'

const COLORS = ['#ffe0c2', '#c8967a', '#9a5f42', '#644a40', '#392519']
const DEVICE_COLORS: Record<string, string> = {
  desktop: '#ffe0c2',
  mobile: '#c8967a',
  tablet: '#644a40',
  Other: '#333300'
}

const S = {
  card: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '32px',
    height: '100%',
    position: 'relative' as const,
  },
  label: {
    fontSize: '11px', fontWeight: 800 as const, color: 'var(--text-muted)',
    textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: '12px'
  },
  chartTitle: {
    fontSize: '16px', fontWeight: 900 as const, color: 'var(--text-primary)',
    marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px',
    letterSpacing: '-0.02em'
  }
}

export default function Analytics() {
  const { shortCode } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [days, setDays] = useState(7)
  const [clickFilter, setClickFilter] = useState<'all' | 'real' | 'bots'>('real')

  useEffect(() => { fetchAnalytics() }, [shortCode, days])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/analytics/${shortCode}`, { params: { days } })
      setData(res.data.data)
      
      // Celebrate if goal just reached and not notified
      if (res.data.data.clickGoal && res.data.data.totalClicks >= res.data.data.clickGoal && !res.data.data.goalNotified) {
        confetti({
          particleCount: 150, spread: 80, origin: { y: 0.6 },
          colors: ['#ffe0c2', '#FFFFFF', '#333333']
        })
        toast.success(`GOAL REACHED! ${res.data.data.totalClicks} CLICKS`, {
          icon: '🏆', duration: 5000
        })
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (exporting) return
    setExporting(true)
    const tid = toast.loading('PREPARING CSV...')
    try {
      const res = await api.get(`/api/analytics/${shortCode}/export`, {
        responseType: 'blob',
        headers: { Accept: 'text/csv' }
      })
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `zurl-analytics-${shortCode}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(url), 200)
      toast.success('CSV EXPORTED ✓', { id: tid })
    } catch {
      toast.error('EXPORT FAILED', { id: tid })
    } finally {
      setExporting(false)
    }
  }

  const handleShare = () => {
    const publicUrl = `${window.location.origin}/s/${shortCode}`
    navigator.clipboard.writeText(publicUrl)
    toast.success('PUBLIC STATS URL COPIED!')
  }

  if (loading && !data) {
    return (
      <Layout>
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 800, letterSpacing: '0.2em' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <Loader2 size={32} color="var(--accent)" />
          </motion.div>
          <br />LOADING ANALYTICS...
        </div>
      </Layout>
    )
  }

  if (!data) return null

  const dailyData = (data.clicksTrend || []).map((d: any) => ({
    date: format(new Date(d.date), days === 30 ? 'MMM d' : 'EEE'),
    clicks: d.count || 0,
    fullDate: format(new Date(d.date), 'MMM dd, yyyy')
  }))

  const deviceData = (data.topDevices || []).map((d: any) => ({
    name: d._id || 'Unknown',
    value: d.count || 0
  }))

  const browserData = (data.topBrowsers || []).map((d: any) => ({
    name: d._id || 'Unknown',
    count: d.count || 0
  }))

  const countryData = (data.topCountries || []).slice(0, 5).map((d: any) => ({
    name: d._id || 'Unknown',
    count: d.count || 0
  }))

  const { totalClicks, realClicks, botClicks } = data
  const lastVisited = data.lastVisited ? format(new Date(data.lastVisited), 'MMM dd, HH:mm') : '—'

  const filteredClicks = (data.recentClicks || []).filter((c: any) => {
    if (clickFilter === 'real') return !c.isBot
    if (clickFilter === 'bots') return c.isBot
    return true
  })

  return (
    <Layout>
      <div style={{ padding: '40px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RevealText text="Advanced Metrics" />
              <Reveal delay={0.2}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,224,194,0.1)', color: 'var(--accent)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: 900 }}>
                  LIVE
                </span>
              </Reveal>
            </div>
            <Reveal delay={0.3}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
                Performance deep-dive for <span style={{ color: 'var(--foreground)', fontWeight: 700 }}>/{shortCode}</span>
              </div>
            </Reveal>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Magnetic>
              <button onClick={() => navigate('/links')} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '12px 24px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeft size={16} /> BACK
              </button>
            </Magnetic>
            <Magnetic>
              <button onClick={handleShare} style={{ background: 'var(--accent)', color: 'var(--primary-foreground)', border: 'none', padding: '12px 24px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={16} /> SHARE STATS
              </button>
            </Magnetic>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '40px' }}>
          {[
            { label: 'Total Clicks', val: totalClicks, icon: MousePointer2, color: 'var(--accent)' },
            { 
              label: 'VERIFIED CLICKS', 
              val: realClicks, 
              icon: () => (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ), 
              color: 'var(--accent)' 
            },
            { 
              label: 'BOT CLICKS FILTERED', 
              val: botClicks, 
              icon: () => (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
              ), 
              color: '#ff4444' 
            },
            { 
              label: 'CLICK GOAL PROGRESS', 
              val: data.clickGoal ? Math.round((totalClicks / data.clickGoal) * 100) : 0, 
              label_val: data.clickGoal ? `${Math.round((totalClicks / data.clickGoal) * 100)}%` : 'NO GOAL',
              icon: Trophy, 
              color: data.clickGoal ? (totalClicks >= data.clickGoal ? 'var(--accent)' : '#fff') : 'var(--text-muted)',
              sub: data.clickGoal ? `${totalClicks} / ${data.clickGoal} target` : 'Set a goal to track'
            },
            { label: 'Last Human Visit', val: 0, label_val: lastVisited, icon: Clock, color: 'var(--foreground)' },
          ].map((s, i) => {
            const Icon: any = s.icon;
            return (
              <Reveal key={i} delay={0.4 + (i * 0.1)} direction="up" distance={10}>
                <Card3D>
                  <div style={{ ...S.card, padding: '24px' }}>
                    <div style={{ position: 'absolute', top: '20px', right: '20px', color: s.color, opacity: 0.6 }}>
                      {typeof Icon === 'function' ? Icon() : <Icon size={20} />}
                    </div>
                    <div style={S.label}>{s.label}</div>
                    <div style={{ fontSize: s.label_val ? '18px' : '36px', fontWeight: 900, color: s.color }}>
                      {s.label_val ? s.label_val : <CountUp value={s.val} />}
                    </div>
                    {s.sub && (
                      <div style={{ marginTop: '12px' }}>
                        {s.label === 'CLICK GOAL PROGRESS' && data.clickGoal && (
                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                              <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: `${Math.min((totalClicks / data.clickGoal) * 100, 100)}%` }} 
                                style={{ height: '100%', background: 'var(--accent)' }} 
                              />
                            </div>
                        )}
                        <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)' }}>{s.sub}</div>
                      </div>
                    )}
                  </div>
                </Card3D>
              </Reveal>
            )
          })}
        </div>

        {/* Main Chart Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px', marginBottom: '40px' }}>
          <Reveal delay={0.8} direction="up">
            <div style={{ ...S.card, height: '420px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{ ...S.chartTitle, marginBottom: 0 }}>Click Trends</h3>
                <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: '8px', padding: '4px', border: '1px solid var(--border)' }}>
                  {[7, 30].map(d => (
                    <button key={d} onClick={() => setDays(d)} style={{
                      padding: '6px 16px', fontSize: '10px', fontWeight: 900,
                      border: 'none', borderRadius: '6px',
                      background: days === d ? 'var(--accent)' : 'transparent',
                      color: days === d ? '#000' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}>{d}D</button>
                  ))}
                </div>
              </div>
              
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#555', fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ stroke: '#222', strokeWidth: 1 }}
                      contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                      labelStyle={{ color: 'var(--accent)', fontWeight: 900, marginBottom: '4px', fontSize: '11px' }}
                      itemStyle={{ color: 'var(--foreground)', fontSize: '14px', fontWeight: 700 }}
                      formatter={(val) => [`${val} clicks`]}
                      labelFormatter={(label, items) => items[0]?.payload.fullDate || label}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="clicks" 
                      stroke="var(--accent)" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorClicks)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.9} direction="up">
            <div style={{ ...S.card, height: '420px' }}>
              <h3 style={S.chartTitle}>Device Breakdown</h3>
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {deviceData.map((d: any, i: number) => (
                        <Cell key={`cell-${i}`} fill={DEVICE_COLORS[d.name.toLowerCase()] || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: '28px', fontWeight: 900 }}>{totalClicks}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800 }}>CLICKS</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                {deviceData.map((d: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: DEVICE_COLORS[d.name.toLowerCase()] || COLORS[i % COLORS.length] }} />
                    <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{d.name}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 900 }}>{((d.value / Math.max(1, totalClicks)) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* HEATMAP & INSIGHTS */}
        <Reveal delay={1.0} direction="up">
           <AnalyticsHeatmap 
              hourData={data.hourData || []} 
              dayData={data.dayData || []} 
           />
        </Reveal>

        {/* Secondary Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '40px', marginTop: '40px' }}>
          <Reveal delay={1.1} direction="up">
            <div style={S.card}>
              <h3 style={S.chartTitle}>Top 5 Countries</h3>
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={countryData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#fff', fontSize: 11, fontWeight: 800 }} width={40} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)' }} />
                    <Bar dataKey="count" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Reveal>

          <Reveal delay={1.2} direction="up">
            <div style={S.card}>
              <h3 style={S.chartTitle}>Traffic Sources</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {(data.referrerMediums || []).map((m: any, i: number) => (
                  <div key={i} style={{ padding: '20px', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '4px' }}>{m._id?.toUpperCase() || 'DIRECT'}</div>
                    <div style={{ fontSize: '24px', fontWeight: 900 }}>{m.count}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '32px' }}>
                <div style={S.label}>TOP REFERRERS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(data.topReferrers || []).slice(0, 5).map((r: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <span style={{ fontWeight: 800, color: 'var(--foreground)' }}>{r._id || 'Direct / Unknown'}</span>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--accent)', background: 'rgba(255,224,194,0.1)', padding: '2px 8px', borderRadius: '4px' }}>{r.count} CLKS</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Visit Log */}
        <Reveal delay={1.3} direction="up">
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <h3 style={{ ...S.chartTitle, marginBottom: 0 }}>Recent Activities</h3>
                <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: '8px', padding: '4px', border: '1px solid var(--border)' }}>
                  {['ALL', 'REAL', 'BOTS'].map(f => (
                    <button
                      key={f}
                      onClick={() => setClickFilter(f.toLowerCase() as any)}
                      style={{
                        padding: '6px 14px', fontSize: '9px', fontWeight: 900,
                        border: 'none', borderRadius: '6px',
                        background: clickFilter === f.toLowerCase() ? (
                          f === 'REAL' ? 'var(--accent)' : f === 'BOTS' ? 'rgba(255,68,68,0.15)' : 'rgba(255,255,255,0.08)'
                        ) : 'transparent',
                        color: clickFilter === f.toLowerCase() ? (f === 'REAL' ? '#000' : f === 'BOTS' ? '#ff4444' : '#fff') : 'var(--text-muted)',
                        cursor: 'pointer', transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)', letterSpacing: '0.05em'
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <Magnetic>
                <button onClick={handleExport} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: '8px', fontSize: '11px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Download size={14} /> EXPORT CSV
                </button>
              </Magnetic>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    {['TIME', 'IP ADDRESS', 'COUNTRY', 'BROWSER', 'DEVICE', 'REFERRER'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredClicks.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '100px 0' }}>
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em' }}>
                          NO CLICKS MATCHING FILTER
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredClicks.map((c: any, i: number) => (
                      <motion.tr 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: c.isBot ? 0.4 : 1 }}
                      >
                        <td style={{ padding: '16px', fontSize: '12px', color: 'var(--foreground)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {format(new Date(c.timestamp), 'MMM dd, HH:mm:ss')}
                            {c.isBot && (
                              <span style={{ 
                                fontSize: '8px', fontWeight: 900, 
                                background: 'rgba(255,68,68,0.1)', color: '#ff4444', 
                                padding: '2px 6px', borderRadius: '2px', letterSpacing: '0.1em',
                                border: '1px solid rgba(255,68,68,0.2)'
                              }} title={c.botReason || 'Detected as bot'}>BOT</span>
                            )}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'Space Grotesk' }}>{c.ip?.replace(/\.[0-9]+\.[0-9]+$/, '.X.X')}</td>
                        <td style={{ padding: '16px', fontSize: '12px', color: 'var(--foreground)', fontWeight: 600 }}>{c.country || 'Unknown'}</td>
                        <td style={{ padding: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {c.isBot ? <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff4444' }}><Cpu size={12} /> {c.browser}</span> : c.browser || 'Other'}
                        </td>
                        <td style={{ padding: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>{c.device?.toUpperCase()}</td>
                        <td style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>{c.referrer || 'DIRECT'}</td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

      </div>
    </Layout>
  )
}
