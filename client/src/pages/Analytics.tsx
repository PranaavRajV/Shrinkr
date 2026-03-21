import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts'
import { 
  Download, ArrowLeft, MousePointer2, Clock, Globe, BarChart2
} from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { format } from 'date-fns'

const COLORS = ['#CBFF00', '#A3CC00', '#7A9900', '#526600', '#2B3300']
const DEVICE_COLORS: Record<string, string> = {
  Desktop: '#CBFF00',
  Mobile: '#A3CC00',
  Tablet: '#526600',
  Other: '#333300'
}

const S = {
  card: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '32px',
  },
  label: {
    fontSize: '11px', fontWeight: 800 as const, color: 'var(--text-muted)',
    textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: '12px'
  },
  chartTitle: {
    fontSize: '18px', fontWeight: 900 as const, color: 'var(--text-primary)',
    marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px',
    letterSpacing: '-0.02em'
  }
}

export default function Analytics() {
  const { shortCode } = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => { fetchAnalytics() }, [shortCode])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/analytics/${shortCode}`)
      setData(res.data.data)
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
      // Force correct MIME type regardless of server Content-Type
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

  if (loading) {
    return (
      <Layout>
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 800, letterSpacing: '0.2em' }}>
          LOADING ANALYTICS...
        </div>
      </Layout>
    )
  }

  if (!data) {
    return (
      <Layout>
        <div style={{ padding: '80px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 900, marginBottom: '16px' }}>Not Found</div>
          <div style={{ color: 'var(--text-muted)' }}>No analytics found for this short code.</div>
          <button onClick={() => window.history.back()} style={{ marginTop: '24px', background: 'var(--accent)', color: '#000', border: 'none', padding: '12px 28px', borderRadius: 'var(--radius-full)', fontWeight: 900, cursor: 'pointer' }}>
            GO BACK
          </button>
        </div>
      </Layout>
    )
  }

  // Chart data from API
  const dailyData = (data.clicksLast7Days || []).map((d: any) => ({
    date: d.date ? format(new Date(d.date), 'MMM d') : d._id,
    clicks: d.count || 0
  }))

  const deviceData = (data.topDevices || []).map((d: any) => ({
    name: d._id || 'Unknown',
    value: d.count || 0
  }))

  const totalDeviceClicks = deviceData.reduce((s: number, d: any) => s + d.value, 0)

  const lastVisited = data.lastVisited
    ? format(new Date(data.lastVisited), 'MMM dd, yyyy HH:mm')
    : 'No visits yet'

  return (
    <Layout>
      <div className="fade-in" style={{ padding: '40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
          <div>
            <h1 style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-0.04em' }}>Advanced Insights</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '4px' }}>
              Deep-dive metrics for: <span style={{ color: 'var(--accent)' }}>/{shortCode}</span>
            </p>
            {data.originalUrl && (
              <a href={data.originalUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px', display: 'block', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px' }}>
                → {data.originalUrl}
              </a>
            )}
          </div>

          <button onClick={() => window.history.back()} style={{
            background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)',
            padding: '12px 24px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 800,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        {/* Top Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
          {[
            { label: 'Total Clicks', val: (data.totalClicks || 0).toLocaleString(), icon: MousePointer2, sub: 'All time' },
            { label: 'Last Visited', val: '—', icon: Clock, sub: lastVisited, smallVal: true },
            { label: 'Devices Tracked', val: (deviceData.length).toString(), icon: Globe, sub: 'Device types' },
          ].map((m, i) => (
            <div key={i} style={{ ...S.card, position: 'relative' }}>
              <div style={{ position: 'absolute', top: '24px', right: '24px', color: 'var(--text-muted)', opacity: 0.3 }}>
                <m.icon size={24} />
              </div>
              <div style={S.label}>{m.label}</div>
              {m.smallVal ? (
                <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '4px' }}>{m.sub}</div>
              ) : (
                <>
                  <div style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '4px' }}>{m.val}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.sub}</div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px', marginBottom: '40px' }}>
          {/* Daily Clicks */}
          <div style={S.card}>
            <h3 style={S.chartTitle}><BarChart2 size={20} color="var(--accent)" /> Daily Clicks (Last 7 Days)</h3>
            {dailyData.length === 0 || dailyData.every((d: any) => d.clicks === 0) ? (
              <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No click data yet — share your link to start tracking!
              </div>
            ) : (
              <div style={{ height: '280px' }}>
                <ResponsiveContainer>
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#CBFF00" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#CBFF00" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={11} tick={{ fill: 'var(--text-muted)' }} />
                    <YAxis axisLine={false} tickLine={false} fontSize={11} tick={{ fill: 'var(--text-muted)' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: '8px', fontSize: '12px' }}
                      labelStyle={{ color: '#fff', fontWeight: 800 }}
                    />
                    <Area type="monotone" dataKey="clicks" stroke="#CBFF00" strokeWidth={2} fill="url(#clickGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Device Split */}
          <div style={S.card}>
            <h3 style={S.chartTitle}><Globe size={20} color="var(--accent)" /> Device Split</h3>
            {deviceData.length === 0 ? (
              <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No device data yet
              </div>
            ) : (
              <div style={{ height: '280px', position: 'relative' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={deviceData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={6} dataKey="value">
                      {deviceData.map((e: any, i: number) => <Cell key={i} fill={DEVICE_COLORS[e.name] || COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: '28px', fontWeight: 900 }}>{totalDeviceClicks}</div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</div>
                </div>
              </div>
            )}
            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
              {deviceData.map((d: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700 }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: DEVICE_COLORS[d.name] || COLORS[i % COLORS.length] }} />
                  {d.name}: {d.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Visit History */}
        {data.recentClicks && data.recentClicks.length > 0 && (
          <div style={{ ...S.card, marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h3 style={{ ...S.chartTitle, marginBottom: 0 }}><Clock size={20} color="var(--accent)" /> Recent Visit History</h3>
              <button
                onClick={handleExport}
                disabled={exporting}
                style={{
                  background: 'none', border: '1px solid var(--border)', color: 'var(--accent)',
                  padding: '10px 20px', borderRadius: '8px', fontSize: '11px', fontWeight: 800,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'
                }}
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  {['Timestamp', 'Device', 'Browser', 'Referrer'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentClicks.map((c: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600 }}>
                      {c.timestamp ? format(new Date(c.timestamp), 'MMM dd yyyy, HH:mm:ss') : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{c.device || 'Unknown'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{c.browser || 'Unknown'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.referrer || 'Direct'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state for no visits */}
        {(!data.recentClicks || data.recentClicks.length === 0) && (data.totalClicks === 0) && (
          <div style={{ ...S.card, textAlign: 'center', padding: '60px' }}>
            <MousePointer2 size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>No visits yet</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Share your short link to start seeing analytics here.</div>
          </div>
        )}
      </div>
    </Layout>
  )
}
