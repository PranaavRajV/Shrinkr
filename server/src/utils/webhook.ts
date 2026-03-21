import fetch from 'node-fetch'
import crypto from 'crypto'

export async function fireWebhook(
  webhookUrl: string,
  secret: string | null,
  payload: object
): Promise<void> {
  try {
    const body = JSON.stringify(payload)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Shrinkr-Webhook/1.0',
      'X-Shrinkr-Event': (payload as any).event || 'click',
      'X-Shrinkr-Timestamp': Date.now().toString(),
    }

    if (secret) {
      const sig = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex')
      headers['X-Shrinkr-Signature'] = `sha256=${sig}`
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body,
      timeout: 5000,
    } as any)

    console.log(
      `Webhook fired to ${webhookUrl}: ${res.status}`
    )
  } catch (err) {
    console.error(`Webhook failed for ${webhookUrl}:`, err)
  }
}
