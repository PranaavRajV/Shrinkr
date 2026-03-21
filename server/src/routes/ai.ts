import { Router } from 'express'
import axios from 'axios'
import { requireAuth } from '../middleware/auth'
import { ok, fail } from '../utils/response'

const router = Router()

router.post('/suggest', requireAuth, async (req, res) => {
  try {
    const { url } = req.body

    if (!url) {
      return fail(res, 400, 'URL required', 'URL_REQUIRED')
    }

    try { 
      new URL(url.startsWith('http') ? url : `https://${url}`) 
    } catch {
      return fail(res, 400, 'Invalid URL', 'INVALID_URL')
    }

    if (!process.env.GROK_API_KEY || process.env.GROK_API_KEY === 'your_grok_api_key_here') {
      // Fallback for missing key - still better than failing 500 if we have a default strategy
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
        .replace('www.', '')
        .split('.')[0]
        .slice(0, 10)
      const rand = Date.now().toString(36).slice(-4)
      return ok(res, {
        suggestions: [
          `${domain}-link`,
          `${domain}-${rand}`,
          `go-${domain}`
        ]
      })
    }

    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: 'grok-beta',
        max_tokens: 100,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: `You are a URL shortener assistant. 
Your job is to suggest short, memorable, 
relevant alias codes for URLs.
Always respond with ONLY a valid JSON array 
of exactly 3 strings.
No explanation. No markdown. No backticks.
Just the raw JSON array.
Example: ["react-docs","fb-react","react-github"]`
          },
          {
            role: 'user',
            content: `Suggest 3 short alias codes for:
${url}

Rules:
- Each alias: 3-25 characters
- Only: lowercase letters, numbers, hyphens
- Make them descriptive and relevant to the URL
- No generic names like "link1" or "myurl"
- No special characters except hyphens
- Must be URL-safe

Respond with ONLY the JSON array.`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )

    const text = response.data?.choices?.[0]
      ?.message?.content?.trim() || '[]'

    let suggestions: string[] = []
    try {
      const cleaned = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()
      suggestions = JSON.parse(cleaned)

      suggestions = suggestions
        .filter((s: any) =>
          typeof s === 'string' &&
          /^[a-z0-9-]{3,25}$/.test(s)
        )
        .slice(0, 3)
    } catch {
      suggestions = []
    }

    if (suggestions.length === 0) {
      try {
        const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
          .replace('www.', '')
          .split('.')[0]
          .slice(0, 10)
        const rand = Date.now()
          .toString(36)
          .slice(-4)
        suggestions = [
          `${domain}-link`,
          `${domain}-${rand}`,
          `go-${domain}`
        ]
      } catch {
        suggestions = ['my-link', 'short-url', 'go-here']
      }
    }

    return ok(res, { suggestions })

  } catch (err: any) {
    console.error('Grok AI error:', 
      err?.response?.data || err.message)

    try {
      const domain = new URL(req.body.url.startsWith('http') ? req.body.url : `https://${req.body.url}`)
        .hostname
        .replace('www.', '')
        .split('.')[0]
        .slice(0, 10)
      const rand = Date.now()
        .toString(36)
        .slice(-4)
      return ok(res, {
        suggestions: [
          `${domain}-link`,
          `${domain}-${rand}`,
          `go-${domain}`
        ]
      })
    } catch {
      return ok(res, {
        suggestions: ['my-link', 'short-url', 'quick-link']
      })
    }
  }
})

export default router
