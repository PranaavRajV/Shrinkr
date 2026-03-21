import fetch from 'node-fetch'
import * as cheerio from 'cheerio'

export interface OGData {
  title: string
  description: string
  image: string
  favicon: string
  siteName: string
}

export async function scrapeOG(url: string): Promise<OGData> {
  try {
    const res = await fetch(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Shrinkrbot/1.0)'
      }
    })
    const html = await res.text()
    const $ = cheerio.load(html)

    const get = (selector: string, attr: string) =>
      $(selector).attr(attr) || ''

    return {
      title:
        get('meta[property="og:title"]', 'content') ||
        get('meta[name="twitter:title"]', 'content') ||
        $('title').text() ||
        '',
      description:
        get('meta[property="og:description"]', 'content') ||
        get('meta[name="description"]', 'content') ||
        '',
      image:
        get('meta[property="og:image"]', 'content') ||
        get('meta[name="twitter:image"]', 'content') ||
        '',
      favicon:
        `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`,
      siteName:
        get('meta[property="og:site_name"]', 'content') ||
        new URL(url).hostname.replace('www.', '')
    }
  } catch {
    return {
      title: '', description: '',
      image: '', favicon: '', siteName: ''
    }
  }
}
