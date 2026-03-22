import type { Request, Response, NextFunction } from 'express'
import express from 'express'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { Types } from 'mongoose'
import { Url } from '../models/Url'
import { Click } from '../models/Click'
import { requireAuth } from '../middleware/auth'
import { ok, fail } from '../utils/response'
import { getRedisClient } from '../config/redis'
import axios from 'axios'
import { scrapeOG } from '../utils/ogScraper'
import { fireWebhook } from '../utils/webhook'
import { requirePermission } from '../middleware/apiKeyAuth'

const router = express.Router()

const targetingSchema = z.object({
  mobile: z.string().url('Invalid mobile URL format').optional().nullable(),
  tablet: z.string().url('Invalid tablet URL format').optional().nullable(),
  countries: z.array(z.object({
    code: z.string().length(2, 'Country code must be 2 characters (ISO)'),
    url: z.string().url('Invalid country URL format')
  })).max(5, 'Maximum 5 country rules allowed').optional()
}).optional()

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
  targeting: targetingSchema,
  clickGoal: z.number().int().positive().max(1000000).optional().nullable()
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
  tags: z.array(z.string()).max(5).optional(),
  targeting: targetingSchema,
  note: z.string().max(500, 'Note too long (max 500 chars)').optional(),
  webhookUrl: z.string().url('Invalid webhook URL format').nullable().optional(),
  webhookSecret: z.string().max(100, 'Secret too long').nullable().optional(),
  clickGoal: z.number().int().positive().max(1000000).optional().nullable()
}).refine(data => {
  return data.originalUrl || data.expiresAt || data.linkPassword !== undefined || 
         data.tags !== undefined || data.targeting !== undefined || data.note !== undefined ||
         data.webhookUrl !== undefined || data.webhookSecret !== undefined || data.clickGoal !== undefined
}, {
  message: 'At least one field must be provided for update'
})

// Helpers
const getBaseUrl = () => process.env.BASE_URL || 'http://localhost:4001'

/**
 * @route GET /api/urls/preview?url=...
 */
router.get('/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const url = req.query.url as string
    if (!url) return fail(res, 400, 'URL required', 'URL_REQUIRED')
    try { new URL(url) } catch {
      return fail(res, 400, 'Invalid URL', 'INVALID_URL')
    }
    const og = await scrapeOG(url)
    return ok(res, { og })
  } catch (err) {
    next(err)
  }
})

// Middleware
router.use(requireAuth)

