import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

interface EmptyStateProps {
  type: 'links' | 'analytics' | 'search' | 'pinned' | 'bio' | 'apikeys' | 'clicks'
  title?: string
  description?: string
  action?: { label: string; onClick: () => void }
}

const SVGs = {
  links: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M70 80C70 68.9543 78.9543 60 90 60H110M130 80C130 91.0457 121.046 100 110 100H90" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4"/>
      <rect x="50" y="70" width="40" height="20" rx="10" stroke="var(--accent)" strokeWidth="2"/>
      <rect x="110" y="70" width="40" height="20" rx="10" stroke="var(--accent)" strokeWidth="2"/>
      <path d="M100 40V50M95 45H105" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="90" width="16" height="30" rx="2" stroke="var(--text-muted)" strokeWidth="2"/>
      <rect x="92" y="70" width="16" height="50" rx="2" stroke="var(--text-muted)" strokeWidth="2"/>
      <rect x="124" y="85" width="16" height="35" rx="2" stroke="var(--text-muted)" strokeWidth="2"/>
      <path d="M100 45C100 42.2386 102.239 40 105 40C107.761 40 110 42.2386 110 45C110 47.7614 107.761 50 105 50V55M105 62V64" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M50 125H150" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 4"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="95" cy="75" r="25" stroke="var(--accent)" strokeWidth="2"/>
      <path d="M112 92L125 105" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M118 102L122 98M118 98L122 102" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M85 70H105M85 75H100M85 80H105" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
    </svg>
  ),
  pinned: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="40" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 4"/>
      <path d="M90 60H110V95L100 85L90 95V60Z" stroke="var(--accent)" strokeWidth="2" transform="rotate(-15 100 80)"/>
      <circle cx="130" cy="60" r="1.5" fill="var(--accent)"/>
      <circle cx="70" cy="100" r="1.5" fill="var(--accent)"/>
      <circle cx="135" cy="95" r="1" fill="var(--text-muted)"/>
    </svg>
  ),
  bio: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="55" r="12" stroke="var(--text-muted)" strokeWidth="2"/>
      <path d="M80 85C80 77.268 86.268 71 94 71H106C113.732 71 120 77.268 120 85V90H80V85Z" stroke="var(--text-muted)" strokeWidth="2"/>
      <path d="M80 105H120M80 115H120M80 125H120" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 4"/>
      <path d="M72 105H74M72 115H74M72 125H74" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  apikeys: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M110 80L130 60M125 65L130 70M120 70L125 75" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="100" cy="90" r="12" stroke="var(--accent)" strokeWidth="2"/>
      <circle cx="100" cy="70" r="25" stroke="var(--text-muted)" strokeWidth="2" strokeDasharray="4 2"/>
      <rect x="135" y="85" width="12" height="15" rx="2" stroke="var(--text-muted)" strokeWidth="2"/>
      <path d="M138 85V82C138 80.3431 139.343 79 141 79V79C142.657 79 144 80.3431 144 82V85" stroke="var(--text-muted)" strokeWidth="2"/>
    </svg>
  ),
  clicks: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M110 90L100 120L92 105L75 110L110 90Z" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="110" cy="90" r="10" stroke="var(--accent)" strokeWidth="1" opacity="0.5">
        <animate attributeName="r" from="10" to="25" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="110" cy="90" r="5" stroke="var(--accent)" strokeWidth="1" opacity="0.8">
        <animate attributeName="r" from="5" to="15" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
        <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
      </circle>
    </svg>
  )
}

const DEFAULT_CONTENT = {
  links: { title: 'No Links Yet', desc: 'Start by creating your first short URL.' },
  analytics: { title: 'No Data Collected', desc: 'Analytics will appear once your links are clicked.' },
  search: { title: 'No Matches Found', desc: 'Try adjusting your search parameters.' },
  pinned: { title: 'Nothing Pinned', desc: 'Pin important links to keep them at the top.' },
  bio: { title: 'Bio Empty', desc: 'Add links to your profile to build your page.' },
  apikeys: { title: 'No API Keys', desc: 'Generate a key to start using our developer API.' },
  clicks: { title: 'Zero Clicks', desc: 'Waiting for the first visitor to arrive.' }
}

export default function EmptyState({ type, title, description, action }: EmptyStateProps) {
  const content = DEFAULT_CONTENT[type]
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        textAlign: 'center',
        width: '100%'
      }}
    >
      <div style={{ width: '200px', marginBottom: '24px' }}>
        {SVGs[type]}
      </div>
      
      <h3 style={{ 
        fontSize: '16px', 
        fontWeight: 900, 
        color: 'var(--text-primary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '8px'
      }}>
        {title || content.title}
      </h3>
      
      <p style={{ 
        fontSize: '13px', 
        color: 'var(--text-muted)',
        maxWidth: '300px',
        lineHeight: 1.6,
        marginBottom: action ? '24px' : '0'
      }}>
        {description || content.desc}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          style={{
            background: 'var(--accent)',
            color: '#000',
            border: 'none',
            padding: '12px 24px',
            borderRadius: 'var(--radius-full)',
            fontSize: '12px',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={16} />
          {action.label}
        </button>
      )}
    </motion.div>
  )
}
