import { useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

export function useParallax(speed = 0.5) {
  const ref = useRef(null)
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })

  // Ensure y is 0 if user prefers reduced motion
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReduced ? ['0px', '0px'] : [`${-speed * 100}px`, `${speed * 100}px`]
  )

  return { ref, y }
}
