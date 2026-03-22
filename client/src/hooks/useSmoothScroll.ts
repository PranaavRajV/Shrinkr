import Lenis from '@studio-freight/lenis'
import { useEffect } from 'react'

export function useSmoothScroll() {
  useEffect(() => {
    // Respect user accessibility preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      // ── Performance tuning for butter-smooth scroll ──────────────────
      duration: 1.05,                                    // snappy but smooth
      easing: (t: number) => 1 - Math.pow(1 - t, 4),   // ease-out-quart — natural deceleration
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,   // slightly subdued — prevents nausea on fast wheels
      touchMultiplier: 1.4,   // natural on mobile
      infinite: false,
    })

    // ── Dedicated rAF loop — avoids conflicts with framer-motion ────────
    let rafId: number

    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }

    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])
}
