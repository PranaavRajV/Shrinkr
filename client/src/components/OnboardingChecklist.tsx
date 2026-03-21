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
  const navigate = useNavigate()

  const steps: Step[] = [
    { 
      id: 'create_link', 
      label: 'Create your first short link', 
      description: 'Shorten any URL using the form above',
      action: { label: 'CREATE LINK', onClick: () => window.scrollTo({ top: 300, behavior: 'smooth' }) }
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

    if (changed) {
      setCompletedSteps(newCompletions)
      localStorage.setItem('shrinkr_onboarding', JSON.stringify(newCompletions))
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 }, colors: ['#CBFF00', '#FFFFFF'] })
    }
  }, [urls, completedSteps])

  const handleDismiss = () => {
    if (confirm('Hide the getting started checklist forever?')) {
      setIsVisible(false)
      localStorage.setItem('shrinkr_onboarding_hidden', 'true')
    }
  }

  const progress = (completedSteps.length / steps.length) * 100
  const allDone = completedSteps.length === steps.length

  if (!isVisible || (allDone && !isExpanded)) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="neo-card"
      style={{ 
        padding: '24px', 
        marginBottom: '48px', 
        background: 'rgba(255,255,255,0.01)',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isExpanded ? '24px' : '0' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              GETTING STARTED
            </h3>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>
              {completedSteps.length} / {steps.length} COMPLETED
            </span>
          </div>
          <div style={{ width: '100%', maxWidth: '300px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', position: 'relative' }}>
            <motion.div 
              style={{ height: '100%', background: 'var(--accent)', borderRadius: '2px' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 50, damping: 20 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: '8px' }}>
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <button onClick={handleDismiss} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: '8px' }}>
            <X size={18} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
          >
            {steps.map((step, idx) => {
              const isDone = completedSteps.includes(step.id)
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '20px', 
                    padding: '16px',
                    background: isDone ? 'none' : 'rgba(255,255,255,0.02)',
                    borderRadius: '12px',
                    border: '1px solid transparent',
                    borderColor: isDone ? 'transparent' : 'rgba(255,255,255,0.03)'
                  }}
                >
                  <motion.div
                    animate={isDone ? { scale: [1, 1.2, 1], rotate: [0, 10, 0] } : {}}
                    style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      border: `2px solid ${isDone ? 'var(--accent)' : '#333'}`,
                      background: isDone ? 'var(--accent)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#000', flexShrink: 0, transition: 'all 0.3s'
                    }}
                  >
                    {isDone && <Check size={14} strokeWidth={4} />}
                  </motion.div>

                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 700, 
                      color: isDone ? 'var(--text-muted)' : '#fff',
                      textDecoration: isDone ? 'line-through' : 'none',
                      transition: 'all 0.3s'
                    }}>
                      {step.label}
                    </div>
                    {!isDone && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {step.description}
                      </div>
                    )}
                  </div>

                  {step.action && !isDone && (
                    <button
                      onClick={step.action.onClick}
                      style={{
                        background: 'rgba(203,255,0,0.1)', color: 'var(--accent)',
                        border: '1px solid rgba(203,255,0,0.2)', padding: '8px 16px',
                        borderRadius: '8px', fontSize: '10px', fontWeight: 900, cursor: 'pointer'
                      }}
                    >
                      {step.action.label}
                    </button>
                  )}
                  {isDone && (
                    <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--accent)', opacity: 0.5 }}>DONE</span>
                  )}
                </motion.div>
              )
            })}

            {allDone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ 
                  textAlign: 'center', padding: '40px', background: 'rgba(203,255,0,0.05)', 
                  borderRadius: '16px', border: '1px solid var(--accent)', marginTop: '20px' 
                }}
              >
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <Sparkles size={24} /> ALL DONE! <Sparkles size={24} />
                </div>
                <p style={{ color: '#fff', fontSize: '14px', marginTop: '8px', fontWeight: 600 }}>You're a Shrinkr pro now.</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
