import { NextRequest, NextResponse } from 'next/server'
import { shortenUrl } from '@/lib/rebrandly'

// Derive a readable slug from UTM params when no custom slug is provided.
// e.g. source=linkedin, campaign=spring_promo_apr_2026 → "linkedin-spring-promo"
function autoSlug(url: string): string {
  try {
    const parsed = new URL(url)
    const source = parsed.searchParams.get('utm_source') || ''
    const campaign = parsed.searchParams.get('utm_campaign') || ''
    const DATE_WORDS = /^(\d{4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$/
    const campaignWords = campaign.split('_').filter(w => !DATE_WORDS.test(w)).slice(0, 2)
    return [source, ...campaignWords].filter(Boolean).join('-').slice(0, 30)
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  const { url, slug } = await req.json() as { url?: string; slug?: string }
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  const isCustomSlug = Boolean(slug)
  const targetSlug = slug || autoSlug(url) || undefined

  try {
    const shortUrl = await shortenUrl(url, targetSlug)
    return NextResponse.json({ short_url: shortUrl })
  } catch (err) {
    if (err instanceof Error && err.message === 'slug_conflict') {
      if (isCustomSlug) {
        return NextResponse.json(
          { error: 'That slug is already taken. Try a different one.' },
          { status: 409 }
        )
      }
      // Auto-generated slug conflicted — fall back to Rebrandly's own generated slug
      try {
        const shortUrl = await shortenUrl(url)
        return NextResponse.json({ short_url: shortUrl })
      } catch {
        return NextResponse.json({ error: 'Failed to create short link. Please try again.' }, { status: 500 })
      }
    }
    console.error('[shorten]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to shorten URL' },
      { status: 500 }
    )
  }
}
