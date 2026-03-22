import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Sparkles, ChevronRight, HelpCircle } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useNavigate } from 'react-router-dom'

interface Step {
  id: string
  label: string
  description: string
  action?: { label: string; onClick: () => void }
}

interface Props {
  urls: any[]
}

export default function OnboardingChecklist({ urls }: Props) {
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
      action: { label: 'Go to Bio', onClick: () => navigate('/dashboard/bio') }
    },
    { 
      id: 'view_analytics', 
      label: 'Check your analytics', 
      description: 'See deep insights for your links',
    },
    { 
      id: 'generate_qr', 
      label: 'Generate a QR code', 
      description: 'Get a scannable QR code',
    }
  ]

  useEffect(() => {
    try {
      const saved = localStorage.getItem('shrinkr_onboarding')
      if (saved) setCompletedSteps(JSON.parse(saved))
      const hidden = localStorage.getItem('shrinkr_onboarding_hidden')
      if (hidden === 'true') setIsVisible(false)
      
      // Auto-open if first time and not all done
      const hasOpened = localStorage.getItem('shrinkr_onboarding_opened')
      if (!hasOpened && JSON.parse(saved || '[]').length < steps.length) {
        setTimeout(() => setIsOpen(true), 2000)
        localStorage.setItem('shrinkr_onboarding_opened', 'true')
      }
    } catch {}
  }, [])

  useEffect(() => {
    const newCompletions = [...completedSteps]
    let changed = false

    if (urls.length > 0 && !newCompletions.includes('create_link')) {
      newCompletions.push('create_link')
      changed = true
    }

    const hasAlias = urls.some(u => u.customAlias && u.customAlias !== u.shortCode)
    if (hasAlias && !newCompletions.includes('add_custom_alias')) {
      newCompletions.push('add_custom_alias')
      changed = true
    }

    // Detect bio setup (check if user has a username, fetched via urls or separate effect)
    // For now, let's assume if they have urls, we can check a sample or just keep it manual
    // Actually, better to check settings. 
    // I'll add a check for username if possible, but the current props only have `urls`.
    // I will add a small check internally or leave it as is for now.
    
    // Check for QR (if any QR has been generated - we don't track this easily yet)
    // Check for Analytics view (we don't track this easily yet)

    if (changed) {
      setCompletedSteps(newCompletions)
      localStorage.setItem('shrinkr_onboarding', JSON.stringify(newCompletions))
      confetti({ particleCount: 30, spread: 40, origin: { x: 0.9, y: 0.9 }, colors: ['#CBFF00', '#FFFFFF'] })
      setShowPulse(true)
      setTimeout(() => setShowPulse(false), 3000)
    }
  }, [urls, completedSteps])

  const progress = (completedSteps.length / steps.length) * 100
  const allDone = completedSteps.length === steps.length

  if (!isVisible && !allDone) return null
  if (allDone && !isOpen) return null

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && isVisible && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: '30px', right: '30px', zIndex: 999998,
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'var(--accent)', color: '#000', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(203, 255, 0, 0.4)', cursor: 'pointer'
          }}
        >
          <Sparkles size={24} />
          {showPulse && (
            <motion.div
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid var(--accent)' }}
            />
          )}
        </motion.button>
      )}

      {/* Checklist Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 100, scale: 0.9, filter: 'blur(10px)' }}
            style={{
              position: 'fixed', bottom: '30px', right: '30px', zIndex: 999999,
              width: '360px', background: '#111', borderRadius: '24px',
              border: '1px solid var(--border)', boxShadow: '0 30px 100px rgba(0,0,0,0.8)',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>GETTING STARTED</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', marginTop: '4px' }}>Shrinkr Essentials</div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#555', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Progress Bar */}
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.03)', position: 'relative' }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                style={{ height: '100%', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent-glow)' }}
              />
            </div>

            {/* Steps List */}
            <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '12px 10px' }}>
              {steps.map((step) => {
                const isDone = completedSteps.includes(step.id)
                return (
                  <div 
                    key={step.id}
                    style={{ 
                      padding: '16px', borderRadius: '16px',
                      display: 'flex', gap: '16px', alignItems: 'flex-start',
                      transition: 'all 0.2s',
                      background: isDone ? 'transparent' : 'rgba(203, 255, 0, 0.02)'
                    }}
                  >
                    <div style={{ 
                      width: '24px', height: '24px', borderRadius: '50%',
                      border: `1.5px solid ${isDone ? 'var(--accent)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isDone ? 'var(--accent)' : 'transparent',
                      flexShrink: 0, marginTop: '2px'
                    }}>
                      {isDone && <Check size={12} color="#000" strokeWidth={4} />}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '14px', fontWeight: 800, 
                        color: isDone ? 'var(--text-muted)' : '#fff',
                        textDecoration: isDone ? 'line-through' : 'none',
                        transition: 'all 0.2s'
                      }}>
                        {step.label}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                        {step.description}
                      </div>
                      
                      {!isDone && step.action && (
                        <button 
                          onClick={step.action.onClick}
                          style={{
                            marginTop: '12px', background: 'rgba(203, 255, 0, 0.1)',
                            border: '1px solid var(--accent)', color: 'var(--accent)',
                            padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 900,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                          }}
                        >
                          {step.action.label} <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer / All Done State */}
            <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
              {allDone ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--accent)', fontWeight: 900, fontSize: '13px' }}>
                  <Sparkles size={16} /> YOU'RE A PRO! <Sparkles size={16} />
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
                  COMPLETE ALL STEPS TO MASTER ZURL
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
