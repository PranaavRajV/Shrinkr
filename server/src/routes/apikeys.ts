import type { Request, Response, NextFunction } from 'express'
import express from 'express'
import crypto from 'crypto'
import { z } from 'zod'
import { ApiKey } from '../models/ApiKey'
import { requireAuth } from '../middleware/auth'
import { ok, fail } from '../utils/response'

const router = express.Router()

router.use(requireAuth)

const createKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  permissions: z.object({
    create: z.boolean().default(true),
    read: z.boolean().default(true),
    update: z.boolean().default(true),
    delete: z.boolean().default(false)
  }).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  rateLimit: z.number().int().min(10).max(10000).default(100)
})

/**
 * @route POST /api/apikeys
 * @desc Create a new API key
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createKeySchema.safeParse(req.body)
    if (!parsed.success) {
      return fail(res, 400, parsed.error.issues[0].message, 'VALIDATION_ERROR')
    }

    const userId = req.user!.id
    const keyCount = await ApiKey.countDocuments({ userId, isActive: true })
    if (keyCount >= 10) {
      return fail(res, 400, 'Maximum 10 active API keys allowed', 'KEY_LIMIT_REACHED')
    }

    const { name, permissions, expiresAt, rateLimit } = parsed.data
    
    // Generate raw key
    const rawKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex')
    const keyPrefix = rawKey.substring(0, 12) + '...'

    const apiKey = await ApiKey.create({
      userId,
      name,
      key: hashedKey,
      keyPrefix,
      permissions: permissions || { create: true, read: true, update: true, delete: false },
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      rateLimit: rateLimit || 100
    })

    return ok(res, {
      key: rawKey, // ONLY TIME RETURNED
      keyPrefix: apiKey.keyPrefix,
      name: apiKey.name,
      permissions: apiKey.permissions,
      createdAt: apiKey.createdAt,
      message: 'Save this key — it will not be shown again'
    }, 'API key generated successfully', 201)
  } catch (err) {
    next(err)
  }
})

/**
 * @route GET /api/apikeys
 * @desc List all User API keys
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keys = await ApiKey.find({ userId: req.user!.id })
      .select('-key') // NEVER RETURN HASHED KEY
      .sort({ createdAt: -1 })
    return ok(res, { keys })
  } catch (err) {
    next(err)
  }
})

/**
 * @route DELETE /api/apikeys/:keyId
 * @desc Revoke an API key
 */
router.delete('/:keyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyId } = req.params
    const apiKey = await ApiKey.findOneAndUpdate(
      { _id: keyId, userId: req.user!.id },
      { isActive: false },
      { new: true }
    )
    if (!apiKey) return fail(res, 404, 'API Key not found', 'KEY_NOT_FOUND')
    return ok(res, { message: 'API key revoked' })
  } catch (err) {
    next(err)
  }
})

/**
 * @route PATCH /api/apikeys/:keyId
 */
router.patch('/:keyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyId } = req.params
    const { name, permissions, isActive } = req.body
    
    const update: any = {}
    if (name !== undefined) update.name = name
    if (permissions !== undefined) update.permissions = permissions
    if (isActive !== undefined) update.isActive = isActive

    const apiKey = await ApiKey.findOneAndUpdate(
      { _id: keyId, userId: req.user!.id },
      update,
      { new: true }
    )
    
    if (!apiKey) return fail(res, 404, 'API Key not found', 'KEY_NOT_FOUND')
    return ok(res, { apiKey })
  } catch (err) {
    next(err)
  }
})

export default router
