import type { Request, Response, NextFunction } from 'express'
import express from 'express'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { User } from '../models/User'
import { requireAuth } from '../middleware/auth'
import { ok, fail } from '../utils/response'
import { getRedisClient } from '../config/redis'

const router = express.Router()

/**
 * @route POST /api/auth/2fa/setup
 * @desc Generate 2FA secret and QR code
 */
router.post('/setup', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const user = await User.findById(userId)
    if (!user) return fail(res, 404, 'User not found', 'USER_NOT_FOUND')

    if (user.twoFactorEnabled) {
      return fail(res, 400, '2FA is already enabled', 'TWO_FACTOR_ALREADY_ENABLED')
    }

    const secret = speakeasy.generateSecret({
      name: `Shrinkr (${user.email})`,
      issuer: 'Shrinkr'
    })

    // Store secret in User document temporarily (bypass Redis for reliability)
    user.twoFactorSetupSecret = secret.base32
    await user.save()

    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url!)

    return ok(res, {
      secret: secret.base32,
      qrCode: qrDataUrl,
      manualEntry: secret.base32
    })
  } catch (err) {
    next(err)
  }
})

/**
 * @route POST /api/auth/2fa/verify-setup
 * @desc Verify and enable 2FA
 */
router.post('/verify-setup', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body
    if (!token) return fail(res, 400, 'Verification token required', 'TOKEN_REQUIRED')

    const userId = req.user!.id
    const user = await User.findById(userId)
    if (!user) return fail(res, 404, 'User not found', 'USER_NOT_FOUND')

    const secret = user.twoFactorSetupSecret
    if (!secret) {
      return fail(res, 400, '2FA setup session missing. Please restart setup.', 'SESSION_EXPIRED')
    }

    const valid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 3 // Lenient for setup time drift (+/- 90s)
    })

    if (!valid) {
      return fail(res, 400, 'Invalid verification code', 'INVALID_CODE')
    }

    // Generate backup codes
    const rawBackupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    )
    
    // Hash backup codes before saving
    const hashedBackupCodes = await Promise.all(
      rawBackupCodes.map(code => bcrypt.hash(code, 10))
    )

    user.twoFactorSecret = secret
    user.twoFactorEnabled = true
    user.twoFactorBackupCodes = hashedBackupCodes
    user.twoFactorSetupSecret = undefined // Clear the setup secret
    await user.save()

    return ok(res, {
      backupCodes: rawBackupCodes,
      message: '2FA enabled successfully. Please save your backup codes.'
    })
  } catch (err) {
    next(err)
  }
})

/**
 * @route POST /api/auth/2fa/disable
 * @desc Disable 2FA
 */
router.post('/disable', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body
    if (!token || !password) return fail(res, 400, 'Token and password required', 'REQUIRED_FIELDS')

    const userId = req.user!.id
    const user = await User.findById(userId)
    if (!user) return fail(res, 404, 'User not found', 'USER_NOT_FOUND')

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) return fail(res, 401, 'Incorrect password', 'INVALID_PASSWORD')

    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret!,
      encoding: 'base32',
      token,
      window: 3 // Lenient for time drift (+/- 90s)
    })

    if (!valid) return fail(res, 400, 'Invalid 2FA code', 'INVALID_CODE')

    user.twoFactorEnabled = false
    user.twoFactorSecret = undefined
    user.twoFactorBackupCodes = []
    await user.save()

    return ok(res, { message: '2FA disabled successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
