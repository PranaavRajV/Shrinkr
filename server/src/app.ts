import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import mongoose from 'mongoose'
import responseTime from 'response-time'
import { ZodError } from 'zod'
import path from 'path'

import { getRedisClient } from './config/redis'
import { Click } from './models/Click'
import { Url } from './models/Url'
import { parseUserAgent } from './utils/deviceParser'
import { fail } from './utils/response'
import { renderErrorPage } from './utils/errorPage'
import { renderPasswordPage } from './utils/passwordPage'
import { detectBot } from './utils/botDetector'
import { fireWebhook } from './utils/webhook'

import authRoutes from './routes/auth'
import urlRoutes from './routes/urls'
import analyticsRoutes from './routes/analytics'
import userRoutes from './routes/users'
import statsRouter from './routes/stats'
import bioRoutes from './routes/bio'
import apiKeyRoutes from './routes/apikeys'
import twoFactorRoutes from './routes/twoFactor'
import docsRoutes from './routes/docs'
import aiRoutes from './routes/ai'
import { parseReferrer } from './utils/referrerParser'

const app = express()

// 1. Request Logger Middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.length <= 10) {
    const start = Date.now()
    res.on('finish', () => {
      const elapsed = Date.now() - start
      const color = res.statusCode < 400 ? '\x1b[32m' : '\x1b[31m'
      console.log(`${color}${req.method}\x1b[0m ${req.path} ${res.statusCode} ${elapsed}ms`)
    })
  }
  next()
})

// 2. Security & Optimization
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for Render/External assets compatibility
  crossOriginResourcePolicy: false
}))
app.use(cors({
  origin: true, // Allow all origins in production for simpler redirection
  credentials: true
}))
app.use(express.json({ limit: '5mb' }))
app.use(responseTime())

// Static files for client build
const clientPath = path.join(__dirname, '../../client/dist')
app.use(express.static(clientPath))

// 3. API Routes
app.use('/api/auth/2fa', twoFactorRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/urls', urlRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/users', userRoutes)
app.use('/api/stats', statsRouter)
app.use('/api/bio', bioRoutes)
app.use('/api/apikeys', apiKeyRoutes)
app.use('/api/docs', docsRoutes)
app.use('/api/ai', aiRoutes)

// 4. Root & Health
app.get('/health', async (_req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'up' : 'down'
  let redisStatus = 'down'
  try {
    const redis = await getRedisClient()
    const pong = await redis.ping()
    if (pong === 'PONG') redisStatus = 'up'
  } catch {}

  const status = (mongoStatus === 'up' && redisStatus === 'up') ? 200 : 503
  res.status(status).json({
    success: status === 200,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      mongodb: mongoStatus,
      redis: redisStatus
    }
  })
})

// 5. Redirect Route (Hardened)
app.get('/:shortCode', async (req, res, next) => {
  try {
    const { shortCode } = req.params

    // If it looks like a file extension or an asset, don't try to redirect
    if (shortCode.includes('.') || ['assets', 'vite', 'favicon'].includes(shortCode)) {
      return next()
    }

    // 0. Validate format BEFORE DB lookup
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(shortCode)) {
      return next() // Pass to frontend static or 404
    }

    // 1. Redis Cache Check
    try {
      const redis = await getRedisClient()
      const cachedUrl = await redis.get(`url:${shortCode}`)
      if (cachedUrl) {
        console.log('cache:hit', shortCode)
        updateAnalytics(shortCode, req)
        return res.redirect(302, cachedUrl)
      }
    } catch (e) {
      console.warn('Redis error:', e)
    }

    console.log('cache:miss', shortCode)

    // 2. DB Lookup
    const url = await Url.findOne({ 
      $or: [{ shortCode }, { customAlias: shortCode }]
    })

    if (!url || !url.isActive) {
      if (!url) return next() // Not a shortcode, pass to frontend
      return res.status(410).send(renderErrorPage(410, 'The link you are looking for is no longer active', 'URL_INACTIVE'))
    }

    // ─── NEW: Password Check ──────────────────────────────────────────────────
    if (url.linkPassword) {
      const providedPwd = req.query.pwd as string
      if (!providedPwd) {
        return res.status(200).send(renderPasswordPage(shortCode))
      }
      if (providedPwd !== url.linkPassword) {
        return res.status(200).send(renderPasswordPage(shortCode, 'INCORRECT KEY'))
      }
    }
    // ──────────────────────────────────────────────────────────────────────────

    // 3. Expiry Check
    if (url.expiresAt && url.expiresAt < new Date()) {
      return res.status(410).send(renderErrorPage(410, 'This link has expired and is no longer available', 'URL_EXPIRED'))
    }

    // ─── NEW: Targeting Check ──────────────────────────────────────────────────
    if (url.targeting) {
      const userAgent = req.headers['user-agent'] || ''
      const { device } = parseUserAgent(userAgent)
      
      // 1. Device Targeting
      if (device === 'mobile' && url.targeting.mobile) {
        updateAnalytics(shortCode, req, url._id.toString())
        return res.redirect(302, url.targeting.mobile)
      }
      if (device === 'tablet' && url.targeting.tablet) {
        updateAnalytics(shortCode, req, url._id.toString())
        return res.redirect(302, url.targeting.tablet)
      }

      // 2. Country Targeting
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || ''
      const countryCode = ipToCountry(ip)
      if (countryCode && url.targeting.countries && url.targeting.countries.length > 0) {
        const countryTarget = url.targeting.countries.find((c: any) => c.code.toUpperCase() === countryCode.toUpperCase())
        if (countryTarget) {
          updateAnalytics(shortCode, req, url._id.toString())
          return res.redirect(302, countryTarget.url)
        }
      }
    }
    // ──────────────────────────────────────────────────────────────────────────

    // 4. Populate Cache (fire-and-forget) - ONLY IF NO PASSWORD AND NO TARGETING
    if (!url.linkPassword && !url.targeting) {
      getRedisClient().then(redis => {
        redis.set(`url:${shortCode}`, url.originalUrl, 'EX', 86400)
      }).catch(() => {})
    }

    // 5. Track Click (fire-and-forget)
    updateAnalytics(shortCode, req, url._id.toString())

    return res.redirect(302, url.originalUrl)
  } catch (err) {
    next(err)
  }
})

