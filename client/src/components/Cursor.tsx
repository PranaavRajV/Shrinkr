import { useEffect, useState } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'

export default function Cursor() {
  const [isHovering, setIsHovering] = useState(false)
  const [isText, setIsText] = useState(false)
  const [isClicked, setIsClicked] = useState(false)
  
  const mouseX = useMotionValue(-100)
  const mouseY = useMotionValue(-100)
  
  const springConfig = { damping: 20, stiffness: 150, mass: 0.5 }
  const ringX = useSpring(mouseX, springConfig)
  const ringY = useSpring(mouseY, springConfig)

  useEffect(() => {
    if (window.matchMedia('(pointer:coarse)').matches) return

    const moveMouse = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    const mouseDown = () => setIsClicked(true)
    const mouseUp = () => setIsClicked(false)

    const mouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isHover = !!target.closest('[data-cursor="hover"]')
      const isTextArea = !!target.closest('[data-cursor="text"]')
      
      setIsHovering(isHover)
      setIsText(isTextArea)
    }

    // Auto-apply data-cursor attributes
    const updateInteractiveElements = () => {
      const interactives = document.querySelectorAll('button, a, [role="button"]')
      interactives.forEach(el => {
        if (!el.hasAttribute('data-cursor')) {
          el.setAttribute('data-cursor', 'hover')
        }
      })

      // Also detect onClick handlers if possible (limited without specific framework hooks, 
      // but common practice for this kind of effect)
      // For this implementation, we rely on the above common tags
    }

    window.addEventListener('mousemove', moveMouse)
    window.addEventListener('mousedown', mouseDown)
    window.addEventListener('mouseup', mouseUp)
    window.addEventListener('mouseover', mouseOver)
    
    const observer = new MutationObserver(updateInteractiveElements)
    observer.observe(document.body, { childList: true, subtree: true })
    updateInteractiveElements()

    return () => {
      window.removeEventListener('mousemove', moveMouse)
      window.removeEventListener('mousedown', mouseDown)
      window.removeEventListener('mouseup', mouseUp)
      window.removeEventListener('mouseover', mouseOver)
      observer.disconnect()
    }
  }, [mouseX, mouseY])

  if (typeof window !== 'undefined' && window.matchMedia('(pointer:coarse)').matches) return null

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) return null

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99999 }}>
      {/* Main Dot */}
      <motion.div
        style={{
          position: 'fixed', left: 0, top: 0,
          width: 8, height: 8,
          background: 'var(--accent)',
          borderRadius: '50%',
          x: mouseX, y: mouseY,
          translateX: '-50%', translateY: '-50%',
        }}
        animate={{
          scale: isHovering ? 0 : isClicked ? 0.8 : 1,
          opacity: isHovering ? 0 : 1
        }}
        transition={{ duration: 0.15 }}
      />

      {/* Follower Ring */}
      <motion.div
        style={{
          position: 'fixed', left: 0, top: 0,
          width: 36, height: 36,
          border: '1.5px solid var(--accent)',
          borderRadius: '50%',
          x: ringX, y: ringY,
          translateX: '-50%', translateY: '-50%',
        }}
        animate={{
          scale: isHovering ? 2.5 : isClicked ? 0.8 : 1,
          scaleX: isText ? 3 : isHovering ? 2.5 : isClicked ? 0.8 : 1,
          scaleY: isText ? 0.1 : isHovering ? 2.5 : isClicked ? 0.8 : 1,
          background: isHovering ? 'rgba(203, 255, 0, 0.15)' : 'transparent',
          borderColor: isText ? 'transparent' : 'var(--accent)',
          backgroundColor: isText ? 'var(--accent)' : isHovering ? 'rgba(203, 255, 0, 0.15)' : 'transparent'
        }}
        transition={{ duration: 0.2 }}
      />
      
      <style>{`
        body, a, button, input, textarea { cursor: none !important; }
        @media (pointer: coarse) {
          body, a, button, input, textarea { cursor: auto !important; }
        }
      `}</style>
    </div>
  )
}
