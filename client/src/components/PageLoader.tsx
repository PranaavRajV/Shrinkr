import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PageLoader() {
  const [percent, setPercent] = useState(0)
  const [show, setShow] = useState(true)
  
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const appName = "ZURL ARCHITECTURE"

  useEffect(() => {
    // Skip loader if seen
    if (localStorage.getItem('shrinkr_loaded') === '1' || prefersReduced) {
      setShow(false)
      return
    }

    // Percentage counter (1.2s - 1.6s)
    let startTime = Date.now()
    const interval = setInterval(() => {
      let elapsed = Date.now() - startTime
      if (elapsed < 1200) return
      
      let pRel = (elapsed - 1200) / 400
      if (pRel >= 1) {
        setPercent(100)
        clearInterval(interval)
      } else {
        setPercent(Math.floor(pRel * 100))
      }
    }, 16)

    // Complete loader (2.0s)
    const timeout = setTimeout(() => {
      setShow(false)
      localStorage.setItem('shrinkr_loaded', '1')
    }, 2000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [prefersReduced])

  if (!show) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
           exit={{ y: '-100vh' }}
           transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 1.6 }}
           style={{
             position: 'fixed', inset: 0, zIndex: 999999,
             background: 'var(--background)', display: 'flex', flexDirection: 'column',
             alignItems: 'center', justifyContent: 'center'
           }}
        >
          <div style={{ position: 'relative', textAlign: 'center' }}>
            {/* Logo typing animation */}
            <div style={{ display: 'flex', gap: '4px', overflow: 'hidden' }}>
              {appName.split('').map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    display: 'inline-block', fontSize: '13px', fontWeight: 900,
                    color: 'var(--accent)', letterSpacing: '0.3em'
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </div>

            {/* Sweep line (0.8s - 1.2s) */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.4, delay: 0.8, ease: 'easeInOut' }}
              style={{
                height: '1px', background: 'var(--accent)', marginTop: '20px'
              }}
            />

            {/* Percentage (1.2s - 1.6s) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: percent > 0 ? 1 : 0 }}
              style={{
                position: 'fixed', bottom: '40px', left: '40px',
                fontSize: '80px', fontWeight: 900, color: 'rgba(255, 224, 194, 0.05)',
                fontFamily: 'Space Grotesk, sans-serif'
              }}
            >
              {percent}%
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
