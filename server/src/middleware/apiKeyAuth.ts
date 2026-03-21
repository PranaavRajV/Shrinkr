import type { NextFunction, Request, Response } from 'express'
import crypto from 'crypto'
import { ApiKey } from '../models/ApiKey'
import { User } from '../models/User'
import { fail } from '../utils/response'
import { getRedisClient } from '../config/redis'

/**
 * API Key Authentication Middleware
 */
export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const rawKey = (req.headers['x-api-key'] as string) || (req.query.api_key as string)
    
    if (!rawKey) return next() // Fallback to JWT auth if no key provided

    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex')
    const apiKey = await ApiKey.findOne({ key: hashedKey, isActive: true })

    if (!apiKey) {
      return fail(res, 403, 'Invalid or inactive API key', 'INVALID_API_KEY')
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return fail(res, 403, 'API key has expired', 'API_KEY_EXPIRED')
    }

    // Rate Limiting
    const redis = await getRedisClient()
    const rateLimitKey = `ratelimit:apikey:${apiKey._id}`
    const currentUsage = await redis.incr(rateLimitKey)
    if (currentUsage === 1) await redis.expire(rateLimitKey, 3600)

    if (currentUsage > apiKey.rateLimit) {
      return fail(res, 429, 'API key rate limit exceeded', 'RATE_LIMIT_EXCEEDED')
    }

    const user = await User.findById(apiKey.userId).select('_id email').lean()
    if (!user) {
      return fail(res, 403, 'User associated with this API key not found', 'USER_NOT_FOUND')
    }

    // Update usage stats (async/non-blocking)
    setImmediate(async () => {
      await ApiKey.findByIdAndUpdate(apiKey._id, {
        $set: { lastUsed: new Date() },
        $inc: { usageCount: 1 }
      })
    })

    req.user = {
      id: user._id.toString(),
      email: user.email
    }
    req.apiKey = apiKey

    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Granular Permission Guard
 */
export const requirePermission = (permission: 'create' | 'read' | 'update' | 'delete') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.apiKey) {
      if (!req.apiKey.permissions[permission]) {
        return fail(res, 403, `API key lacks '${permission}' permission`, 'INSUFFICIENT_PERMISSIONS')
      }
    }
    next()
  }
}
