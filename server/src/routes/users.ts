import type { Request, Response, NextFunction } from 'express'
import express from 'express'
import { z } from 'zod'
import { User } from '../models/User'
import { requireAuth } from '../middleware/auth'
import { ok, fail } from '../utils/response'
import mongoose from 'mongoose'

const router = express.Router()
router.use(requireAuth)

// ─── GET /api/users/me ─────────────────────────────────────────────────────────
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id)
      .select('-passwordHash')
      .populate({
        path: 'bioLinks.urlId',
        select: 'shortCode originalUrl ogData totalClicks isActive',
        match: { isActive: true }
      })
      .lean()
    if (!user) return fail(res, 404, 'User not found', 'NOT_FOUND')

    // Enrich bioLinks with populated data
    const bioLinks = (user.bioLinks || []).map((bl: any) => ({
      _id:            bl._id?.toString() || bl.urlId?._id?.toString() || '',
      urlId:          bl.urlId?._id?.toString() || bl.urlId?.toString() || '',
      shortCode:      bl.urlId?.shortCode || '',
      originalUrl:    bl.urlId?.originalUrl || '',
      customTitle:    bl.customTitle || '',
      showClickCount: bl.showClickCount ?? true,
      totalClicks:    bl.urlId?.totalClicks || 0,
      order:          bl.order ?? 0
    })).filter((bl: any) => bl.shortCode) // drop unpopulated (inactive/deleted)

    return ok(res, {
      id:             (user._id as any).toString(),
      email:          user.email,
      name:           user.name   || '',
      avatar:         user.avatar || '',
      bio:            user.bio    || '',
      createdAt:      user.createdAt,
      // Bio page fields
      username:       user.username       || '',
      bioName:        user.bioName        || '',
      bioDescription: user.bioDescription || '',
      bioAvatar:      user.bioAvatar      || '',
      bioTheme:       user.bioTheme       || 'dark',
      twoFactorEnabled: !!user.twoFactorEnabled,
      bioLinks,
    })
  } catch (err) { next(err) }
})

// ─── GET /api/users/me/stats ──────────────────────────────────────────────────
router.get('/me/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { Url } = await import('../models/Url')
    const userId = req.user!.id
    
    // Convert string ID to Mongoose ObjectId for aggregation
    const oid = new mongoose.Types.ObjectId(userId)

    const [totalLinks, clickData] = await Promise.all([
      Url.countDocuments({ userId }),
      Url.aggregate([
        { $match: { userId: oid } },
        { $group: { _id: null, totalClicks: { $sum: '$totalClicks' } } }
      ])
    ])

    return ok(res, {
      stats: {
        totalLinks,
        totalClicks: clickData[0]?.totalClicks || 0
      }
    })
  } catch (err) { next(err) }
})

// ─── PATCH /api/users/me ───────────────────────────────────────────────────────
const profileSchema = z.object({
  name:   z.string().max(60).optional(),
  bio:    z.string().max(200).optional(),
  avatar: z.string().max(2_000_000).optional(), // base64 can be large
})

router.patch('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = profileSchema.safeParse(req.body)
    if (!parsed.success) {
      return fail(res, 400, parsed.error.issues[0].message, 'VALIDATION_ERROR')
    }

    const { name, bio, avatar } = parsed.data
    const update: Record<string, string> = {}
    if (name   !== undefined) update.name   = name
    if (bio    !== undefined) update.bio    = bio
    if (avatar !== undefined) update.avatar = avatar

    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { $set: update },
      { new: true, select: '-passwordHash' }
    ).lean()

    if (!user) return fail(res, 404, 'User not found', 'NOT_FOUND')
    return ok(res, {
      id:     user._id.toString(),
      email:  user.email,
      name:   user.name  || '',
      avatar: user.avatar || '',
      bio:    user.bio   || '',
    })
  } catch (err) { next(err) }
})

// ─── PATCH /api/users/me/password ─────────────────────────────────────────────
const pwSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

router.patch('/me/password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = pwSchema.safeParse(req.body)
    if (!parsed.success) {
      return fail(res, 400, parsed.error.issues[0].message, 'VALIDATION_ERROR')
    }

    const user = await User.findById(req.user!.id)
    if (!user) return fail(res, 404, 'User not found', 'NOT_FOUND')

    const ok2 = await user.comparePassword(parsed.data.currentPassword)
    if (!ok2) return fail(res, 400, 'Current password is incorrect', 'WRONG_PASSWORD')

    user.passwordHash = parsed.data.newPassword   // pre-save hook bcrypts it
    await user.save()

    return ok(res, { message: 'Password updated successfully' })
  } catch (err) { next(err) }
})

export default router
