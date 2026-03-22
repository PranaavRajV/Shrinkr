import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface RevealProps {
  children: ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
}

export function Reveal({ children, delay = 0, direction = 'up', distance = 40 }: RevealProps) {
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? distance : direction === 'down' ? -distance : 0,
      x: direction === 'left' ? distance : direction === 'right' ? -distance : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: prefersReduced ? 0.01 : 0.7,
        delay: prefersReduced ? 0 : delay,
        ease: [0.22, 1, 0.36, 1] as any
      }
    }
  }

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
    >
      {children}
    </motion.div>
  )
}

export function RevealText({ text, delay = 0, centered = false }: { text: string; delay?: number; centered?: boolean }) {
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const words = text.split(' ')

  return (
    <div style={{ overflow: 'hidden', display: 'flex', flexWrap: 'wrap', gap: '0.25em', justifyContent: centered ? 'center' : 'flex-start' }}>
      {words.map((word, i) => (
        <span key={i} style={{ overflow: 'hidden', display: 'inline-block' }}>
          <motion.span
            style={{ display: 'inline-block' }}
            initial={{ y: '100%', opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: prefersReduced ? 0.01 : 0.6,
              delay: prefersReduced ? 0 : (i * 0.06) + delay,
              ease: [0.22, 1, 0.36, 1] as any
            }}
          >
            {word}&nbsp;
          </motion.span>
        </span>
      ))}
    </div>
  )
}
