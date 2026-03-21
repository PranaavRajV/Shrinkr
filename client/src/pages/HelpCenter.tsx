import Layout from '../components/Layout'
import { HelpCircle, Book, MessageSquare, Shield, Zap, Search, ArrowRight } from 'lucide-react'

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
    fontSize: '20px', fontWeight: 900, marginBottom: '12px', color: '#fff',
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
  }
]

export default function HelpCenter() {
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
          <h1 style={{ fontSize: '56px', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', marginBottom: '24px' }}>
            How can we assist you?
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            Access our documentation, browse common FAQs, or connect with our specialized support team.
          </p>

          <div style={{ position: 'relative', maxWidth: '600px', margin: '48px auto 0' }}>
            <Search size={22} color="var(--text-muted)" style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search for topics, features, or guides..."
              style={{
                width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                padding: '20px 20px 20px 60px', borderRadius: 'var(--radius-full)',
                color: '#fff', fontSize: '16px', outline: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>

        {/* Resources Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '80px' }}>
          <div style={S.card} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(203,255,0,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Book color="var(--accent)" size={24} />
            </div>
            <h3 style={S.title}>Documentation</h3>
            <p style={S.text}>Deep-dive into our API, integration patterns, and advanced shortening features.</p>
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 800, fontSize: '12px' }}>
              LEARN MORE <ArrowRight size={14} />
            </div>
          </div>

          <div style={S.card} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Zap color="#fff" size={24} />
            </div>
            <h3 style={S.title}>Quick Start Guides</h3>
            <p style={S.text}>Launch your first campaign in minutes with our streamlined onboarding workflows.</p>
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 800, fontSize: '12px' }}>
               GET STARTED <ArrowRight size={14} />
            </div>
          </div>

          <div style={S.card} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(0,183,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <MessageSquare color="#00B7FF" size={24} />
            </div>
            <h3 style={S.title}>Live Support</h3>
            <p style={S.text}>Having technical difficulties? Our architecture experts are ready to assist 24/7.</p>
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#00B7FF', fontWeight: 800, fontSize: '12px' }}>
               CONNECT <ArrowRight size={14} />
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div style={{ maxWidth: '800px', margin: '0 auto 100px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 900, textAlign: 'center', marginBottom: '48px', color: '#fff' }}>
             Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             {FAQS.map((faq, i) => (
               <div key={i} style={{ 
                 background: 'var(--bg-secondary)', border: '1px solid var(--border)', 
                 borderRadius: '16px', padding: '32px' 
               }}>
                 <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <HelpCircle size={18} color="var(--accent)" />
                    {faq.q}
                 </div>
                 <p style={{ ...S.text, fontSize: '15px' }}>{faq.a}</p>
               </div>
             ))}
          </div>
        </div>

        {/* Call to Action Support */}
        <div style={{ 
          background: 'var(--accent)', padding: '60px', borderRadius: 'var(--radius-lg)', 
          textAlign: 'center', position: 'relative', overflow: 'hidden'
        }}>
           <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ color: '#000', fontSize: '36px', fontWeight: 900, marginBottom: '12px' }}>Still need help?</h2>
              <p style={{ color: 'rgba(0,0,0,0.6)', fontWeight: 700, fontSize: '18px', marginBottom: '32px' }}>
                 Our dedicated team is just a few clicks away from solving your problems.
              </p>
              <button style={{
                background: '#000', color: '#fff', border: 'none', padding: '18px 48px',
                borderRadius: 'var(--radius-full)', fontWeight: 900, fontSize: '14px',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '12px'
              }}>
                 CONTACT OUR EXPERTS <Shield size={18} />
              </button>
           </div>
        </div>
      </div>
    </Layout>
  )
}
