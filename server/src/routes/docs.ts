import type { Request, Response } from 'express'
import express from 'express'
import { ok } from '../utils/response'

const router = express.Router()

/**
 * @route GET /api/docs
 * @desc Public API Documentation
 */
router.get('/', (_req: Request, res: Response) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:4001'
  
  const docs = {
    version: '1.0',
    baseUrl,
    authentication: {
      jwt: 'Authorization: Bearer <token>',
      apiKey: 'X-API-Key: <key>'
    },
    endpoints: [
      {
        method: 'POST',
        path: '/api/urls',
        description: 'Create a short URL',
        auth: true,
        permission: 'create',
        body: { originalUrl: 'string', customAlias: 'string?', expiresAt: 'ISO8601?' },
        response: { success: true, url: { shortCode: 'string', shortUrl: 'string' } }
      },
      {
        method: 'GET',
        path: '/api/urls',
        description: 'List user URLs with pagination',
        auth: true,
        permission: 'read',
        params: { page: 'number?', limit: 'number?', search: 'string?', tag: 'string?' }
      },
      {
        method: 'GET',
        path: '/api/analytics/:shortCode',
        description: 'Get detailed analytics for a URL',
        auth: true,
        permission: 'read'
      },
      {
        method: 'GET',
        path: '/api/bio/:username',
        description: 'Get public bio page data',
        auth: false
      }
    ]
  }

  return ok(res, docs)
})

export default router
