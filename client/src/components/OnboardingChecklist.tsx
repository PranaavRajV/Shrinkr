import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Sparkles, ChevronRight, Share2, BarChart2, QrCode } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useNavigate } from 'react-router-dom'

interface Step {
  id: string
  label: string
  description: string
  icon?: any
  action?: { label: string; onClick: () => void }
}

interface Props {
  urls: any[]
  user?: any
}

export default function OnboardingChecklist({ urls, user }: Props) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [showPulse, setShowPulse] = useState(false)
  const navigate = useNavigate()

  const steps: Step[] = [
    { 
      id: 'create_link', 
      label: 'Create first short link', 
      description: 'Shorten any URL using the form',
    },
    { 
      id: 'add_custom_alias', 
      label: 'Use a custom alias', 
      description: 'Brand your links with unique names',
    },
    { 
      id: 'setup_bio', 
      label: 'Set up your bio page', 
      description: 'Create your digital hub',
      icon: Share2,
      action: { label: 'Go to Bio', onClick: () => navigate('/dashboard/bio') }
    },
    { 
      id: 'view_analytics', 
      label: 'Check your analytics', 
      description: 'See deep insights for your links',
      icon: BarChart2,
      action: { label: 'View Insights', onClick: () => navigate('/analytics') }
    },
    { 
      id: 'generate_qr', 
      label: 'Generate a QR code', 
      description: 'Get a scannable QR code',
      icon: QrCode
    }
  ]

  useEffect(() => {
    try {
      const saved = localStorage.getItem('shrinkr_onboarding')
      if (saved) setCompletedSteps(JSON.parse(saved))
      const hidden = localStorage.getItem('shrinkr_onboarding_hidden')
      if (hidden === 'true') setIsVisible(false)
      
      const hasOpened = localStorage.getItem('shrinkr_onboarding_opened')
      if (!hasOpened && JSON.parse(saved || '[]').length < steps.length && hidden !== 'true') {
        setTimeout(() => setIsOpen(true), 2500)
        localStorage.setItem('shrinkr_onboarding_opened', 'true')
      }
    } catch {}
  }, [])

  useEffect(() => {
    const newCompletions = [...completedSteps]
    let changed = false

    // 1. Create Link
    if (urls.length > 0 && !newCompletions.includes('create_link')) {
      newCompletions.push('create_link')
      changed = true
    }

    // 2. Custom Alias
    const hasAlias = urls.some(u => !!u.customAlias)
    if (hasAlias && !newCompletions.includes('add_custom_alias')) {
      newCompletions.push('add_custom_alias')
      changed = true
    }

    // 3. Bio Setup (Detect via user.username)
    if (user?.username && !newCompletions.includes('setup_bio')) {
      newCompletions.push('setup_bio')
      changed = true
    }

    // 4. Analytics (Detect via total clicks or manual trigger if we had one)
    const hasClicks = urls.some(u => u.totalClicks > 0)
    if (hasClicks && !newCompletions.includes('view_analytics')) {
       newCompletions.push('view_analytics')
       changed = true
    }

    // 5. QR Code (Check localStorage flag set by QRModal)
    const qrGenerated = localStorage.getItem('shrinkr_qr_generated') === 'true'
    if (qrGenerated && !newCompletions.includes('generate_qr')) {
       newCompletions.push('generate_qr')
       changed = true
    }

    if (changed) {
      setCompletedSteps(newCompletions)
      localStorage.setItem('shrinkr_onboarding', JSON.stringify(newCompletions))
      
      setShowPulse(true)
      setTimeout(() => setShowPulse(false), 4000)
    }
  }, [urls, user, completedSteps])

  const progress = (completedSteps.length / steps.length) * 100
  const allDone = completedSteps.length === steps.length

  // Grand Celebration logic
  useEffect(() => {
    if (allDone) {
      const celebrated = localStorage.getItem('shrinkr_onboarding_celebrated')
      if (celebrated !== 'true') {
        // Big Blast
        const duration = 5 * 1000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999999 }

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now()
          if (timeLeft <= 0) return clearInterval(interval)

          const particleCount = 50 * (timeLeft / duration)
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
        }, 250)

        localStorage.setItem('shrinkr_onboarding_celebrated', 'true')
        setIsOpen(true) // Ensure it's open to show the "ACCESS GRANTED" message
      }
    }
  }, [allDone])

  const handleDismiss = () => {
     setIsVisible(false)
     setIsOpen(false)
     localStorage.setItem('shrinkr_onboarding_hidden', 'true')
  }

  return (
    <>
      <AnimatePresence>
        {!isOpen && isVisible && !allDone && (
          <motion.button
            initial={{ scale: 0, opacity: 0, x: 50 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0, opacity: 0, x: 50 }}
            whileHover={{ scale: 1.05, background: '#D9FF33' }}
            onClick={() => setIsOpen(true)}
            style={{
              position: 'fixed', bottom: '30px', right: '30px', zIndex: 999998,
              padding: '12px 24px', borderRadius: 'var(--radius-full)',
              background: 'var(--accent)', color: 'var(--primary-foreground)', border: 'none',
              display: 'flex', alignItems: 'center', gap: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3), 0 0 20px rgba(255, 224, 194, 0.4)',
              cursor: 'pointer', fontWeight: 900, fontSize: '13px', letterSpacing: '0.05em'
            }}
          >
            <div style={{ position: 'relative' }}>
               <Sparkles size={18} />
               {showPulse && (
                 <motion.div
                   initial={{ scale: 1, opacity: 1 }}
                   animate={{ scale: 2.5, opacity: 0 }}
                   transition={{ repeat: Infinity, duration: 1.2 }}
                   style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid #000' }}
                 />
               )}
            </div>
            GETTING STARTED ({completedSteps.length}/{steps.length})
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' }}
            style={{
              position: 'fixed', bottom: '30px', right: '30px', zIndex: 999999,
              width: '380px', background: 'var(--bg-secondary)', borderRadius: '32px',
              border: '1px solid var(--border)', boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ padding: '32px 32px 24px', background: 'linear-gradient(to bottom, rgba(255,224,194,0.03), transparent)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 950, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>ONBOARDING PROGRESS</div>
                    <div style={{ fontSize: '24px', fontWeight: 950, color: 'var(--foreground)', marginTop: '4px', letterSpacing: '-0.02em' }}>Initialize Zurl.</div>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--muted-foreground)', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}
                  >
                    <X size={20} />
                  </button>
               </div>

               {/* Progress indicator */}
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        style={{ height: '100%', background: 'var(--accent)', boxShadow: '0 0 15px var(--accent-glow)' }}
                     />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--accent)', fontFamily: 'monospace' }}>{Math.round(progress)}%</span>
               </div>
            </div>

            {/* List */}
            <div style={{ padding: '12px 16px 24px', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '420px', overflowY: 'auto' }}>
               {steps.map((step, idx) => {
                  const isDone = completedSteps.includes(step.id)
                  return (
                    <motion.div 
                      key={step.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      style={{ 
                        padding: '16px', borderRadius: '20px',
                        display: 'flex', gap: '16px', alignItems: 'center',
                        background: isDone ? 'rgba(255,255,255,0.02)' : 'rgba(255,224,194,0.03)',
                        border: '1px solid transparent',
                        borderColor: isDone ? 'transparent' : 'rgba(255,224,194,0.1)',
                        transition: 'all 0.3s'
                      }}
                    >
                      <div 
                        style={{ 
                          width: '28px', height: '28px', borderRadius: '50%',
                          border: `2px solid ${isDone ? 'var(--accent)' : '#333'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isDone ? 'var(--accent)' : 'transparent',
                          flexShrink: 0, transition: 'all 0.3s'
                        }}
                      >
                        {isDone ? <Check size={14} color="#000" strokeWidth={4} /> : <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#444' }} />}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: '14px', fontWeight: 800, 
                          color: isDone ? 'var(--text-muted)' : '#fff',
                          textDecoration: isDone ? 'line-through' : 'none',
                          transition: 'all 0.3s'
                        }}>
                          {step.label}
                        </div>
                        {!isDone && step.description && (
                           <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{step.description}</div>
                        )}
                      </div>

                      {!isDone && step.action && (
                         <div 
                           onClick={step.action.onClick}
                           style={{ color: 'var(--accent)', cursor: 'pointer', padding: '8px', borderRadius: '50%', background: 'rgba(255,224,194,0.05)' }}
                         >
                            <ChevronRight size={18} />
                         </div>
                      )}
                    </motion.div>
                  )
               })}
            </div>

            {/* Completion Footer */}
            <AnimatePresence>
               {allDone ? (
                 <motion.div 
                   initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                   style={{ padding: '32px', textAlign: 'center', background: 'var(--accent)', color: 'var(--primary-foreground)' }}
                 >
                    <Sparkles size={32} style={{ marginBottom: '12px' }} />
                    <div style={{ fontSize: '20px', fontWeight: 950, marginBottom: '4px' }}>ACCESS GRANTED.</div>
                    <p style={{ fontSize: '12px', fontWeight: 800, opacity: 0.7, marginBottom: '24px' }}>You have successfully mastered the Zurl interface.</p>
                    <button 
                       onClick={handleDismiss}
                       style={{ background: 'var(--background)', color: 'var(--foreground)', border: 'none', padding: '12px 32px', borderRadius: 'var(--radius-full)', fontWeight: 900, fontSize: '11px', cursor: 'pointer', letterSpacing: '0.1em' }}
                    >
                       DISMISS SYSTEM
                    </button>
                 </motion.div>
               ) : (
                 <div style={{ padding: '20px 32px', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--muted-foreground)', letterSpacing: '0.1em' }}>STEP {completedSteps.length + 1} OF {steps.length}</div>
                    <button 
                       onClick={handleDismiss}
                       style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', fontSize: '11px', fontWeight: 900, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                       IGNORE
                    </button>
                 </div>
               )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
