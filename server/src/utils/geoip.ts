import geoip from 'geoip-lite'

function normalizeIp(ip: string): string {
  // Handle IPv4-mapped IPv6 addresses like ::ffff:1.2.3.4
  const withoutPrefix = ip.replace(/^::ffff:/, '')
  // If the value includes a port (rare but possible), strip it.
  const withoutPort = withoutPrefix.split(':')[0]
  return withoutPort.trim()
}

export function ipToCountry(ip?: string): string | undefined {
  if (!ip) return undefined
  const normalized = normalizeIp(ip)
  if (!normalized) return undefined

  const lookup = geoip.lookup(normalized)
  if (!lookup?.country) return undefined
  return lookup.country
}

