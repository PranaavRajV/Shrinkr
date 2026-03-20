declare module 'geoip-lite' {
  export interface CountryLookup {
    country?: string
    // geoip-lite also provides additional fields depending on the lookup.
    [key: string]: unknown
  }

  export function lookup(ip: string): CountryLookup | null
}

