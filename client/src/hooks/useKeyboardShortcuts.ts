import { useEffect } from 'react'

type ShortcutHandlers = {
  n?: () => void
  slash?: () => void
  esc?: () => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape' && handlers.esc) {
          handlers.esc()
        }
        return
      }

      switch (e.key) {
        case 'n':
        case 'N':
          if (handlers.n) handlers.n()
          break
        case '/':
          if (handlers.slash) {
            e.preventDefault()
            handlers.slash()
          }
          break
        case 'Escape':
          if (handlers.esc) handlers.esc()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