import { ipToCountry } from './utils/geoip'

// Analytics Tracker (Non-blocking)
function updateAnalytics(shortCode: string, req: express.Request, urlId?: string) {
  setImmediate(async () => {
    try {
      const actualUrlId = urlId || (await Url.findOne({ 
        $or: [{ shortCode }, { customAlias: shortCode }] 
      }).select('_id'))?._id.toString()
      
      
      if (!actualUrlId) return

      const userAgent = req.headers['user-agent'] || ''
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || ''
      const referrer = req.headers['referer'] || ''
      
      const botResult = detectBot(userAgent, ip, referrer)
      
      // USER SAID: totalClicks: (count of ALL clicks including bots)
      const inc: any = { totalClicks: 1 }
      if (!botResult.isBot) inc.realClicks = 1
      
      const updatedUrl = await Url.findByIdAndUpdate(actualUrlId, { 
        $inc: inc,
        $set: { lastClickAt: new Date() }
      }, { new: true })
      
      if (
        updatedUrl &&
        updatedUrl.clickGoal &&
        !updatedUrl.goalReachedAt &&
        updatedUrl.totalClicks >= updatedUrl.clickGoal
      ) {
        await Url.findByIdAndUpdate(actualUrlId, {
          goalReachedAt: new Date()
        })
      }

      const { device, browser } = parseUserAgent(userAgent)
      const country = ipToCountry(ip) || 'Unknown'
      const ref = parseReferrer(referrer)
      
      await Click.create({
        urlId: actualUrlId,
        timestamp: new Date(),
        ip,
        userAgent,
        country,
        device,
        browser,
        referrer,
        referrerSource: ref.source,
        referrerMedium: ref.medium,
        isBot: botResult.isBot,
        botReason: botResult.reason
      })

      // FIRE WEBHOOK (Feature 1 Tier 2)
      const urlData = updatedUrl
      if (urlData?.webhookUrl) {
        try {
          await fireWebhook(
            urlData.webhookUrl,
            urlData.webhookSecret,
            {
              event: 'click',
              shortCode: urlData.shortCode,
              shortUrl: `${process.env.BASE_URL}/${urlData.shortCode}`,
              originalUrl: urlData.originalUrl,
              timestamp: new Date().toISOString(),
              click: {
                country: country || 'Unknown',
                device,
                browser,
                referrer: referrer || '',
                ip,
                userAgent,
              }
            }
          )
        } catch (webhookErr) {
          console.error('Webhook trigger failed:', webhookErr)
        }
      }
    } catch (e) {
      console.error('Analytics failed:', e)
    }
  })
}

// 6. SPA Catch-all (Redirect all other routes to frontend)
// Using app.use as a final fallback for Express 5 compatibility
app.use((req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'))
})

// 8. Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (req.path.startsWith('/api')) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)
    
    if (err instanceof ZodError) {
      const firstError = err.issues[0]
      return fail(res, 400, firstError.message, 'VALIDATION_ERROR', firstError.path[0] as string)
    }

    if (err.name === 'ValidationError') return fail(res, 400, err.message, 'VALIDATION_ERROR')
    if (err.name === 'CastError') return fail(res, 400, 'Invalid ID format', 'INVALID_ID')
    if (err.code === 11000) return fail(res, 409, 'Duplicate entry found', 'DUPLICATE')

    const status = err.status || err.statusCode || 500
    return fail(res, status, err.message || 'Internal server error', err.code || 'SERVER_ERROR')
  }
  
  // For non-API routes, show a generic error page
  res.status(500).send(renderErrorPage(500, 'Something went wrong while processing your request', 'INTERNAL_SERVER_ERROR'))
})

// DB Connection
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shrinkr'
mongoose.connect(uri)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB failed:', err))

export default app
