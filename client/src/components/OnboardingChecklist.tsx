import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, ChevronUp, X, Sparkles, Plus, Copy, BarChart2, Tag, Globe, QrCode } from 'lucide-react'
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
  const [isExpanded, setIsExpanded] = useState(true)
  const [isVisible, setIsVisible] = useState(true)
  const [isDismissing, setIsDismissing] = useState(false)
  const navigate = useNavigate()

  const steps: Step[] = [
    { 
      id: 'create_link', 
      label: 'Create your first short link', 
      description: 'Shorten any URL using the form above',
      action: { label: 'CREATE LINK', onClick: () => window.scroll({ top: 300, behavior: 'smooth' }) }
    },
    { 
      id: 'copy_link', 
      label: 'Copy and share your link', 
      description: 'Click the copy button on any link card',
    },
    { 
      id: 'view_analytics', 
      label: 'Check your analytics', 
      description: 'Click the chart icon to see visitor data',
    },
    { 
      id: 'add_custom_alias', 
      label: 'Create a link with custom alias', 
      description: 'Use a memorable name for your link brand',
    },
    { 
      id: 'setup_bio', 
      label: 'Set up your bio page', 
      description: 'A shareable page with all your social links',
      action: { label: 'SETUP BIO', onClick: () => navigate('/dashboard/bio') }
    },
    { 
      id: 'generate_qr', 
      label: 'Generate a QR code', 
      description: 'Get a scannable QR for any link in your list',
    }
  ]

  useEffect(() => {
    try {
      const saved = localStorage.getItem('shrinkr_onboarding')
      if (saved) setCompletedSteps(JSON.parse(saved))
      const hidden = localStorage.getItem('shrinkr_onboarding_hidden')
      if (hidden === 'true') setIsVisible(false)
    } catch {}
  }, [])

  // Auto-detection logic
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

    // New: Check if all done
    if (newCompletions.length === steps.length && !completedSteps.includes(steps[steps.length-1].id)) {
      setTimeout(() => {
        setIsDismissing(true)
        setTimeout(() => {
          setIsVisible(false)
          localStorage.setItem('shrinkr_onboarding_hidden', 'true')
        }, 3000)
      }, 2000)
    }

    if (changed) {
      setCompletedSteps(newCompletions)
      localStorage.setItem('shrinkr_onboarding', JSON.stringify(newCompletions))
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 }, colors: ['#CBFF00', '#FFFFFF'] })
    }
  }, [urls, completedSteps])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('shrinkr_onboarding_hidden', 'true')
  }

  const progress = (completedSteps.length / steps.length) * 100
  const allDone = completedSteps.length === steps.length

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={isDismissing ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 }}
      className="neo-card"
      style={{ 
        padding: 0, 
        marginBottom: '48px', 
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}
    >
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          padding: '14px 28px', display: 'flex', alignItems: 'center', 
          justifyContent: 'space-between', cursor: 'pointer' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            GETTING STARTED
          </span>
          <div style={{ width: '80px', height: '3px', background: 'var(--border)', marginLeft: '12px', overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ height: '100%', background: 'var(--accent)' }}
            />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', marginLeft: '8px' }}>
            {completedSteps.length}/{steps.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.div animate={{ rotate: isExpanded ? 0 : 180 }} transition={{ duration: 0.3 }}>
            <ChevronDown size={16} color="var(--text-muted)" />
          </motion.div>
          <button 
            onClick={(e) => { e.stopPropagation(); handleDismiss() }} 
            style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && !allDone && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {steps.map((step, idx) => {
              const isDone = completedSteps.includes(step.id)
              return (
                <div
                  key={step.id}
                  style={{ 
                    padding: '12px 28px', borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: '14px'
                  }}
                >
                  <motion.div
                    initial={false}
                    animate={isDone ? { scale: [1, 1.3, 1], backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' } : {}}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {isDone && <Check size={10} color="#000" strokeWidth={4} />}
                  </motion.div>

                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '13px', fontWeight: 600, 
                      color: isDone ? 'var(--text-muted)' : '#fff',
                      textDecoration: isDone ? 'line-through' : 'none',
                      textDecorationColor: isDone ? 'var(--text-muted)' : 'transparent',
                      transition: 'all 0.3s'
                    }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', opacity: isDone ? 0.5 : 1 }}>
                      {step.description}
                    </div>
                  </div>

                  {isDone ? (
                    <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '0.05em' }}>DONE</span>
                  ) : step.action ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); step.action?.onClick() }}
                      style={{
                        background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)',
                        padding: '6px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, cursor: 'pointer'
                      }}
                    >
                      {step.action.label}
                    </button>
                  ) : null}
                </div>
              )
            })}
          </motion.div>
        )}

        {isExpanded && allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '24px 28px' }}
          >
            <style>{`
              @keyframes drawCheck {
                to { stroke-dashoffset: 0; }
              }
            `}</style>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 12px' }}>
              <circle cx="12" cy="12" r="10" stroke="var(--accent)" strokeWidth="2" />
              <path 
                d="M7 13l3 3 7-7" 
                stroke="var(--accent)" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                strokeDasharray="20"
                strokeDashoffset="20"
                style={{ animation: 'drawCheck 0.5s ease-out forwards 0.2s' }}
              />
            </svg>
            <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '0.1em' }}>ALL DONE!</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>You're a Shrinkr pro now.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
