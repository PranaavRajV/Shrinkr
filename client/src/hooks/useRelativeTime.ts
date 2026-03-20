import { useState, useEffect } from 'react'

export function useRelativeTime(date: Date | string | null): string {
  const [relativeTime, setRelativeTime] = useState('')

  useEffect(() => {
    if (!date) return setRelativeTime('NEVER')

    const update = () => {
      const d = (typeof date === 'string' ? new Date(date) : date).getTime()
      const now = Date.now()
      const diff = Math.floor((now - d) / 1000)

      if (diff < 1) return setRelativeTime('JUST NOW')
      if (diff < 60) return setRelativeTime(`${diff} SEC AGO`)
      if (diff < 3600) return setRelativeTime(`${Math.floor(diff / 60)} MIN AGO`)
      if (diff < 86400) return setRelativeTime(`${Math.floor(diff / 3600)} HRS AGO`)
      if (diff < 172800) return setRelativeTime('YESTERDAY')
      
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
      setRelativeTime(new Date(d).toLocaleDateString([], options).toUpperCase())
    }

    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [date])

  return relativeTime
}
