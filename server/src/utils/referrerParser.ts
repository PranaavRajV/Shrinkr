export function parseReferrer(referrer: string): {
  source: string
  medium: string
  display: string
} {
  if (!referrer) return {
    source: 'direct',
    medium: 'direct',
    display: 'Direct / None'
  }

  try {
    const url = new URL(referrer)
    const hostname = url.hostname
      .replace('www.', '')
      .replace('m.', '')
      .toLowerCase()

    const socialMap: Record<string, string> = {
      'facebook.com': 'Facebook',
      't.co': 'Twitter / X',
      'twitter.com': 'Twitter / X',
      'x.com': 'Twitter / X',
      'instagram.com': 'Instagram',
      'l.instagram.com': 'Instagram',
      'linkedin.com': 'LinkedIn',
      'lnkd.in': 'LinkedIn',
      'youtube.com': 'YouTube',
      'youtu.be': 'YouTube',
      'tiktok.com': 'TikTok',
      'reddit.com': 'Reddit',
      'pinterest.com': 'Pinterest',
      'snapchat.com': 'Snapchat',
      'whatsapp.com': 'WhatsApp',
      'telegram.org': 'Telegram',
      't.me': 'Telegram',
    }

    const searchMap: Record<string, string> = {
      'google.com': 'Google',
      'google.co.uk': 'Google',
      'google.ca': 'Google',
      'bing.com': 'Bing',
      'yahoo.com': 'Yahoo',
      'duckduckgo.com': 'DuckDuckGo',
      'baidu.com': 'Baidu',
    }

    if (socialMap[hostname]) return {
      source: socialMap[hostname],
      medium: 'social',
      display: socialMap[hostname]
    }

    // Check partial match for subdomains or regional domains
    for (const [key, val] of Object.entries(socialMap)) {
      if (hostname.endsWith(key)) return { source: val, medium: 'social', display: val }
    }

    if (searchMap[hostname]) return {
      source: searchMap[hostname],
      medium: 'search',
      display: searchMap[hostname]
    }

    for (const [key, val] of Object.entries(searchMap)) {
      if (hostname.endsWith(key)) return { source: val, medium: 'search', display: val }
    }

    return {
      source: hostname,
      medium: 'referral',
      display: hostname
    }
  } catch {
    return {
      source: 'direct',
      medium: 'direct',
      display: 'Direct / None'
    }
  }
}
