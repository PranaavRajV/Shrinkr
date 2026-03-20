import { useEffect, useState } from 'react'

export function useCountUp(target: number, duration = 800, start = true) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!start) return

    let startTime: number | null = null
    const end = target

    function easeOutQuart(x: number): number {
      return 1 - Math.pow(1 - x, 4)
    }

    function step(timestamp: number) {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easedProgress = easeOutQuart(progress)
      
      setCount(Math.floor(easedProgress * end))

      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }

    requestAnimationFrame(step)
  }, [target, duration, start])

  return count
}
