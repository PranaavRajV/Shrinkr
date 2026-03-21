export interface BotResult {
  isBot: boolean
  reason: string
}

export function detectBot(
  userAgent: string,
  ip: string,
  referrer: string
): BotResult {
  const ua = userAgent.toLowerCase()

  // Known bot user agents
  const botPatterns = [
    'googlebot', 'bingbot', 'slurp', 'duckduckbot',
    'baiduspider', 'yandexbot', 'sogou', 'exabot',
    'facebot', 'facebookexternalhit', 'twitterbot',
    'linkedinbot', 'whatsapp', 'telegrambot',
    'bot', 'crawler', 'spider', 'scraper',
    'curl/', 'wget/', 'python-requests', 'axios/',
    'postman', 'insomnia', 'httpie',
    'headlesschrome', 'phantomjs', 'selenium'
  ]

  for (const pattern of botPatterns) {
    if (ua.includes(pattern)) {
      return { isBot: true, reason: `Bot UA: ${pattern}` }
    }
  }

  // Empty user agent
  if (!userAgent || userAgent.length < 10) {
    return { isBot: true, reason: 'Empty/short UA' }
  }

  // Suspicious IPs (localhost, private ranges)
  if (
    ip.startsWith('127.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip === '::1'
  ) {
    return { isBot: true, reason: 'Private IP' }
  }

  return { isBot: false, reason: '' }
}
