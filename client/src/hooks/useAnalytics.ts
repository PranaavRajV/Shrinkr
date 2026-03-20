import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'

import api from '../lib/api'

export type ClicksLast7DaysPoint = { date: string; count: number }

export type AnalyticsResponse = {
  shortCode: string
  originalUrl: string
  createdAt: string
  totalClicks: number
  lastVisited: string | null
  clicksLast7Days: ClicksLast7DaysPoint[]
  topCountries: Array<{ _id: string; count: number }>
  topDevices: Array<{ _id: string; count: number }>
  recentClicks: Array<{
    timestamp: string
    country?: string
    device?: string
    browser?: string
  }>
}

export function useAnalytics() {
  const [loading, setLoading] = useState(false)

  const getAnalytics = useCallback(async (shortCode: string) => {
    setLoading(true)
    try {
      const res = await api.get(`/api/analytics/${encodeURIComponent(shortCode)}`)
      return res.data as AnalyticsResponse
    } catch (e) {
      toast.error('Failed to load analytics')
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, getAnalytics }
}
