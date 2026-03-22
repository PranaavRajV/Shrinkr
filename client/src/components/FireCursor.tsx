import { useEffect, useRef } from 'react'

export default function FireCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<any[]>([])
  const mouse = useRef({ x: 0, y: 0 })
  const frameId = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let currentAccent = '#ffe0c2'
    const updateAccent = () => {
      // Create a dummy element to compute actual resolved CSS variable color for Canvas API
      const el = document.createElement('div')
      el.style.color = 'var(--accent)'
      el.style.display = 'none'
      document.body.appendChild(el)
      const computedColor = getComputedStyle(el).color
      if (computedColor && computedColor !== 'rgba(0, 0, 0, 0)') {
        currentAccent = computedColor
      }
      document.body.removeChild(el)
    }
    updateAccent()
    // Re-check just in case theme changes
    const observer = new MutationObserver(updateAccent)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] })

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const mouseMove = (e: MouseEvent) => {
      const dx = e.clientX - mouse.current.x
      const dy = e.clientY - mouse.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY

      // Optimization: Limit max particles created per move
      const count = Math.min(Math.floor(distance / 8) + 1, 5)
      for (let i = 0; i < count; i++) {
        if (particles.current.length < 150) { // Global cap for performance
           particles.current.push(new Particle(mouse.current.x, mouse.current.y))
        }
      }
    }

    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      life: number
      maxLife: number
      color: string

      constructor(x: number, y: number) {
        this.x = x
        this.y = y
        this.size = Math.random() * 2 + 1
        this.speedX = (Math.random() - 0.5) * 1.5
        this.speedY = (Math.random() - 0.7) * 2
        this.maxLife = Math.random() * 15 + 15
        this.life = this.maxLife
        this.color = currentAccent
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY
        this.life--
        if (this.size > 0.2) this.size -= 0.05
        this.speedY -= 0.02
      }

      draw() {
        if (!ctx) return
        const opacity = this.life / this.maxLife
        ctx.fillStyle = this.color
        ctx.globalAlpha = opacity * 0.6
        // Optimization: Removed shadowBlur (CPU killer)
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Optimization: Reversed loop for safer splicing and speed
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i]
        p.update()
        p.draw()
        if (p.life <= 0) {
          particles.current.splice(i, 1)
        }
      }
      ctx.globalAlpha = 1
      frameId.current = requestAnimationFrame(animate)
    }

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', mouseMove)
    resize()
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', mouseMove)
      cancelAnimationFrame(frameId.current)
      observer.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1000000,
        mixBlendMode: 'screen', opacity: 0.8
      }}
    />
  )
}
