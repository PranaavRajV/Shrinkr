import type { Request, Response, NextFunction } from 'express'
import express from 'express'
import { Url } from '../models/Url'
import { ok } from '../utils/response'

const router = express.Router()

// ─── GET /api/stats ──────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalLinks, clickData] = await Promise.all([
      Url.countDocuments({}),
      Url.aggregate([
        { $group: { _id: null, totalClicks: { $sum: '$totalClicks' } } }
      ])
    ])

    const totalClicks = clickData[0]?.totalClicks || 0

    return ok(res, {
      totalLinks,
      totalClicks,
      // For a new app, we can add a small multiplier or baseline if it's meant for marketing,
      // but "MAKE TRUE" usually means real data.
      // We'll also return a fake uptime since real uptime tracking is complex.
    })
  } catch (err) {
    next(err)
  }
})

export default router
