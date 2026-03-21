import { useEffect, useState } from 'react'

export const useCountUp = (target: number, duration = 1200) => {
  const [count, setCount] = useState(0)
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (prefersReduced) {
      setCount(target)
      return
    }

    if (target === 0) {
      setCount(0)
      return
    }

    let start = 0
    let startTime: number | null = null

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = timestamp - startTime
      const easeOutQuad = (t: number) => t * (2 - t)
      const percentage = Math.min(progress / duration, 1)
      const current = Math.floor(target * easeOutQuad(percentage))
      
      setCount(current)

      if (percentage < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(target)
      }
    }

    requestAnimationFrame(animate)
  }, [target, duration, prefersReduced])

  return count
}
