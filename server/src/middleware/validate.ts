import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'

type Source = 'body' | 'query' | 'params'

function pickTarget(req: Request, source: Source): unknown {
  if (source === 'body') return req.body
  if (source === 'query') return req.query
  return req.params
}

export function validate(source: Source, schema: z.ZodTypeAny) {
  return function (req: Request, res: Response, next: NextFunction) {
    const target = pickTarget(req, source)
    const result = schema.safeParse(target)

    if (!result.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: result.error.flatten(),
      })
    }

    if (source === 'body') req.body = result.data
    if (source === 'query') req.query = result.data as Request['query']
    if (source === 'params') req.params = result.data as Request['params']

    return next()
  }
}

export function validateBody(schema: z.ZodTypeAny) {
  return validate('body', schema)
}

export function validateQuery(schema: z.ZodTypeAny) {
  return validate('query', schema)
}

export function validateParams(schema: z.ZodTypeAny) {
  return validate('params', schema)
}

