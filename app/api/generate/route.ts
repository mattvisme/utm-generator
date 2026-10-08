import { NextRequest, NextResponse } from 'next/server'
import { generateUTMs } from '@/lib/claude'
import { findSimilarRecord } from '@/lib/notion'
import { isVismeUrl, stripUtmParams, buildFinalUrl, truncateCampaign, normalizeReferralSite, MAX_CAMPAIGN_LENGTH } from '@/lib/utm-utils'
import { GenerateRequest, APPROVED_MEDIUMS, APPROVED_SOURCES, INTERIM_AI_AD_MEDIUMS } from '@/types/utm'

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json()
    const { url, channel, description, vc_parameter, campaign_name, campaign_date, cohort, ab_variant, affiliate_name, social_platform, email_platform, referral_site, is_sequence } = body

    if (!url || !channel || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!isVismeUrl(url)) {
      return NextResponse.json({ error: 'URL must be a visme.co domain' }, { status: 400 })
    }

    const referralSite = referral_site ? normalizeReferralSite(referral_site) : ''
    if (channel === 'Referral' && !referralSite) {
      return NextResponse.json({ error: 'Referring site is required for the Referral channel' }, { status: 400 })
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
      ab_variant,
      affiliate_name,
      social_platform,
      email_platform,
      is_sequence,
      referralSite || undefined
    )

    // For sequences, utm_content is set per-step client-side — ensure it's null here
    if (is_sequence) {
      suggestion.utm_content = null
    }

    // If a social platform was provided, enforce it as utm_source regardless of what Claude returned
    if (social_platform) {
      suggestion.utm_source = social_platform.toLowerCase().trim()
    }

    // If an email platform was provided, enforce it as utm_source
    if (email_platform) {
      suggestion.utm_source = email_platform.toLowerCase().trim()
    }

    // If a referring site was provided, enforce it as utm_source
    if (referralSite) {
      suggestion.utm_source = referralSite
    }

    // Validate medium is from approved list (INTERIM_AI_AD_MEDIUMS also allowed)
    const allValidMediums = [...APPROVED_MEDIUMS, ...INTERIM_AI_AD_MEDIUMS]
    if (!(allValidMediums as string[]).includes(suggestion.utm_medium)) {
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
    // Referral sources are the referring site's name (g2, techradar…), so they are never on the approved list
    // and need no GA4 setup — referral is a GA4 default channel.
    if (!isApprovedSource && suggestion.utm_medium !== 'referral') {
      console.warn(`[generate] Non-standard source: "${suggestion.utm_source}" — verifying GA4 flag`)
      // Other non-standard sources (e.g. display networks like criteo) still go through
      // but must be flagged so the team knows to check GA4 channel grouping.
      if (!suggestion.ga4_setup_required) {
        suggestion.ga4_setup_required = true
        suggestion.ga4_setup_reason =
          suggestion.ga4_setup_reason ||
          `utm_source "${suggestion.utm_source}" is not a standard Visme source — confirm it will map to the correct GA4 channel group.`
      }
    }

    const originalCampaign = suggestion.utm_campaign
    const { value: campaign, truncated } = truncateCampaign(originalCampaign)
    if (truncated) {
      console.warn(`[generate] Campaign truncated: "${originalCampaign}" → "${campaign}"`)
      suggestion.utm_campaign = campaign
      // Record the original in the reasoning text. Reasoning is persisted to the Notion
      // row, so this is the only lasting audit trail — without it the intended name is
      // lost as soon as the response is returned, leaving a clipped value in the
      // registry that is indistinguishable from a name someone typed that way.
      suggestion.reasoning = [
        suggestion.reasoning,
        `Campaign name exceeded ${MAX_CAMPAIGN_LENGTH} characters and was truncated for GA4. Original: "${originalCampaign}"`,
      ]
        .filter(Boolean)
        .join('\n\n')
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
