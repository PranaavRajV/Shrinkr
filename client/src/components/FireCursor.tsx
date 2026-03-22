import { useEffect, useRef } from 'react'

export default function FireCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<any[]>([])
  const mouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

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

      // More sparks when moving faster
      const count = Math.min(Math.floor(distance / 5) + 1, 8)
      for (let i = 0; i < count; i++) {
        particles.current.push(new Particle(mouse.current.x, mouse.current.y))
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
        this.size = Math.random() * 2.5 + 1.2
        this.speedX = (Math.random() - 0.5) * 1.8
        this.speedY = (Math.random() - 0.8) * 2.2 // Drift upwards
        this.maxLife = Math.random() * 20 + 20
        this.life = this.maxLife
        this.color = '#CBFF00'
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY
        this.life--
        if (this.size > 0.1) this.size -= 0.06
        this.speedY -= 0.03 // Heat rising
      }

      draw() {
        if (!ctx) return
        const opacity = this.life / this.maxLife
        const flicker = Math.random() * 0.3 + 0.7 // Slight flicker
        ctx.fillStyle = this.color
        ctx.globalAlpha = opacity * flicker * 0.8
        ctx.shadowBlur = 15
        ctx.shadowColor = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      for (let i = 0; i < particles.current.length; i++) {
        particles.current[i].update()
        particles.current[i].draw()
        if (particles.current[i].life <= 0) {
          particles.current.splice(i, 1)
          i--
        }
      }
      requestAnimationFrame(animate)
    }

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', mouseMove)
    resize()
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', mouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1000000,
        mixBlendMode: 'screen'
      }}
    />
  )
}
