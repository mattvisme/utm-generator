import { UTMSuggestion } from '@/types/utm'

export function isVismeUrl(raw: string): boolean {
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    return url.hostname === 'visme.co' || url.hostname.endsWith('.visme.co')
  } catch {
    return false
  }
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

export function truncateCampaign(campaign: string, max = 30): { value: string; truncated: boolean } {
  if (campaign.length <= max) return { value: campaign, truncated: false }
  return { value: campaign.slice(0, max), truncated: true }
}
