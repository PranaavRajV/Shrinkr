import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'

import api from '../lib/api'

export type UrlItem = {
  _id: string
  shortCode: string
  customAlias?: string | null
  originalUrl: string
  title?: string | null
  userId: string
  expiresAt?: string | null
  isActive: boolean
  totalClicks: number
  clicksLast7Days: number[]
  createdAt: string
  updatedAt: string
}

export type UrlCreateInput = {
  originalUrl: string
  customAlias?: string
  expiresAt?: string | Date
}

export function useUrls() {
  const [loading, setLoading] = useState(false)

  const createUrl = useCallback(
    async (input: UrlCreateInput) => {
      setLoading(true)
      try {
        const res = await api.post('/api/urls', input)
        toast.success('Short URL created')
        return res.data?.url as UrlItem
      } catch (e) {
        toast.error('Failed to create short URL')
        throw e
      } finally {
        setLoading(false)
      }
    },
    [setLoading],
  )

  const createBulkUrls = useCallback(
    async (input: UrlCreateInput[]) => {
      setLoading(true)
      try {
        const res = await api.post('/api/urls/bulk', input)
        return res.data as { results: any[] }
      } catch (e) {
        toast.error('Failed to process bulk URLs')
        throw e
      } finally {
        setLoading(false)
      }
    },
    [setLoading],
  )

  const listUrls = useCallback(
    async (page: number, limit: number) => {
      const res = await api.get('/api/urls', {
        params: { page, limit },
      })
      return res.data as {
        items: UrlItem[]
        page: number
        limit: number
        total: number
        totalPages: number
      }
    },
    [],
  )

  const deleteUrl = useCallback(async (shortCode: string) => {
    setLoading(true)
    try {
      const res = await api.delete(`/api/urls/${encodeURIComponent(shortCode)}`)
      toast.success('URL deleted')
      return res.data?.url as UrlItem
    } catch (e) {
      toast.error('Failed to delete URL')
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const updateUrl = useCallback(
    async (shortCode: string, patch: Partial<Pick<UrlCreateInput, 'originalUrl' | 'expiresAt'>>) => {
      setLoading(true)
      try {
        const res = await api.patch(`/api/urls/${encodeURIComponent(shortCode)}`, patch)
        toast.success('URL updated')
        return res.data?.url as UrlItem
      } catch (e) {
        toast.error('Failed to update URL')
        throw e
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  return { loading, createUrl, createBulkUrls, listUrls, deleteUrl, updateUrl }
}
