import { NextRequest, NextResponse } from 'next/server'
import { generateUTMs } from '@/lib/claude'
import { findSimilarRecord } from '@/lib/notion'
import { isVismeUrl, stripUtmParams, buildFinalUrl, truncateCampaign } from '@/lib/utm-utils'
import { GenerateRequest } from '@/types/utm'

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json()
    const { url, channel, description, vc_parameter } = body

    if (!url || !channel || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!isVismeUrl(url)) {
      return NextResponse.json({ error: 'URL must be a visme.co domain' }, { status: 400 })
    }

    const { base: cleanUrl } = stripUtmParams(url)

    const suggestion = await generateUTMs(cleanUrl, channel, description, vc_parameter)

    const { value: campaign, truncated } = truncateCampaign(suggestion.utm_campaign)
    if (truncated) {
      console.warn(`[generate] Campaign truncated: "${suggestion.utm_campaign}" → "${campaign}"`)
      suggestion.utm_campaign = campaign
    }

    const final_url = buildFinalUrl(cleanUrl, suggestion, vc_parameter)

    const similar_existing = await findSimilarRecord(cleanUrl, suggestion.utm_source, suggestion.utm_campaign)

    return NextResponse.json({
      suggestion,
      final_url,
      truncated_campaign: truncated,
      similar_existing,
    })
  } catch (err: unknown) {
    console.error('[generate]', err)
    return NextResponse.json(
      { error: (err instanceof Error ? err.message : null) || 'Failed to generate UTMs. Please try again.' },
      { status: 500 }
    )
  }
}
