import type { Request, Response, NextFunction } from 'express'
import express from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { createHash } from 'crypto'
import { User } from '../models/User'
import { getRedisClient } from '../config/redis'
import { ok, fail } from '../utils/response'

const router = express.Router()

// VALIDATION SCHEMAS
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[0-9]/, 'Password must contain at least one number')
})

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
})

// HELPERS
const signAccessToken = (id: string, email: string) => {
  return jwt.sign(
    { sub: id, email },
    process.env.JWT_ACCESS_SECRET || 'secret',
    { expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as any }
  )
}

const signRefreshToken = (id: string, email: string) => {
  return jwt.sign(
    { sub: id, email },
    process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    { expiresIn: (process.env.JWT_REFRESH_EXPIRY || '7d') as any }
  )
}

// ROUTE HANDLERS

/**
 * @route POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return fail(res, 400, 'Empty request body', 'VALIDATION_ERROR')
    }

    const { email, password } = req.body

    // Manual field checks for strict prompt compliance
    if (!email) return fail(res, 400, 'Email is required', 'VALIDATION_ERROR', 'email')
    
    // Zod validation
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      const err = parsed.error.issues[0]
      const code = err.message.includes('Password') ? 'WEAK_PASSWORD' : 'VALIDATION_ERROR'
      return fail(res, 400, err.message, code, err.path[0] as string)
    }

    const normEmail = email.toLowerCase().trim()
    const existing = await User.findOne({ email: normEmail }).select('_id').lean()
    if (existing) return fail(res, 409, 'Email already registered', 'EMAIL_EXISTS')

    const user = await User.create({ email: normEmail, passwordHash: password })
    
    const accessToken = signAccessToken(user._id.toString(), user.email)
    const refreshToken = signRefreshToken(user._id.toString(), user.email)

    return ok(res, {
      user: { id: user._id.toString(), email: user.email, createdAt: user.createdAt },
      accessToken,
      refreshToken
    }, 'User created successfully', 201)
  } catch (err) {
    next(err)
  }
})

/**
 * @route POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return fail(res, 400, 'Invalid fields provided', 'VALIDATION_ERROR')
    }

    const normEmail = req.body.email.toLowerCase().trim()
    const user = await User.findOne({ email: normEmail })
    
    if (!user) {
      return fail(res, 401, 'Invalid login credentials', 'INVALID_CREDENTIALS')
    }

    const isMatch = await user.comparePassword(req.body.password)
    if (!isMatch) {
      return fail(res, 401, 'Invalid login credentials', 'INVALID_CREDENTIALS')
    }

    const accessToken = signAccessToken(user._id.toString(), user.email)
    const refreshToken = signRefreshToken(user._id.toString(), user.email)

    return ok(res, {
      user: { id: user._id.toString(), email: user.email },
      accessToken,
      refreshToken
    }, 'Logged in successfully')
  } catch (err) {
    next(err)
  }
})

/**
 * @route POST /api/auth/refresh
 */
router.post('/refresh', async (req: Request, res: Response, next) => {
  try {
    const { refreshToken: token } = req.body
    if (!token) {
      return fail(res, 400, 'Refresh token is required', 'TOKEN_REQUIRED')
    }

    const secret = process.env.JWT_REFRESH_SECRET || 'refresh-secret'
    
    // 1. Blacklist Check (Redis optional - skip if unavailable)
    try {
      const tokenHash = createHash('sha256').update(token).digest('hex')
      const redis = await getRedisClient()
      const blacklisted = await redis.get(`refresh:blacklist:${tokenHash}`)
      if (blacklisted) {
        return fail(res, 401, 'Token has been revoked', 'TOKEN_REVOKED')
      }
    } catch (_redisErr) {
      console.warn('[Refresh] Redis unavailable, skipping blacklist check')
    }

    // 2. JWT Verify
    try {
      const decoded = jwt.verify(token, secret) as any
      const accessToken = signAccessToken(decoded.sub, decoded.email)
      return ok(res, { accessToken })
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return fail(res, 401, 'Refresh token has expired', 'TOKEN_EXPIRED')
      }
      return fail(res, 401, 'Invalid refresh token', 'INVALID_TOKEN')
    }
  } catch (err) {
    next(err)
  }
})

import { OAuth2Client } from 'google-auth-library'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

/**
 * @route POST /api/auth/google
 */
router.post('/google', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken } = req.body
    if (!idToken) return fail(res, 400, 'ID Token is required', 'TOKEN_REQUIRED')

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    if (!payload || !payload.email) {
      return fail(res, 400, 'Invalid ID Token', 'INVALID_TOKEN')
    }

    const { email, name, picture, sub: googleId } = payload
    const normEmail = email.toLowerCase().trim()

    let user = await User.findOne({ 
      $or: [{ googleId }, { email: normEmail }] 
    })

    if (!user) {
      user = await User.create({
        email: normEmail,
        googleId,
        name: name || '',
        avatar: picture || ''
      })
    } else if (!user.googleId) {
      // Link existing email account to google
      user.googleId = googleId
      if (!user.name) user.name = name || ''
      if (!user.avatar) user.avatar = picture || ''
      await user.save()
    }

    const accessToken = signAccessToken(user._id.toString(), user.email)
    const refreshToken = signRefreshToken(user._id.toString(), user.email)

    return ok(res, {
      user: { id: user._id.toString(), email: user.email, name: user.name, avatar: user.avatar },
      accessToken,
      refreshToken
    }, 'Google login successful')
  } catch (err) {
    next(err)
  }
})

/**
 * @route POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response, next) => {
  try {
    const token = req.body.refreshToken
    if (!token) return ok(res, { message: 'Already logged out' })

    const secret = process.env.JWT_REFRESH_SECRET || 'refresh-secret'
    
    try {
      const decoded = jwt.verify(token, secret) as any
      const exp = decoded.exp
      const now = Math.floor(Date.now() / 1000)
      const ttl = Math.max(0, exp - now)

      if (ttl > 0) {
        const tokenHash = createHash('sha256').update(token).digest('hex')
        const redis = await getRedisClient()
        await redis.set(`refresh:blacklist:${tokenHash}`, '1', 'EX', ttl)
      }
    } catch (e) {
      // Token already invalid or expired, no need to blacklist
    }

    return ok(res, { message: 'Logged out successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
