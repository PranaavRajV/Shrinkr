import Redis from 'ioredis'

let redisClient: Redis | null = null
let redisInitPromise: Promise<Redis> | null = null

function getRedisUrl(): string {
  const url = process.env.REDIS_URL
  if (!url) return 'redis://localhost:6379'
  return url
}

export function getRedisClient(): Promise<Redis> {
  if (redisClient) return Promise.resolve(redisClient)
  if (redisInitPromise) return redisInitPromise

  redisInitPromise = (async () => {
    const url = getRedisUrl()

    const client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: null, // Let ioredis keep retrying for us.
      enableReadyCheck: true,
      retryStrategy: (times) => {
        // Exponential backoff, cap at 2s.
        if (times > 20) return null
        return Math.min(times * 150, 2000)
      },
      reconnectOnError: () => true,
    })

    await client.connect()
    redisClient = client
    return redisClient
  })()

  return redisInitPromise
}

