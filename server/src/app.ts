import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import mongoose from 'mongoose'
import responseTime from 'response-time'
import { ZodError } from 'zod'

import { getRedisClient } from './config/redis'
import { Click } from './models/Click'
import { Url } from './models/Url'
import { parseUserAgent } from './utils/deviceParser'
import { fail } from './utils/response'
import { renderErrorPage } from './utils/errorPage'

import authRoutes from './routes/auth'
import urlRoutes from './routes/urls'
import analyticsRoutes from './routes/analytics'
import userRoutes from './routes/users'

const app = express()

// 1. Request Logger Middleware
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const elapsed = Date.now() - start
    const color = res.statusCode < 400 ? '\x1b[32m' : '\x1b[31m'
    console.log(`${color}${req.method}\x1b[0m ${req.path} ${res.statusCode} ${elapsed}ms`)
  })
  next()
})

// 2. Security & Optimization
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json({ limit: '5mb' }))
app.use(responseTime())

// 3. API Routes
app.use('/api/auth', authRoutes)
app.use('/api/urls', urlRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/users', userRoutes)

// 4. Root & Health
app.get('/health', (_req, res) => res.json({ success: true, message: 'Shrinkr API Running' }))
app.get('/', (_req, res) => res.json({ success: true, message: 'Shrinkr API Running' }))

// 5. Redirect Route (Hardened)
app.get('/:shortCode', async (req, res, next) => {
  try {
    const { shortCode } = req.params

    // 0. Validate format BEFORE DB lookup
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(shortCode)) {
      return res.status(400).send(renderErrorPage(400, 'Invalid short code format', 'INVALID_SHORT_CODE'))
    }

    // 1. Redis Cache Check
    try {
      const redis = await getRedisClient()
      const cachedUrl = await redis.get(`url:${shortCode}`)
      if (cachedUrl) {
        console.log('cache:hit', shortCode)
        updateAnalytics(shortCode, req)
        return res.redirect(301, cachedUrl)
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
      const code = !url ? 'URL_NOT_FOUND' : 'URL_INACTIVE'
      const status = !url ? 404 : 410
      const msg = !url ? 'Link not found' : 'The link you are looking for is no longer active'
      return res.status(status).send(renderErrorPage(status, msg, code))
    }

    // 3. Expiry Check
    if (url.expiresAt && url.expiresAt < new Date()) {
      return res.status(410).send(renderErrorPage(410, 'This link has expired and is no longer available', 'URL_EXPIRED'))
    }

    // 4. Populate Cache (fire-and-forget)
    getRedisClient().then(redis => {
      redis.set(`url:${shortCode}`, url.originalUrl, 'EX', 86400)
    }).catch(() => {})

    // 5. Track Click (fire-and-forget)
    updateAnalytics(shortCode, req, url._id.toString())

    return res.redirect(301, url.originalUrl)
  } catch (err) {
    next(err)
  }
})

// 5. Analytics Tracker (Non-blocking)
function updateAnalytics(shortCode: string, req: express.Request, urlId?: string) {
  setImmediate(async () => {
    try {
      const actualUrlId = urlId || (await Url.findOne({ 
        $or: [{ shortCode }, { customAlias: shortCode }] 
      }).select('_id'))?._id.toString()
      
      if (!actualUrlId) return

      await Url.findByIdAndUpdate(actualUrlId, { $inc: { totalClicks: 1 } })
      
      const userAgent = req.headers['user-agent'] || ''
      const { device, browser } = parseUserAgent(userAgent)
      
      await Click.create({
        urlId: actualUrlId,
        timestamp: new Date(),
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip,
        userAgent,
        device,
        browser,
        referrer: req.headers['referer'] || ''
      })
    } catch (e) {
      console.error('Analytics failed:', e)
    }
  })
}

// 6. 404 Handler
app.use((req, res) => {
  fail(res, 404, `Route ${req.method} ${req.path} not found`, 'ROUTE_NOT_FOUND')
})

// 8. Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
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
})

// DB Connection
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shrinkr'
mongoose.connect(uri)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB failed:', err))

export default app
