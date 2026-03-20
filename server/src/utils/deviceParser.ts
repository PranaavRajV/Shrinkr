export function parseDevice(ua: string): string {
  if (/mobile/i.test(ua)) return 'mobile'
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  return 'desktop'
}

export function parseBrowser(ua: string): string {
  if (/chrome/i.test(ua)) return 'Chrome'
  if (/firefox/i.test(ua)) return 'Firefox'
  if (/safari/i.test(ua)) return 'Safari'
  if (/edge|edg/i.test(ua)) return 'Edge'
  return 'Other'
}

export function parseUserAgent(ua: string) {
  return {
    device: parseDevice(ua),
    browser: parseBrowser(ua)
  }
}
