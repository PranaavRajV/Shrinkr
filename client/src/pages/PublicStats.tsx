import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { MousePointer2, Clock, Globe, BarChart2, Loader2, ArrowRight } from 'lucide-react'
import api from '../lib/api'
import Layout from '../components/Layout'
import { format } from 'date-fns'
import { Reveal, RevealText } from '../components/Reveal'
import Card3D from '../components/Card3D'
import Magnetic from '../components/Magnetic'
import CountUp from '../components/CountUp'
import { motion } from 'framer-motion'

const COLORS = ['#ffe0c2', '#c8967a', '#9a5f42', '#644a40', '#392519']
const DEVICE_COLORS: Record<string, string> = {
  desktop: '#ffe0c2',
  mobile: '#c8967a',
  tablet: '#644a40',
  Other: '#333300'
}

export default function PublicStats() {
  const { shortCode } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPublicStats = async () => {
      try {
        const res = await api.get(`/api/analytics/${shortCode}/public`)
        setData(res.data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchPublicStats()
  }, [shortCode])

  if (loading) {
    return (
      <Layout>
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <Loader2 size={32} color="var(--accent)" />
          </motion.div>
        </div>
      </Layout>
    )
  }

  if (!data) {
    return (
      <Layout>
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '16px' }}>404</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>This link's public stats are either private or the link doesn't exist.</p>
          <Magnetic><button onClick={() => navigate('/')} style={{ background: 'var(--accent)', color: 'var(--primary-foreground)', border: 'none', padding: '16px 32px', borderRadius: 'var(--radius-full)', fontWeight: 900, cursor: 'pointer' }}>RETURN HOME</button></Magnetic>
        </div>
      </Layout>
    )
  }

  const deviceData = (data.topDevices || []).map((d: any) => ({
    name: d._id || 'Unknown',
    value: d.count || 0
  }))

  const totalClicks = data.totalClicks || 0
  const createdAt = format(new Date(data.createdAt), 'MMM dd, yyyy')
  const lastVisited = data.lastVisited ? format(new Date(data.lastVisited), 'MMM dd, HH:mm') : '—'

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 40px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <RevealText text="Public Insights" />
          <Reveal delay={0.2}>
            <div style={{ marginTop: '12px', fontSize: '18px', color: 'var(--text-muted)' }}>
              Statistics for <span style={{ color: 'var(--foreground)', fontWeight: 700 }}>/{shortCode}</span>
            </div>
          </Reveal>
        </div>

        {/* Top Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
           <Reveal delay={0.3} direction="up">
             <Card3D>
               <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '24px', padding: '40px', textAlign: 'center' }}>
                 <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px' }}>TOTAL REACH</div>
                 <div style={{ fontSize: '64px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '-0.04em' }}>
                   <CountUp value={totalClicks} />
                 </div>
                 <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>Verified Clicks</div>
               </div>
             </Card3D>
           </Reveal>

           <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '24px' }}>
             <Reveal delay={0.4} direction="up">
               <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                 <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}><Clock size={24} /></div>
                 <div>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>CREATED ON</div>
                    <div style={{ fontSize: '16px', fontWeight: 800 }}>{createdAt}</div>
                 </div>
               </div>
             </Reveal>
             <Reveal delay={0.5} direction="up">
               <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                 <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}><MousePointer2 size={24} /></div>
                 <div>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>LAST ACTIVITY</div>
                    <div style={{ fontSize: '16px', fontWeight: 800 }}>{lastVisited}</div>
                 </div>
               </div>
             </Reveal>
           </div>
        </div>

        {/* Device Breakdown */}
        <Reveal delay={0.6} direction="up">
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '24px', padding: '48px', marginBottom: '40px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '32px', textAlign: 'center' }}>Global Device Distribution</h3>
            {deviceData.length === 0 ? (
               <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No visitor data available yet.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', alignItems: 'center', gap: '40px' }}>
                <div style={{ height: '200px', position: 'relative' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={deviceData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                        {deviceData.map((d: any, i: number) => <Cell key={i} fill={DEVICE_COLORS[d.name.toLowerCase()] || COLORS[i % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {deviceData.map((d: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: DEVICE_COLORS[d.name.toLowerCase()] || COLORS[i % COLORS.length] }} />
                      <span style={{ fontWeight: 800, fontSize: '14px', flex: 1 }}>{d.name.toUpperCase()}</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 900 }}>{((d.value / totalClicks) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Reveal>

        {/* CTA */}
        <Reveal delay={0.7} direction="up">
          <div style={{ background: 'var(--accent)', color: 'var(--primary-foreground)', borderRadius: '24px', padding: '48px', textAlign: 'center', boxShadow: '0 20px 40px rgba(255,224,194,0.15)' }}>
            <h3 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '12px', letterSpacing: '-0.03em' }}>Create your own tracked links.</h3>
            <p style={{ fontSize: '15px', fontWeight: 700, marginBottom: '32px', opacity: 0.8 }}>Join Shrinkr and get advanced analytics, custom aliases, and more.</p>
            <Magnetic>
              <button onClick={() => navigate('/register')} style={{ background: 'var(--background)', color: 'var(--foreground)', border: 'none', padding: '18px 40px', borderRadius: '12px', fontSize: '13px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto' }}>
                GET STARTED FOR FREE <ArrowRight size={18} />
              </button>
            </Magnetic>
          </div>
        </Reveal>

      </div>
    </Layout>
  )
}
