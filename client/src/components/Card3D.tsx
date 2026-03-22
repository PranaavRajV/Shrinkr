import { ReactNode, useRef, useState } from 'react'

interface Props {
  children: ReactNode
}

export default function Card3D({ children }: Props) {
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [shine, setShine] = useState({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || prefersReduced) return
    setIsHovered(true)
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    // Max 10 degrees tilt
    const rotX = ((y - centerY) / centerY) * -10
    const rotY = ((x - centerX) / centerX) * 10
    
    setRotateX(rotX)
    setRotateY(rotY)
    setShine({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100
    })
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setRotateX(0)
    setRotateY(0)
    setShine({ x: 50, y: 50 })
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-cursor="hover"
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: isHovered ? 'none' : 'transform 0.5s ease',
        position: 'relative',
        transformStyle: 'preserve-3d',
        width: '100%',
        height: '100%'
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255, 224, 194, 0.08) 0%, transparent 80%)`,
        pointerEvents: 'none', zIndex: 1, borderRadius: 'inherit',
        opacity: isHovered ? 1 : 0, transition: 'opacity 0.3s ease'
      }} />
      <div style={{ transform: 'translateZ(20px)', height: '100%' }}>
        {children}
      </div>
    </div>
  )
}
