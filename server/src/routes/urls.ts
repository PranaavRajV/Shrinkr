import type { Request, Response, NextFunction } from 'express'
import express from 'express'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { Types } from 'mongoose'
import { Url } from '../models/Url'
import { requireAuth } from '../middleware/auth'
import { ok, fail } from '../utils/response'
import { getRedisClient } from '../config/redis'

const router = express.Router()

// Validation Schemas
const createUrlSchema = z.object({
  originalUrl: z.string().url('Invalid URL format'),
  customAlias: z.string()
    .min(3, 'Alias must be at least 3 characters')
    .max(30, 'Alias too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Alias contains invalid characters')
    .optional(),
  expiresAt: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg)
    return arg
  }, z.date().min(new Date(), 'Expiry date must be in the future').optional()),
  linkPassword: z.string().max(50).optional().nullable(),
  tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed').optional(),
})

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  tag: z.string().optional(),
  sort: z.enum(['clicks', 'expiry', 'createdAt']).default('createdAt')
})

const updateUrlSchema = z.object({
  originalUrl: z.string().url('Invalid URL format').optional(),
  expiresAt: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg)
    return arg
  }, z.date().min(new Date(), 'Expiry date must be in the future').optional()),
  linkPassword: z.string().max(50).nullable().optional(),
  tags: z.array(z.string()).max(5).optional()
}).refine(data => data.originalUrl || data.expiresAt || data.linkPassword !== undefined || data.tags !== undefined, {
  message: 'At least one field must be provided for update'
})

// Middleware
router.use(requireAuth)

// Helpers
const getBaseUrl = () => process.env.BASE_URL || 'http://localhost:4001'

const formatUrl = (url: any) => ({
  id: url._id.toString(),
  shortCode: url.shortCode,
  originalUrl: url.originalUrl,
  shortUrl: `${getBaseUrl()}/${url.shortCode}`,
  totalClicks: url.totalClicks || 0,
  createdAt: url.createdAt,
  expiresAt: url.expiresAt,
  isActive: url.isActive,
  hasPassword: !!url.linkPassword,
  tags: url.tags || []
})

/**
 * @route GET /api/urls/check-alias
 */
router.get('/check-alias', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alias = req.query.alias as string
    if (!alias) return ok(res, { available: false })

    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(alias)) {
      return fail(res, 400, 'Invalid alias format', 'INVALID_ALIAS')
    }

    const existing = await Url.findOne({ 
      $or: [{ shortCode: alias }, { customAlias: alias }] 
    }).select('_id').lean()

    return ok(res, { available: !existing })
  } catch (err) {
    next(err)
  }
})

/**
 * @route POST /api/urls
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createUrlSchema.safeParse(req.body)
    if (!parsed.success) {
      const err = parsed.error.issues[0]
      const code = err.message.includes('future') ? 'INVALID_EXPIRY' : 
                   err.message.includes('characters') ? 'INVALID_ALIAS' : 'VALIDATION_ERROR'
      return fail(res, 400, err.message, code, err.path[0] as string)
    }

    const { originalUrl, customAlias, expiresAt, linkPassword } = parsed.data
    let { tags } = parsed.data
    
    if (tags && Array.isArray(tags)) {
      tags = tags
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0)
        .slice(0, 5)
    } else {
      tags = []
    }
    const userId = req.user!.id

    if (customAlias) {
      const existing = await Url.findOne({ 
        $or: [{ shortCode: customAlias }, { customAlias }] 
      }).select('_id').lean()
      if (existing) return fail(res, 409, 'This alias is already taken', 'ALIAS_TAKEN', 'customAlias')
    }

    const shortCode = customAlias || nanoid(7)

    const url = await Url.create({
      userId,
      originalUrl,
      shortCode,
      customAlias,
      expiresAt,
      linkPassword: linkPassword || null,
      tags: tags || [],
      isActive: true
    })

    return ok(res, { url: formatUrl(url) }, 'URL shortened successfully', 201)
  } catch (err) {
    next(err)
  }
})

/**
 * @route GET /api/urls
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = paginationSchema.safeParse(req.query)
    if (!parsed.success) {
      return fail(res, 400, 'Invalid pagination or sorting parameters', 'INVALID_PAGINATION')
    }

    const { page, limit, search, tag, sort } = parsed.data
    const skip = (page - 1) * limit
    const userId = req.user!.id
 
    const query: any = { userId, isActive: true }
    if (tag) query.tags = tag
    if (search) {
      query.$or = [
        { originalUrl: { $regex: search, $options: 'i' } },
        { shortCode: { $regex: search, $options: 'i' } }
      ]
    }

    let sortOption: any = { createdAt: -1 }
    if (sort === 'clicks') sortOption = { totalClicks: -1 }
    if (sort === 'expiry') sortOption = { expiresAt: 1 }

    const [items, total] = await Promise.all([
      Url.find(query).sort(sortOption).skip(skip).limit(limit).lean(),
      Url.countDocuments(query)
    ])

    return ok(res, {
      urls: items.map(formatUrl),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    })
  } catch (err) {
    next(err)
  }
})

/**
 * @route PATCH /api/urls/:shortCode
 */
