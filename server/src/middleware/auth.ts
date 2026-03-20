import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/User'
import { fail } from '../utils/response'

export interface AuthUser {
  id: string
  email: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return fail(res, 401, 'No authorization header provided', 'NO_TOKEN')
    }

    if (!authHeader.startsWith('Bearer ')) {
      return fail(res, 401, 'Invalid token format. Use Bearer {token}', 'INVALID_TOKEN_FORMAT')
    }

    const token = authHeader.split(' ')[1]
    const secret = process.env.JWT_ACCESS_SECRET

    if (!secret) {
      console.error('JWT_ACCESS_SECRET is missing from environment')
      return fail(res, 500, 'Internal server configuration error', 'SERVER_ERROR')
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, secret)
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return fail(res, 401, 'Token has expired', 'TOKEN_EXPIRED')
      }
      return fail(res, 401, 'Invalid or tampered token', 'INVALID_TOKEN')
    }

    if (!decoded.sub) {
      return fail(res, 401, 'Invalid token payload', 'INVALID_TOKEN')
    }

    const user = await User.findById(decoded.sub).select('_id email').lean()
    if (!user) {
      return fail(res, 401, 'User associated with this token no longer exists', 'USER_NOT_FOUND')
    }

    req.user = {
      id: user._id.toString(),
      email: user.email
    }

    next()
  } catch (err) {
    next(err)
  }
}
