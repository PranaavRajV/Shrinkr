import { motion } from 'framer-motion'
import { Clock, MousePointer2, TrendingUp } from 'lucide-react'

interface HeatmapProps {
  hourData: { hour: number; count: number }[]
  dayData: { day: string; count: number }[]
}

export default function AnalyticsHeatmap({ hourData, dayData }: HeatmapProps) {
  const maxCount = Math.max(...hourData.map(h => h.count), 1)
  
  const getIntensity = (count: number) => {
    if (count === 0) return 'rgba(255,255,255,0.03)'
    const ratio = count / maxCount
    return `rgba(255, 224, 194, ${0.1 + ratio * 0.9})`
  }

  // Find peak hour
  const peakHour = hourData.reduce((prev, current) => (prev.count > current.count) ? prev : current, hourData[0])
  const peakDay = dayData.reduce((prev, current) => (prev.count > current.count) ? prev : current, dayData[0])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px', marginTop: '40px' }}>
      
      {/* 24-HOUR HEATMAP */}
      <section style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={20} color="var(--accent)" />
            <h3 style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.1em' }}>24-HOUR ACTIVITY HEATMAP</h3>
          </div>
          <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)' }}>
             CLICK FREQUENCY BY HOUR
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '8px' }}>
          {hourData.map((h, i) => (
            <motion.div
              key={h.hour}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              whileHover={{ scale: 1.1, zIndex: 10 }}
              style={{
                height: '60px',
                background: getIntensity(h.count),
                borderRadius: '12px',
                border: h.count > 0 ? '1px solid rgba(255,224,194,0.2)' : '1px solid transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
              title={`${h.hour}:00 - ${h.count} clicks`}
            >
              <div style={{ fontSize: '10px', fontWeight: 900, color: h.count > maxCount * 0.5 ? '#000' : 'var(--text-muted)' }}>
                {h.hour}
              </div>
              {h.count > 0 && (
                <div style={{ fontSize: '12px', fontWeight: 900, color: h.count > maxCount * 0.5 ? '#000' : '#fff' }}>
                  {h.count}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>
           <span>LOWEST ACTIVITY</span>
           <div style={{ width: '100px', height: '8px', background: 'linear-gradient(to right, rgba(255,255,255,0.05), var(--accent))', borderRadius: '4px' }} />
           <span>PEAK PERFORMANCE</span>
        </div>
      </section>

      {/* INSIGHTS PANEL */}
      <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
         <div style={{ background: 'var(--background)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border)', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
               <TrendingUp size={18} color="var(--accent)" />
               <h4 style={{ fontSize: '14px', fontWeight: 900 }}>PEAK INSIGHTS</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
               <div>
                  <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>Best Engagement Time</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
                    {peakHour.hour}:00 <span style={{ fontSize: '12px', color: 'var(--foreground)' }}>({peakHour.count} Clks)</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '8px', lineHeight: 1.5 }}>Schedule your next social post around this time for maximum ROI.</p>
               </div>

               <div>
                  <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>Busiest Day Of Week</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
                    {peakDay.day} <span style={{ fontSize: '12px', color: 'var(--foreground)' }}>({peakDay.count} Clks)</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '8px', lineHeight: 1.5 }}>Your audience is most active on <b>{peakDay.day}s</b>. Focus your marketing campaigns here.</p>
               </div>
            </div>
         </div>

         <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
               <MousePointer2 size={24} color="#555" />
            </div>
            <div>
               <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--muted-foreground)', marginBottom: '4px' }}>AVG. CONVERSION</div>
               <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--foreground)' }}>{((peakHour.count / (maxCount * 24)) * 100).toFixed(1)}%</div>
            </div>
         </div>
      </aside>
    </div>
  )
}
