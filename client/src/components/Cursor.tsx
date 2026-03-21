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

  // Hide on mobile/touch devices
  const isTouchDevice = () => {
    return window.matchMedia('(pointer: coarse)').matches
  }

  useEffect(() => {
    if (isTouchDevice()) return

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }

      if (!isVisible) setIsVisible(true)

      // Move dot instantly
      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`
      }
    }

    const onMouseLeave = () => setIsVisible(false)
    const onMouseEnter = () => setIsVisible(true)

    const onMouseDown = () => setIsClicking(true)
    const onMouseUp = () => setIsClicking(false)

    // Smooth ring follow using RAF
    const animateRing = () => {
      const lerp = (a: number, b: number, t: number) =>
        a + (b - a) * t

      ringPos.current.x = lerp(
        ringPos.current.x,
        mouse.current.x,
        0.12
      )
      ringPos.current.y = lerp(
        ringPos.current.y,
        mouse.current.y,
        0.12
      )

      if (ringRef.current) {
        ringRef.current.style.transform =
          `translate(${ringPos.current.x - 16}px, ${ringPos.current.y - 16}px)`
      }

      rafRef.current = requestAnimationFrame(animateRing)
    }

    // Detect hoverable elements
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isClickable =
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[data-cursor="hover"]') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.getAttribute('onclick') ||
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
      {/* Small dot — follows instantly */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent, #DFE104)',
          pointerEvents: 'none',
          zIndex: 999999,
          opacity: isVisible ? 1 : 0,
          transform: isClicking ? 'scale(0.6)' : 'scale(1)',
          transition: 'opacity 200ms, transform 100ms',
          willChange: 'transform',
        }}
      />

      {/* Ring — follows with smooth lag */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: `1.5px solid var(--accent, #DFE104)`,
          pointerEvents: 'none',
          zIndex: 999998,
          opacity: isVisible
            ? isHovering ? 0.6 : 0.3
            : 0,
          transform: isHovering
            ? 'scale(1.5)'
            : isClicking
            ? 'scale(0.8)'
            : 'scale(1)',
          transition: 'opacity 200ms, transform 200ms ease',
          willChange: 'transform',
        }}
      />
    </>
  )
}
