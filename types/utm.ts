export interface NotionUser {
  id: string
  name: string
}

export interface UTMSuggestion {
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string | null
  utm_term: string | null
  vc_parameter: string | null
  ga4_setup_required: boolean
  ga4_setup_reason: string | null
  ppc_warning: boolean
  reasoning: string
  // Deprecated — no longer requested from the LLM
  ppc_warning_message?: string | null
  confidence?: number
}

export interface GenerateRequest {
  url: string
  channel: string
  description: string
  vc_parameter?: string
  campaign_name?: string
  campaign_date?: string   // formatted as "apr_2026"
  cohort?: 'managed' | 'unmanaged'
  ab_variant?: string      // e.g. "a", "b", "c", or custom label
  affiliate_name?: string  // e.g. "john_smith" → utm_source=affiliate_john_smith
  social_platform?: string // e.g. "linkedin" — forces utm_source for social channels
}

export interface GenerateResponse {
  suggestion: UTMSuggestion
  final_url: string
  truncated_campaign?: boolean
  similar_existing?: {
    url: string
    campaign: string
    notion_url: string
  } | null
}

export interface SaveRequest {
  url_original: string
  url_with_utm: string
  description: string
  channel: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string | null
  utm_term: string | null
  vc_parameter: string | null
  ga4_setup_required: boolean
  ga4_setup_reason: string | null
  reasoning: string
  created_by_id?: string
  created_by_name?: string
  url_short?: string
}

export interface SaveResponse {
  success: boolean
  notion_url: string
}

export type AppState = 'input' | 'result' | 'success'

export interface FormData {
  url: string
  channel: string
  description: string
  vc_parameter: string
  campaign_name: string
  campaign_month: string  // "04"
  campaign_year: string   // "2026"
  cohort: string          // "managed" | "unmanaged" | ""
  is_ab_test: boolean
  ab_variant: string      // "a" | "b" | "c" | custom
  created_by_id: string
  created_by_name: string
  affiliate_name: string  // normalised to lowercase_underscores
  custom_slug: string     // optional Rebrandly slug override
  social_platform: string // platform selected for social channels
}

export const CHANNELS = [
  '-- Select a channel --',
  'Email / Newsletter',
  'Organic Social',
  'Paid Social',
  'Paid Search (Google Ads)',
  'Paid Search (Bing Ads)',
  'Display',
  'Referral',
  'Affiliate / Partner',
  'Product Feature',
  'Blog / On-site CTA',
  'Exported PDF / Watermark',
  'Other',
] as const

export type Channel = (typeof CHANNELS)[number]

export const PPC_CHANNELS: Channel[] = [
  'Paid Search (Google Ads)',
  'Paid Search (Bing Ads)',
]

// Channels where managed/unmanaged cohort targeting is relevant
export const COHORT_CHANNELS: Channel[] = [
  'Email / Newsletter',
  'Product Feature',
]

export const APPROVED_MEDIUMS = [
  'cpc',
  'paid_social',
  'display',
  'email',
  'social',
  'referral',
  'affiliate',
  'badge',
  'internal',
] as const

export type ApprovedMedium = (typeof APPROVED_MEDIUMS)[number]

// Approved utm_source base values. affiliate_[partner] is also valid (checked by regex).
export const APPROVED_SOURCES = [
  'google',
  'bing',
  'yandex',
  'newsletter',
  'email',
  'linkedin',
  'facebook',
  'instagram',
  'twitter',
  'tiktok',
  'youtube',
  'exported_pdf',
  'visme_app',
  'blog',
  'pinterest',
  'threads',
] as const

export type ApprovedSource = (typeof APPROVED_SOURCES)[number]

// Channels that get a Rebrandly short link
export const SHORTLINK_CHANNELS: Channel[] = ['Organic Social', 'Paid Social']

export const SOCIAL_PLATFORMS = [
  { label: 'LinkedIn',    value: 'linkedin'  },
  { label: 'Facebook',    value: 'facebook'  },
  { label: 'Instagram',   value: 'instagram' },
  { label: 'X / Twitter', value: 'twitter'   },
  { label: 'TikTok',      value: 'tiktok'    },
  { label: 'YouTube',     value: 'youtube'   },
  { label: 'Pinterest',   value: 'pinterest' },
  { label: 'Threads',     value: 'threads'   },
] as const

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]['value']

export const MONTHS = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' },
]
