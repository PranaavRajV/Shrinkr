import type { Request, Response, NextFunction } from 'express'
import express from 'express'
import { z } from 'zod'
import { User } from '../models/User'
import { Url } from '../models/Url'
import { requireAuth } from '../middleware/auth'
import { ok, fail } from '../utils/response'

const router = express.Router()

// Validation Schemas
const usernameSchema = z.string().regex(/^[a-zA-Z0-9_]{3,20}$/, 'Invalid username format').lowercase()

const bioSettingsSchema = z.object({
  username: usernameSchema.optional(),
  bioName: z.string().max(60).optional(),
  bioDescription: z.string().max(160).optional(),
  bioAvatar: z.string().optional(),
  bioTheme: z.enum(['dark', 'light', 'accent']).optional()
})

const bioLinksSchema = z.object({
  links: z.array(z.object({
    urlId: z.string(),
    order: z.number().int().default(0),
    showClickCount: z.boolean().default(true),
    customTitle: z.string().max(100).optional()
  }))
})

/**
 * @route GET /api/bio/:username
 * @desc Get public bio page data
 */
router.get('/:username', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.params.username as string
    const user = await User.findOne({ username: username.toLowerCase() })
      .populate({
        path: 'bioLinks.urlId',
        match: { isActive: true } // Only include active links
      })
      .lean()

    if (!user) {
      return fail(res, 404, 'User bio not found', 'BIO_NOT_FOUND')
    }

    // Filter out expired or null (unpopulated) links and sort by order
    const now = new Date()
    const validLinks = (user.bioLinks || [])
      .filter((bl: any) => {
        const url = bl.urlId
        if (!url) return false
        if (url.expiresAt && new Date(url.expiresAt) < now) return false
        return true
      })
      .sort((a: any, b: any) => a.order - b.order)
      .map((bl: any) => ({
        shortCode: bl.urlId.shortCode,
        shortUrl: `${process.env.BASE_URL}/${bl.urlId.shortCode}`,
        originalUrl: bl.urlId.originalUrl,
        customTitle: bl.customTitle || bl.urlId.ogData?.title || '',
        ogData: bl.urlId.ogData,
        totalClicks: bl.urlId.totalClicks,
        showClickCount: bl.showClickCount,
        order: bl.order
      }))

    return ok(res, {
      profile: {
        username: user.username,
        bioName: user.bioName || user.name,
        bioDescription: user.bioDescription,
        bioAvatar: user.bioAvatar || user.avatar,
        bioTheme: user.bioTheme
      },
      links: validLinks
    })
  } catch (err) {
    next(err)
  }
})

/**
 * @route GET /api/bio/check/:username
 * @desc Check if username is available
 */
router.get('/check/:username', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.params.username as string
    const existing = await User.findOne({ username: username.toLowerCase() }).select('_id')
    return ok(res, { available: !existing })
  } catch (err) {
    next(err)
  }
})

/**
 * @route PUT /api/bio/settings
 * @desc Update bio profile settings (Protected)
 */
router.put('/settings', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = bioSettingsSchema.safeParse(req.body)
    if (!parsed.success) {
      return fail(res, 400, parsed.error.issues[0].message, 'VALIDATION_ERROR')
    }

    const userId = req.user!.id
    const user = await User.findById(userId)
    if (!user) return fail(res, 404, 'User not found', 'USER_NOT_FOUND')

    const { username, bioName, bioDescription, bioAvatar, bioTheme } = parsed.data

    if (username && username !== user.username) {
      const exists = await User.findOne({ username, _id: { $ne: userId } })
      if (exists) return fail(res, 409, 'Username already taken', 'USERNAME_TAKEN')
      user.username = username
    }

    if (bioName !== undefined) user.bioName = bioName
    if (bioDescription !== undefined) user.bioDescription = bioDescription
    if (bioAvatar !== undefined) user.bioAvatar = bioAvatar
    if (bioTheme !== undefined) user.bioTheme = bioTheme

    await user.save()

    return ok(res, {
      profile: {
        username: user.username,
        bioName: user.bioName,
        bioDescription: user.bioDescription,
        bioAvatar: user.bioAvatar,
        bioTheme: user.bioTheme
      }
    })
  } catch (err) {
    next(err)
  }
})

/**
 * @route PUT /api/bio/links
 * @desc Replace entire bioLinks array (Protected)
 */
router.put('/links', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = bioLinksSchema.safeParse(req.body)
    if (!parsed.success) {
      return fail(res, 400, parsed.error.issues[0].message, 'VALIDATION_ERROR')
    }

    const userId = req.user!.id
    const { links } = parsed.data

    // Validate all urlIds belong to user
    const urlIds = links.map(l => l.urlId)
    const validUrlCount = await Url.countDocuments({ _id: { $in: urlIds }, userId })
    if (validUrlCount !== links.length) {
      return fail(res, 403, 'One or more URLs do not belong to you or do not exist', 'UNAUTHORIZED')
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { bioLinks: links },
      { new: true }
    )

    return ok(res, { links: user?.bioLinks })
  } catch (err) {
    next(err)
  }
})

/**
 * @route POST /api/bio/links/:urlId
 * @desc Add a URL to bio links (Protected)
 */
router.post('/links/:urlId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { urlId } = req.params
    const userId = req.user!.id

    const url = await Url.findOne({ _id: urlId, userId })
    if (!url) return fail(res, 404, 'URL not found or unauthorized', 'URL_NOT_FOUND')

    const user = await User.findById(userId)
    if (!user) return fail(res, 404, 'User not found', 'USER_NOT_FOUND')

    const exists = user.bioLinks?.some(bl => bl.urlId.toString() === urlId)
    if (!exists) {
      user.bioLinks?.push({
        urlId: url._id,
        order: (user.bioLinks?.length || 0),
        showClickCount: true,
        customTitle: url.ogData?.title || ''
      })
      await user.save()
    }

    return ok(res, { links: user.bioLinks })
  } catch (err) {
    next(err)
  }
})

/**
 * @route DELETE /api/bio/links/:urlId
 * @desc Remove URL from bio links (Protected)
 */
router.delete('/links/:urlId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { urlId } = req.params
    const userId = req.user!.id

    const user = await User.findById(userId)
    if (!user) return fail(res, 404, 'User not found', 'USER_NOT_FOUND')

    user.bioLinks = user.bioLinks?.filter(bl => bl.urlId.toString() !== urlId)
    await user.save()

    return ok(res, { links: user.bioLinks })
  } catch (err) {
    next(err)
  }
})

export default router
