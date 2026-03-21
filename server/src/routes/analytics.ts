import type { Request, Response, NextFunction } from 'express'
import express from 'express'
import { Click } from '../models/Click'
import { Url } from '../models/Url'
import { requireAuth } from '../middleware/auth'
import { ok, fail } from '../utils/response'

const router = express.Router()

/**
 * @route GET /api/analytics/:shortCode/public
 * Public stats — no auth required
 */
router.get('/:shortCode/public', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shortCode } = req.params
    const url = await Url.findOne({ shortCode }).select('_id totalClicks createdAt originalUrl shortCode').lean()
    if (!url) return fail(res, 404, 'URL not found', 'URL_NOT_FOUND')

    const [lastClick, topDevices] = await Promise.all([
      Click.findOne({ urlId: url._id }).sort({ timestamp: -1 }).select('timestamp').lean(),
      Click.aggregate([
        { $match: { urlId: url._id } },
        { $group: { _id: '$device', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 3 }
      ])
    ])

    const baseUrl = process.env.BASE_URL || 'http://localhost:4001'

    return ok(res, {
      totalClicks: url.totalClicks,
      lastVisited: lastClick?.timestamp || null,
      createdAt: url.createdAt,
      shortUrl: `${baseUrl}/${url.shortCode}`,
      originalUrl: url.originalUrl,
      topDevices
    })
  } catch (err) {
    next(err)
  }
})

/**
 * @route GET /api/analytics/:shortCode/export
 * Download all click data as CSV — MUST be before /:shortCode wildcard
 */
router.get('/:shortCode/export', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shortCode } = req.params
    const userId = req.user!.id

    const url = await Url.findOne({ shortCode }).lean()
    if (!url) return fail(res, 404, 'URL not found', 'URL_NOT_FOUND')

    if (url.userId.toString() !== userId) {
      return fail(res, 403, 'You do not have permission to export this data', 'FORBIDDEN')
    }

    const clicks = await Click.find({ urlId: url._id }).sort({ timestamp: -1 }).lean()

    // Build CSV with a metadata header so spreadsheets open cleanly
    const baseUrl = process.env.BASE_URL || 'http://localhost:4001'
    const lines: string[] = []
    lines.push(`# Zurl Click Export — /${shortCode}`)
    lines.push(`# Original URL: ${url.originalUrl}`)
    lines.push(`# Short URL: ${baseUrl}/${shortCode}`)
    lines.push(`# Total Clicks: ${clicks.length}`)
    lines.push(`# Exported: ${new Date().toISOString()}`)
    lines.push('')                                     // blank separator
    lines.push('timestamp,ip,country,device,browser,referrer')

    for (const c of clicks) {
      const escape = (v: string) => `"${(v || '').replace(/"/g, '""')}"`
      lines.push([
        c.timestamp.toISOString(),
        escape(c.ip || ''),
        escape(c.country || 'Unknown'),
        escape(c.device || 'Desktop'),
        escape(c.browser || 'Unknown'),
        escape(c.referrer || ''),
      ].join(','))
    }

    const csv = lines.join('\r\n') + '\r\n'

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="zurl-clicks-${shortCode}.csv"`)
    res.setHeader('Cache-Control', 'no-store')
    return res.send(csv)
  } catch (err) {
    next(err)
  }
})

/**
 * @route GET /api/analytics/:shortCode
 * Full analytics for the link owner
 */
router.get('/:shortCode', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shortCode } = req.params
    const userId = req.user!.id

    const url = await Url.findOne({ shortCode }).lean()
    if (!url) return fail(res, 404, 'URL not found', 'URL_NOT_FOUND')

    if (url.userId.toString() !== userId) {
      return fail(res, 403, 'You do not have permission to view this data', 'FORBIDDEN')
    }

    const days = req.query.days === '30' ? 30 : 7
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const [realClicks, botClicks, clicksByDay, topDevices, topCountries, topBrowsers, recentClicks, clicksByHour, clicksByDayOfWeek, topReferrers, referrerMediums] = await Promise.all([
      Click.countDocuments({ urlId: url._id, isBot: false }),
      Click.countDocuments({ urlId: url._id, isBot: true }),
      Click.aggregate([
        { $match: { urlId: url._id, timestamp: { $gte: startDate }, isBot: false } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]),
      Click.aggregate([
        { $match: { urlId: url._id, isBot: false } },
        { $group: { _id: '$device', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 }
      ]),
      Click.aggregate([
        { $match: { urlId: url._id, isBot: false } },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 }
      ]),
      Click.aggregate([
        { $match: { urlId: url._id, isBot: false } },
        { $group: { _id: '$browser', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 }
      ]),
      Click.find({ urlId: url._id })
        .sort({ timestamp: -1 })
        .limit(50)
        .lean(),
      Click.aggregate([
        { $match: { urlId: url._id, isBot: false } },
        { $group: { _id: { $hour: '$timestamp' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Click.aggregate([
        { $match: { urlId: url._id, isBot: false } },
        { $group: { _id: { $dayOfWeek: '$timestamp' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Click.aggregate([
        { $match: { urlId: url._id, isBot: false } },
        { $group: { _id: '$referrerSource', count: { $sum: 1 }, medium: { $first: '$referrerMedium' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Click.aggregate([
        { $match: { urlId: url._id, isBot: false } },
        { $group: { _id: '$referrerMedium', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ])

    // Fill exactly N days (including days with 0 clicks)
    const clicksTrend = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const found = clicksByDay.find(c => c._id === dateStr)
      clicksTrend.push({ date: dateStr, count: found ? found.count : 0 })
    }

    // Format Heatmap Data
    const hourData = Array.from({ length: 24 }, (_, h) => {
      const found = clicksByHour.find(c => c._id === h)
      return { hour: h, count: found?.count || 0 }
    })

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayData = Array.from({ length: 7 }, (_, d) => {
      const found = clicksByDayOfWeek.find(c => c._id === d + 1)
      return { day: dayNames[d], count: found?.count || 0 }
    })

    return ok(res, {
      shortCode:      url.shortCode,
      originalUrl:    url.originalUrl,
      totalClicks:    url.totalClicks,
      realClicks,
      botClicks,
      lastVisited:    recentClicks.find(c => !c.isBot)?.timestamp || null,
      createdAt:      url.createdAt,
      ogData:         url.ogData || null,
      clicksTrend,
      topDevices,
      topCountries,
      topBrowsers,
      topReferrers,
      referrerMediums,
      hourData,
      dayData,
      recentClicks
    })
  } catch (err) {
    next(err)
  }
})

export default router