const formatUrl = (url: any) => ({
  id: url._id.toString(),
  shortCode: url.shortCode,
  originalUrl: url.originalUrl,
  shortUrl: `${getBaseUrl()}/${url.shortCode}`,
  customAlias: url.customAlias || null,
  totalClicks: url.totalClicks || 0,
  realClicks: url.realClicks || 0,
  createdAt: url.createdAt,
  expiresAt: url.expiresAt,
  isActive: url.isActive,
  hasPassword: !!url.linkPassword,
  tags: url.tags || [],
  targeting: url.targeting || null,
  ogData: url.ogData || null,
  isPinned: !!url.isPinned,
  note: url.note || '',
  hasWebhook: !!url.webhookUrl,
  webhookUrl: url.webhookUrl || null,
  clickGoal: url.clickGoal || null,
  goalReachedAt: url.goalReachedAt || null,
  lastClickAt: url.lastClickAt || null
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
 * @route GET /api/urls/export
 */
router.get('/export', requirePermission('read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const urls = await Url.find({ userId, isActive: true }).sort({ createdAt: -1 })
    
    let csv = 'Short URL,Original URL,Clicks,Created At,Expires At,Tags,Note,Health,Status\n'
    
    for (const u of urls) {
      const shortUrl = `${getBaseUrl()}/${u.shortCode}`
      const created = u.createdAt.toISOString()
      const expires = u.expiresAt ? u.expiresAt.toISOString() : 'Never'
      const tags = (u.tags || []).join('; ')
      const note = (u.note || '').replace(/"/g, '""')
      const health = 'See Analytics'
      const status = u.isActive ? 'Active' : 'Archived'
      
      csv += `"${shortUrl}","${u.originalUrl}",${u.totalClicks},"${created}","${expires}","${tags}","${note}","${health}","${status}"\n`
    }
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=shrinkr-export-${new Date().toISOString().split('T')[0]}.csv`)
    return res.status(200).send(csv)
  } catch (err) {
    next(err)
  }
})

/**
 * @route POST /api/urls
 */
router.post('/', requirePermission('create'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createUrlSchema.safeParse(req.body)
    if (!parsed.success) {
      const err = parsed.error.issues[0]
      const code = err.message.includes('future') ? 'INVALID_EXPIRY' : 
                   err.message.includes('characters') ? 'INVALID_ALIAS' : 'VALIDATION_ERROR'
      return fail(res, 400, err.message, code, err.path[0] as string)
    }

    const { originalUrl, customAlias, expiresAt, linkPassword, targeting, clickGoal } = parsed.data
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
      targeting: targeting || undefined,
      clickGoal: clickGoal || null,
      isActive: true
    })

    // Background scrape OG data
    setImmediate(async () => {
      try {
        const og = await scrapeOG(originalUrl)
        await Url.findByIdAndUpdate(url._id, { ogData: og })
      } catch {}
    })

    return ok(res, { url: formatUrl(url) }, 'URL shortened successfully', 201)
  } catch (err) {
    next(err)
  }
})

/**
 * @route GET /api/urls
 */
router.get('/', requirePermission('read'), async (req: Request, res: Response, next: NextFunction) => {
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
      Url.find(query).sort({ isPinned: -1, ...sortOption }).skip(skip).limit(limit).lean(),
      Url.countDocuments(query)
    ])

    // Get sparkline data for these URLs
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const sparklines = await Click.aggregate([
      { $match: { urlId: { $in: items.map(i => i._id) }, timestamp: { $gte: sevenDaysAgo } } },
      { $group: {
        _id: { urlId: '$urlId', date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } } },
        count: { $sum: 1 }
      }}
    ])

    const formattedUrls = items.map(u => {
      const base = formatUrl(u)
      const sparkline = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const found = sparklines.find(s => s._id.urlId.toString() === u._id.toString() && s._id.date === dateStr)
        sparkline.push(found ? found.count : 0)
      }
      return { ...base, sparkline }
    })

    return ok(res, {
      urls: formattedUrls,
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
router.patch('/:shortCode', requirePermission('update'), async (req: Request, res: Response, next: NextFunction) => {
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

    if (parsed.data.targeting !== undefined) {
      url.targeting = parsed.data.targeting || undefined
    }

    if (parsed.data.note !== undefined) {
      url.note = parsed.data.note || ''
    }

    if (parsed.data.webhookUrl !== undefined) {
      url.webhookUrl = parsed.data.webhookUrl || null
    }

    if (parsed.data.webhookSecret !== undefined) {
      url.webhookSecret = parsed.data.webhookSecret || null
    }

    if (parsed.data.clickGoal !== undefined) {
      url.clickGoal = parsed.data.clickGoal || null
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
 * @route DELETE /api/urls
 * @desc Bulk delete links
 */
router.delete('/', requirePermission('delete'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shortCodes } = req.body
    if (!shortCodes || !Array.isArray(shortCodes)) {
      return fail(res, 400, 'shortCodes must be an array', 'VALIDATION_ERROR')
    }
    if (shortCodes.length > 50) return fail(res, 400, 'Max 50 items allowed', 'TOO_MANY_ITEMS')

    const userId = req.user!.id
    
    await Url.updateMany(
      { 
        shortCode: { $in: shortCodes },
        userId: userId
      },
      { $set: { isActive: false } }
    )

    // Delete from Redis
    try {
      const redis = await getRedisClient()
      await Promise.all(shortCodes.map(code => redis.del(`url:${code}`)))
    } catch {}

    return ok(res, { 
      deleted: shortCodes.length,
      message: `${shortCodes.length} links deleted successfully` 
    })
  } catch (err) {
    next(err)
  }
})

/**
 * @route DELETE /api/urls/:shortCode
 */
router.delete('/:shortCode', requirePermission('delete'), async (req: Request, res: Response, next: NextFunction) => {
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

/**
 * @route GET /api/urls/:shortCode/health
 */
router.get('/:shortCode/health', requirePermission('read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shortCode } = req.params
    const userId = req.user!.id
    
    const url = await Url.findOne({ shortCode, userId, isActive: true }).select('originalUrl').lean()
    if (!url) return fail(res, 404, 'URL not found', 'URL_NOT_FOUND')
    
    const startTime = Date.now()
    try {
      const response = await axios.head(url.originalUrl, { 
        timeout: 5000, 
        validateStatus: () => true,
        headers: { 'User-Agent': 'Shrinkr-Health-Monitor/1.0' }
      })
      const responseTime = Date.now() - startTime
      const isHealthy = response.status < 400 || response.status === 405

      return ok(res, {
        status: response.status,
        healthy: isHealthy,
        responseTime,
        checkedAt: new Date()
      })
    } catch (err: any) {
      return ok(res, {
        healthy: false,
        error: "URL unreachable",
        checkedAt: new Date()
      })
    }
  } catch (err) {
    next(err)
  }
})

/**
 * @route PATCH /api/urls/:shortCode/pin
 */
router.patch('/:shortCode/pin', requirePermission('update'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shortCode } = req.params
    const userId = req.user!.id
    
    const url = await Url.findOne({ shortCode, userId })
    if (!url) return fail(res, 404, 'Not found', 'URL_NOT_FOUND')
    
    url.isPinned = !url.isPinned
    await url.save()
    
    return ok(res, { 
      url: { shortCode, isPinned: url.isPinned },
      message: url.isPinned ? 'Link pinned' : 'Link unpinned'
    })
  } catch (err) {
    next(err)
  }
})

/**
 * @route POST /api/urls/:shortCode/webhook/test
 */
router.post('/:shortCode/webhook/test', requirePermission('update'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shortCode } = req.params
    const userId = req.user!.id
    
    const url = await Url.findOne({ shortCode, userId, isActive: true })
    if (!url) return fail(res, 404, 'URL not found', 'URL_NOT_FOUND')
    if (!url.webhookUrl) return fail(res, 400, 'Webhook URL not set', 'WEBHOOK_NOT_SET')
    
    // We send a real request to the URL to test it
    try {
      const payload = {
        event: 'test',
        shortCode,
        message: 'This is a test webhook from Shrinkr',
        timestamp: new Date().toISOString()
      }
      
      const body = JSON.stringify(payload)
      // Use fireWebhook logic but keep track of status
      const headers: any = {
        'Content-Type': 'application/json',
        'User-Agent': 'Shrinkr-Webhook-Test/1.0',
        'X-Shrinkr-Event': 'test',
        'X-Shrinkr-Timestamp': Date.now().toString(),
      }

      if (url.webhookSecret) {
        const sig = require('crypto')
          .createHmac('sha256', url.webhookSecret)
          .update(body)
          .digest('hex')
        headers['X-Shrinkr-Signature'] = `sha256=${sig}`
      }

      const response = await axios.post(url.webhookUrl, payload, { 
        headers, 
        timeout: 5000,
        validateStatus: () => true 
      })
      
      return ok(res, { 
        delivered: response.status < 400, 
        status: response.status 
      })
    } catch (err: any) {
      return ok(res, { 
        delivered: false, 
        error: err.message || 'Connection failed' 
      })
    }
  } catch (err) {
    next(err)
  }
})

export default router
