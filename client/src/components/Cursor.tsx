import { useEffect, useRef, useState } from 'react'

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const mouse = useRef({ x: 0, y: 0 })
  const ringPos = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number>(0)

  const isTouchDevice = () => {
    return window.matchMedia('(pointer: coarse)').matches
  }

  useEffect(() => {
    if (isTouchDevice()) return

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }
      if (!isVisible) setIsVisible(true)

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`
      }
    }

    const onMouseLeave = () => setIsVisible(false)
    const onMouseEnter = () => setIsVisible(true)
    const onMouseDown = () => setIsClicking(true)
    const onMouseUp = () => setIsClicking(false)

    const animateRing = () => {
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t
      ringPos.current.x = lerp(ringPos.current.x, mouse.current.x, 0.15)
      ringPos.current.y = lerp(ringPos.current.y, mouse.current.y, 0.15)

      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringPos.current.x - 16}px, ${ringPos.current.y - 16}px)`
      }
      rafRef.current = requestAnimationFrame(animateRing)
    }

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isClickable = target.closest('button, a, input, textarea, select, [role="button"]') || 
                          window.getComputedStyle(target).cursor === 'pointer'
      setIsHovering(!!isClickable)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mouseenter', onMouseEnter)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mouseover', onMouseOver)
    rafRef.current = requestAnimationFrame(animateRing)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('mouseenter', onMouseEnter)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mouseover', onMouseOver)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isVisible])

  if (isTouchDevice()) return null

  return (
    <>
      {/* Precision Core Dot */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: '8px', height: '8px',
          borderRadius: '50%', background: 'var(--accent, #CBFF00)',
          pointerEvents: 'none', zIndex: 999999,
          opacity: isVisible ? 1 : 0,
          transform: isClicking ? 'scale(0.7)' : 'scale(1)',
          boxShadow: '0 0 10px var(--accent)',
          transition: 'opacity 300ms, transform 150ms cubic-bezier(0.23, 1, 0.32, 1)',
          willChange: 'transform',
        }}
      />

      {/* Weighted Pulse Ring */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: '32px', height: '32px',
          borderRadius: '50%', border: '1.5px solid var(--accent, #CBFF00)',
          pointerEvents: 'none', zIndex: 999998,
          opacity: isVisible ? (isHovering ? 0.8 : 0.4) : 0,
          transform: isHovering ? 'scale(1.6)' : (isClicking ? 'scale(0.8)' : 'scale(1)'),
          boxShadow: isHovering ? '0 0 15px var(--accent)' : 'none',
          backgroundColor: isHovering ? 'var(--accent-soft, rgba(203, 255, 0, 0.05))' : 'transparent',
          transition: 'opacity 300ms, transform 300ms cubic-bezier(0.23, 1, 0.32, 1), background-color 300ms',
          willChange: 'transform',
        }}
      />
    </>
  )
}
