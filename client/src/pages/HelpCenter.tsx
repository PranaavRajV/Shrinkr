import { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { HelpCircle, Book, MessageSquare, Shield, Zap, Search, ArrowRight, Info, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const S = {
  card: {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '32px',
    transition: 'all 0.2s ease-in-out',
    cursor: 'pointer',
    flex: 1
  },
  title: {
    fontSize: '20px', fontWeight: 900, marginBottom: '12px', color: 'var(--foreground)',
    display: 'flex', alignItems: 'center', gap: '12px'
  },
  text: {
    fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6
  }
}

const FAQS = [
  {
    q: "How do I create a custom alias?",
    a: "When creating a new link, toggle the 'Advanced' section and enter your preferred keyword in the 'Custom Alias' field. Note that aliases must be unique."
  },
  {
    q: "Can I edit my original URL after shortening?",
    a: "Yes! Navigate to 'My Links', find the link you wish to update, and click the edit icon. You can modify the destination URL at any time."
  },
  {
    q: "How are analytics tracked?",
    a: "ZURL tracks each click in real-time. We capture device type, browser, and approximate geographical data (via IP) for every visitor."
  },
  {
    q: "Is there a limit to how many links I can create?",
    a: "As a Premium ZURL user, your account has virtually unlimited shortening capacity. Feel free to use bulk upload for large sets of URLs."
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. We use industry-standard encryption for all data at rest and in transit. Your personal information is never sold to third parties."
  }
]

export default function HelpCenter() {
  const [search, setSearch] = useState('')
  const [showContact, setShowContact] = useState(false)

  const filteredFaqs = useMemo(() => {
    if (!search.trim()) return FAQS
    const q = search.toLowerCase()
    return FAQS.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
  }, [search])

  const handleAction = (label: string) => {
    toast.success(`OPENING ${label}...`)
  }

  return (
    <Layout>
      <div className="fade-in" style={{ padding: '40px' }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '80px', marginTop: '20px' }}>
          <div style={{
            fontSize: '11px', fontWeight: 900, color: 'var(--accent)', 
            letterSpacing: '0.4em', marginBottom: '16px', textTransform: 'uppercase'
          }}>
            SUPPORT ECOSYSTEM
          </div>
          <h1 style={{ fontSize: '56px', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--foreground)', marginBottom: '24px' }}>
            How can we assist you?
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            Access our documentation, browse common FAQs, or connect with our specialized support team.
          </p>

          <div style={{ position: 'relative', maxWidth: '600px', margin: '48px auto 0' }}>
            <Search size={22} color={search ? 'var(--accent)' : 'var(--text-muted)'} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s' }} />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search for topics, features, or guides..."
              style={{
                width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                padding: '20px 20px 20px 60px', borderRadius: 'var(--radius-full)',
                color: 'var(--foreground)', fontSize: '16px', outline: 'none', transition: 'all 0.2s',
                boxShadow: search ? '0 0 20px rgba(255, 224, 194, 0.05)' : 'none'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>

        {/* Resources Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '80px' }}>
          <div 
            style={S.card} 
            onClick={() => handleAction('DOCUMENTATION')}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} 
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <div style={{ width: '48px', height: '48px', background: 'rgba(255,224,194,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Book color="var(--accent)" size={24} />
            </div>
            <h3 style={S.title}>Documentation</h3>
            <p style={S.text}>Deep-dive into our API, integration patterns, and advanced shortening features.</p>
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 800, fontSize: '12px' }}>
              LEARN MORE <ArrowRight size={14} />
            </div>
          </div>

          <div 
            style={S.card} 
            onClick={() => handleAction('QUICK START')}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} 
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <div style={{ width: '48px', height: '48px', background: 'rgba(255,224,194,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Zap color="var(--accent)" size={24} />
            </div>
            <h3 style={S.title}>Quick Start Guides</h3>
            <p style={S.text}>Launch your first campaign in minutes with our streamlined onboarding workflows.</p>
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 800, fontSize: '12px' }}>
               GET STARTED <ArrowRight size={14} />
            </div>
          </div>

          <div 
             style={S.card} 
             onClick={() => setShowContact(true)}
             onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} 
             onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <div style={{ width: '48px', height: '48px', background: 'rgba(255,224,194,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <MessageSquare color="var(--accent)" size={24} />
            </div>
            <h3 style={S.title}>Live Support</h3>
            <p style={S.text}>Having technical difficulties? Our architecture experts are ready to assist 24/7.</p>
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 800, fontSize: '12px' }}>
               CONNECT <ArrowRight size={14} />
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div style={{ maxWidth: '800px', margin: '0 auto 100px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 900, textAlign: 'center', marginBottom: '48px', color: 'var(--foreground)' }}>
             Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <AnimatePresence mode="popLayout">
               {filteredFaqs.length > 0 ? (
                 filteredFaqs.map((faq) => (
                   <motion.div 
                     layout
                     initial={{ opacity: 0, scale: 0.98 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.98 }}
                     key={faq.q} 
                     style={{ 
                       background: 'var(--bg-secondary)', border: '1px solid var(--border)', 
                       borderRadius: '16px', padding: '32px' 
                     }}
                   >
                     <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--foreground)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <HelpCircle size={18} color="var(--accent)" />
                        {faq.q}
                     </div>
                     <p style={{ ...S.text, fontSize: '15px' }}>{faq.a}</p>
                   </motion.div>
                 ))
               ) : (
                 <motion.div 
                   initial={{ opacity: 0 }} 
                   animate={{ opacity: 1 }} 
                   style={{ textAlign: 'center', padding: '60px', border: '1px dashed var(--border)', borderRadius: '24px' }}
                 >
                    <Info size={40} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
                    <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>No results matching "{search}"</p>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>

        {/* Call to Action Support */}
        <div style={{ 
          background: 'var(--accent)', padding: '60px', borderRadius: 'var(--radius-lg)', 
          textAlign: 'center', position: 'relative', overflow: 'hidden'
        }}>
           <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ color: 'var(--primary-foreground)', fontSize: '36px', fontWeight: 900, marginBottom: '12px' }}>Still need help?</h2>
              <p style={{ color: 'rgba(0,0,0,0.6)', fontWeight: 700, fontSize: '18px', marginBottom: '32px' }}>
                 Our dedicated team is just a few clicks away from solving your problems.
              </p>
              <button 
                onClick={() => setShowContact(true)}
                style={{
                  background: 'var(--background)', color: 'var(--foreground)', border: 'none', padding: '18px 48px',
                  borderRadius: 'var(--radius-full)', fontWeight: 900, fontSize: '14px',
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}
              >
                  CONTACT OUR EXPERTS <Shield size={18} />
              </button>
           </div>
        </div>
      </div>

      <AnimatePresence>
         {showContact && (
            <ContactModal 
              onClose={() => setShowContact(false)} 
              onSuccess={() => { setShowContact(false); toast.success('TICKET SUBMITTED ✓') }} 
            />
         )}
      </AnimatePresence>
    </Layout>
  )
}

function ContactModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      onSuccess()
    }, 1500)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
       <motion.div 
         initial={{ opacity: 0, scale: 0.95, y: 20 }} 
         animate={{ opacity: 1, scale: 1, y: 0 }}
         exit={{ opacity: 0, scale: 0.95, y: 20 }}
         style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '32px', width: '100%', maxWidth: '520px', padding: '48px', position: 'relative' }}
       >
          <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
             <X size={24} />
          </button>
          
          <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '12px', color: 'var(--foreground)' }}>Submit Ticket</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '32px' }}>Describe your issue and we'll respond within 24 hours.</p>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <div>
                <label style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'block' }}>Subject</label>
                <input required placeholder="Technical assistance..." style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '14px 18px', borderRadius: '12px', color: 'var(--foreground)', outline: 'none' }} />
             </div>
             <div>
                <label style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'block' }}>Details</label>
                <textarea required placeholder="Explain your challenge in detail..." style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '14px 18px', borderRadius: '12px', color: 'var(--foreground)', outline: 'none', minHeight: '120px', resize: 'vertical' }} />
             </div>
             
             <button 
               type="submit" 
               disabled={submitting}
               style={{ background: 'var(--accent)', color: 'var(--primary-foreground)', border: 'none', borderRadius: 'var(--radius-full)', padding: '16px', fontWeight: 900, fontSize: '15px', marginTop: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
             >
                {submitting ? 'TRANSMITTING...' : <><Zap size={18} /> Submit Application</>}
             </button>
          </form>
       </motion.div>
    </div>
  )
}
