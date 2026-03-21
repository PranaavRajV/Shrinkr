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

import authRoutes from './routes/auth'
import urlRoutes from './routes/urls'
import analyticsRoutes from './routes/analytics'
import userRoutes from './routes/users'
import statsRouter from './routes/stats'

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
app.use('/api/auth', authRoutes)
app.use('/api/urls', urlRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/users', userRoutes)
app.use('/api/stats', statsRouter)

// 4. Root & Health
app.get('/health', (_req, res) => res.json({ success: true, message: 'Shrinkr API Running' }))

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

    return res.redirect(302, url.originalUrl)
  } catch (err) {
    next(err)
  }
})

// Analytics Tracker (Non-blocking)
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
