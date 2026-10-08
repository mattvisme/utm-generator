import { UTMSuggestion } from '@/types/utm'

export function isVismeUrl(raw: string): boolean {
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    return url.hostname === 'visme.co' || url.hostname.endsWith('.visme.co')
  } catch {
    return false
  }
}

const SECOND_LEVEL_TLDS = new Set(['co', 'com', 'org', 'net', 'gov', 'edu', 'ac'])

// Referral utm_source = referring site name, lowercase, no TLD (per the UTM framework).
// Accepts a bare name, a domain or a full URL: https://www.techradar.com/x → techradar, bbc.co.uk → bbc.
export function normalizeReferralSite(raw: string): string {
  let host = raw.trim().toLowerCase()
  try {
    host = new URL(host.includes('://') ? host : `https://${host}`).hostname
  } catch {
    // not URL-parseable — fall through and sanitise the raw text
  }
  const labels = host.replace(/^www\./, '').split('.').filter(Boolean)
  if (labels.length > 1) {
    labels.pop()
    if (labels.length > 1 && SECOND_LEVEL_TLDS.has(labels[labels.length - 1])) labels.pop()
  }
  return labels
    .join('_')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

export interface CleanedUrl {
  base: string
  hadUtms: boolean
}

export function stripUtmParams(raw: string): CleanedUrl {
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    const utmKeys = Array.from(url.searchParams.keys()).filter(
      (k) => k.startsWith('utm_') || k === 'vc'
    )
    const hadUtms = utmKeys.length > 0
    utmKeys.forEach((k) => url.searchParams.delete(k))
    return { base: url.toString(), hadUtms }
  } catch {
    return { base: raw, hadUtms: false }
  }
}

export function buildFinalUrl(
  base: string,
  suggestion: UTMSuggestion,
  vcParameter?: string | null
): string {
  try {
    const url = new URL(base)
    const hash = url.hash
    url.hash = ''

    url.searchParams.append('utm_source', suggestion.utm_source)
    url.searchParams.append('utm_medium', suggestion.utm_medium)
    url.searchParams.append('utm_campaign', suggestion.utm_campaign)
    if (suggestion.utm_content) {
      url.searchParams.append('utm_content', suggestion.utm_content)
    }
    if (suggestion.utm_term) {
      url.searchParams.append('utm_term', suggestion.utm_term)
    }
    const vc = vcParameter || suggestion.vc_parameter
    if (vc) {
      url.searchParams.append('vc', vc)
    }

    return url.toString() + hash
  } catch {
    return base
  }
}

// GA4 truncates any event parameter value at 100 characters, and campaign name is
// carried as an event parameter, so 100 is the real platform ceiling. No platform in
// the Visme stack caps campaign names below this.
//
// This was 30 from the initial build (384f20d, 2026-04-22) with no stated reason, which
// silently clipped names mid-word — e.g. state_b2b_sales_content_benchmark became
// state_b2b_sales_content_benchm. Raised to the actual GA4 limit 2026-08-20.
export const MAX_CAMPAIGN_LENGTH = 100

export function truncateCampaign(
  campaign: string,
  max = MAX_CAMPAIGN_LENGTH
): { value: string; truncated: boolean } {
  if (campaign.length <= max) return { value: campaign, truncated: false }
  // Strip any trailing underscore left by the slice boundary
  const sliced = campaign.slice(0, max).replace(/_+$/, '')
  return { value: sliced, truncated: true }
}
