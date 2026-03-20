import mongoose from 'mongoose'

const DEFAULT_MAX_RETRIES = 6

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let connectPromise: Promise<typeof mongoose> | null = null

export async function connectDB(): Promise<typeof mongoose> {
  if (connectPromise) return connectPromise

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('Missing required env var: MONGODB_URI')
  }

  connectPromise = (async () => {
    const maxRetries = process.env.MONGODB_MAX_RETRIES
      ? Number(process.env.MONGODB_MAX_RETRIES)
      : DEFAULT_MAX_RETRIES

    let lastError: unknown

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        mongoose.set('strictQuery', true)
        // Mongoose v9 uses modern connection defaults; only set minimal options.
        await mongoose.connect(uri)
        return mongoose
      } catch (err) {
        lastError = err
        const backoffMs = Math.min(500 * 2 ** (attempt - 1), 10_000)
        if (attempt === maxRetries) break
        await wait(backoffMs)
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Failed to connect to MongoDB')
  })()

  return connectPromise
}

