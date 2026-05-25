import { NextRequest, NextResponse } from 'next/server'
import { generateUTMs } from '@/lib/claude'
import { findSimilarRecord } from '@/lib/notion'
import { isVismeUrl, stripUtmParams, buildFinalUrl, truncateCampaign } from '@/lib/utm-utils'
import { GenerateRequest, APPROVED_MEDIUMS, APPROVED_SOURCES } from '@/types/utm'

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json()
    const { url, channel, description, vc_parameter, campaign_name, campaign_date, cohort, ab_variant } = body

    if (!url || !channel || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!isVismeUrl(url)) {
      return NextResponse.json({ error: 'URL must be a visme.co domain' }, { status: 400 })
    }

    const { base: cleanUrl } = stripUtmParams(url)

    const suggestion = await generateUTMs(
      cleanUrl,
      channel,
      description,
      vc_parameter,
      campaign_name,
      campaign_date,
      cohort,
      ab_variant
    )

    // Validate medium is from approved list
    if (!(APPROVED_MEDIUMS as readonly string[]).includes(suggestion.utm_medium)) {
      console.error(`[generate] Invalid medium returned by LLM: "${suggestion.utm_medium}"`)
      return NextResponse.json(
        { error: `Generated an invalid utm_medium value: "${suggestion.utm_medium}". Please try again.` },
        { status: 422 }
      )
    }

    // Normalise all string UTM values server-side
    suggestion.utm_source = suggestion.utm_source.toLowerCase().trim()
    suggestion.utm_campaign = suggestion.utm_campaign
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
    if (suggestion.utm_content) {
      suggestion.utm_content = suggestion.utm_content
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
    }
    if (suggestion.utm_term) {
      suggestion.utm_term = suggestion.utm_term.toLowerCase().trim()
    }

    // Warn if source is not in the approved list (affiliate_* pattern is also valid)
    const isApprovedSource =
      (APPROVED_SOURCES as readonly string[]).includes(suggestion.utm_source) ||
      /^affiliate_[a-z0-9_]+$/.test(suggestion.utm_source)
    if (!isApprovedSource) {
      console.warn(`[generate] Non-standard source: "${suggestion.utm_source}" — verifying GA4 flag`)
      // Non-standard sources (e.g. referral domains like g2, criteo) still go through
      // but must be flagged so the team knows to check GA4 channel grouping.
      if (!suggestion.ga4_setup_required) {
        suggestion.ga4_setup_required = true
        suggestion.ga4_setup_reason =
          suggestion.ga4_setup_reason ||
          `utm_source "${suggestion.utm_source}" is not a standard Visme source — confirm it will map to the correct GA4 channel group.`
      }
    }

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
