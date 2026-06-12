import { NextRequest, NextResponse } from 'next/server'
import { shortenUrl } from '@/lib/rebrandly'

// Strip date-like words and noise from a slug component
function clean(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\b/g, '')
    .replace(/\b20\d{2}\b/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Build an auto slug from utm_source + first 2-3 meaningful campaign words
function autoSlug(source: string, campaign: string): string {
  const srcPart = clean(source).slice(0, 20)
  const campWords = clean(campaign).split('-').filter(Boolean).slice(0, 3).join('-')
  const combined = [srcPart, campWords].filter(Boolean).join('-')
  return combined.slice(0, 50).replace(/-+$/, '') || 'visme'
}

export async function POST(req: NextRequest) {
  try {
    const { url, custom_slug, utm_source, utm_campaign } = await req.json()

    if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

    if (custom_slug) {
      // Custom slug — try once; if conflict return 409 so the client can inform the user
      try {
        const short_url = await shortenUrl(url, custom_slug)
        return NextResponse.json({ short_url })
      } catch (err) {
        if (err instanceof Error && err.message === 'slug_conflict') {
          return NextResponse.json({ error: 'That custom slug is already taken. Try a different one.' }, { status: 409 })
        }
        throw err
      }
    }

    // Auto slug — try with generated slug, fall back to no slug on conflict
    const slug = autoSlug(utm_source || '', utm_campaign || '')
    try {
      const short_url = await shortenUrl(url, slug)
      return NextResponse.json({ short_url })
    } catch (err) {
      if (err instanceof Error && err.message === 'slug_conflict') {
        const short_url = await shortenUrl(url)
        return NextResponse.json({ short_url })
      }
      throw err
    }
  } catch (err) {
    console.error('shorten error', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create short link' },
      { status: 500 }
    )
  }
}
