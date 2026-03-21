import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type NotifType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: string
  type: NotifType
  title: string
  message: string
  time: Date
  read: boolean
  link?: string // optional route to navigate to
}

interface NotifContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (n: Omit<Notification, 'id' | 'time' | 'read'>) => void
  markAllRead: () => void
  markRead: (id: string) => void
  clearAll: () => void
}

const NotifContext = createContext<NotifContextType | null>(null)

const MAX_NOTIFS = 20

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([
    // seed a welcome notification
    {
      id: 'welcome',
      type: 'info',
      title: 'Welcome to ZURL',
      message: 'Create your first short link to get started!',
      time: new Date(),
      read: false,
    }
  ])

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'time' | 'read'>) => {
    const newNotif: Notification = {
      ...n,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      time: new Date(),
      read: false,
    }
    setNotifications(prev => [newNotif, ...prev].slice(0, MAX_NOTIFS))
  }, [])

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotifContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, markRead, clearAll }}>
      {children}
    </NotifContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotifContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider')
  return ctx
}