router.patch('/:shortCode', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shortCode } = req.params
    const userId = req.user!.id

    const parsed = updateUrlSchema.safeParse(req.body)
    if (!parsed.success) {
       const err = parsed.error.issues[0]
       return fail(res, 400, err.message, 'VALIDATION_ERROR', err.path[0] as string)
    }

    const url = await Url.findOne({ shortCode })
    if (!url || !url.isActive) return fail(res, 404, 'URL not found', 'URL_NOT_FOUND')
    
    if (url.userId.toString() !== userId) {
      return fail(res, 403, 'You do not have permission to edit this link', 'FORBIDDEN')
    }

    if (parsed.data.originalUrl) url.originalUrl = parsed.data.originalUrl
    if (parsed.data.expiresAt) url.expiresAt = parsed.data.expiresAt
    
    if (parsed.data.linkPassword !== undefined) {
      url.linkPassword = parsed.data.linkPassword || null
    }
    
    if (parsed.data.tags !== undefined) {
      url.tags = parsed.data.tags
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0)
        .slice(0, 5)
    }

    await url.save()

    // Clear cache
    try {
      const redis = await getRedisClient()
      await redis.del(`url:${shortCode}`)
    } catch {}

    return ok(res, { url: formatUrl(url) }, 'URL updated successfully')
  } catch (err) {
    next(err)
  }
})

/**
 * @route DELETE /api/urls/:shortCode
 */
router.delete('/:shortCode', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shortCode } = req.params
    const userId = req.user!.id

    const url = await Url.findOne({ shortCode })
    if (!url || !url.isActive) return fail(res, 404, 'URL not found or already deleted', 'URL_NOT_FOUND')

    if (url.userId.toString() !== userId) {
      return fail(res, 403, 'You do not have permission to delete this link', 'FORBIDDEN')
    }

    url.isActive = false
    await url.save()

    // Clear cache
    try {
      const redis = await getRedisClient()
      await redis.del(`url:${shortCode}`)
    } catch {}

    return ok(res, { message: 'Link deleted successfully' })
  } catch (err) {
    next(err)
  }
})

/**
 * @route POST /api/urls/bulk
 */
router.post('/bulk', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { urls } = req.body
    if (!urls || !Array.isArray(urls)) {
      return fail(res, 400, 'A valid urls array is required', 'VALIDATION_ERROR')
    }

    if (urls.length === 0) return fail(res, 400, 'URLs array cannot be empty', 'EMPTY_ARRAY')
    if (urls.length > 50) return fail(res, 400, 'Maximum 50 URLs allowed per bulk request', 'TOO_MANY_URLS')

    const userId = req.user!.id
    
    const results = await Promise.allSettled(urls.map(async (u: any) => {
      const parsed = createUrlSchema.safeParse(u)
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0].message)
      }

      if (parsed.data.customAlias) {
        const existing = await Url.findOne({ 
           $or: [{ shortCode: parsed.data.customAlias }, { customAlias: parsed.data.customAlias }] 
        }).select('_id').lean()
        if (existing) throw new Error('Alias already taken')
      }

      const shortCode = parsed.data.customAlias || nanoid(7)
      const url = await Url.create({
        userId,
        originalUrl: parsed.data.originalUrl,
        shortCode,
        customAlias: parsed.data.customAlias,
        isActive: true
      })

      return { 
        success: true, 
        shortCode: url.shortCode, 
        shortUrl: `${getBaseUrl()}/${url.shortCode}`,
        originalUrl: url.originalUrl 
      }
    }))

    const finalResults = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value
      return { 
        success: false, 
        error: (r as PromiseRejectedResult).reason.message, 
        originalUrl: urls[i].originalUrl 
      }
    })

    return ok(res, { results: finalResults })
  } catch (err) {
    next(err)
  }
})

export default router
