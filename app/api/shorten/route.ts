import { NextRequest, NextResponse } from 'next/server'
import { checkSlugAvailable, createShortLink } from '@/lib/rebrandly'

function clean(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\b/g, '')
    .replace(/\b20\d{2}\b/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function autoSlug(source: string, campaign: string): string {
  const srcPart = clean(source).slice(0, 20)
  const campWords = clean(campaign).split('-').filter(Boolean).slice(0, 3).join('-')
  const combined = [srcPart, campWords].filter(Boolean).join('-')
  return combined.slice(0, 50).replace(/-+$/, '') || 'visme'
}

function previewUrl(slug: string): string {
  const domain = process.env.REBRANDLY_DOMAIN || 'rebrand.ly'
  return `https://${domain}/${slug}`
}

// action=check  → find an available slug, return a preview URL (nothing created in Rebrandly)
// action=create → create the link with the pre-checked slug, return the real short URL
export async function POST(req: NextRequest) {
  try {
    const { action, url, custom_slug, slug, utm_source, utm_campaign } = await req.json()

    if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

    if (action === 'create') {
      // slug was already checked for availability at preview time
      try {
        const short_url = await createShortLink(url, slug || undefined)
        return NextResponse.json({ short_url })
      } catch (err) {
        if (err instanceof Error && err.message === 'slug_conflict') {
          // Race condition: slug was taken between check and create — fall back to no slug
          const short_url = await createShortLink(url)
          return NextResponse.json({ short_url })
        }
        throw err
      }
    }

    // action=check (default): find an available slug and return a preview
    if (custom_slug) {
      const available = await checkSlugAvailable(custom_slug)
      if (!available) {
        return NextResponse.json(
          { error: 'That custom slug is already taken. Try a different one.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ slug: custom_slug, short_url: previewUrl(custom_slug) })
    }

    // Auto slug: check, and if taken append a counter until one is free
    const base = autoSlug(utm_source || '', utm_campaign || '')
    let candidate = base
    for (let i = 2; i <= 10; i++) {
      const available = await checkSlugAvailable(candidate)
      if (available) {
        return NextResponse.json({ slug: candidate, short_url: previewUrl(candidate) })
      }
      candidate = `${base}-${i}`
    }
    // All candidates taken — no slug, Rebrandly will assign one on create
    return NextResponse.json({ slug: null, short_url: null })
  } catch (err) {
    console.error('shorten error', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to check short link' },
      { status: 500 }
    )
  }
}
