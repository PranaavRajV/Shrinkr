import { useRef, useState, ReactNode } from 'react'
import { motion } from 'framer-motion'

interface Props {
  children: ReactNode
  strength?: number
}

export default function Magnetic({ children, strength = 0.3 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || prefersReduced) return
    const { clientX, clientY } = e
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distX = clientX - centerX
    const distY = clientY - centerY
    const distance = Math.sqrt(distX ** 2 + distY ** 2)

    if (distance < 100) {
      const pull = (100 - distance) / 100
      setOffset({
        x: distX * pull * strength,
        y: distY * pull * strength
      })
    } else {
      setOffset({ x: 0, y: 0 })
    }
  }

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 })
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: offset.x, y: offset.y }}
      transition={offset.x === 0 && offset.y === 0 ? { type: 'spring', stiffness: 150, damping: 15 } : { type: 'tween', ease: 'linear', duration: 0 }}
      style={{ display: 'inline-block' }}
    >
      {children}
    </motion.div>
  )
}
