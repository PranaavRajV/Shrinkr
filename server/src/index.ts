import dotenv from 'dotenv'

import app from './app'
import { connectDB } from './config/db'

dotenv.config()

const port = process.env.PORT ? Number(process.env.PORT) : 5000

async function main() {
  await connectDB()
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[shrinkr] server listening on http://localhost:${port}`)
  })
}

void main()

