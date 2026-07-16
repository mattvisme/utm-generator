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
  email_platform?: string  // e.g. "hubspot" — forces utm_source for email channels
  is_sequence?: boolean
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

export type AppState = 'input' | 'result' | 'sequence_review' | 'success'

export interface SequenceApprovedItem {
  step: string
  url: string
  notionUrl: string
}

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
  email_platform: string  // sending platform selected for email channels
  is_sequence: boolean    // true when building an email sequence
  sequence_steps: string[] // utm_content values per step e.g. ['invite_1', 'reminder_1']
}

export const CHANNELS = [
  '-- Select a channel --',
  'Email / Newsletter',
  'Organic Social',
  'Paid Social',
  'Paid Search (Google Ads)',
  'Paid Search (Bing Ads)',
  'Paid AI (OpenAI)',
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

// Interim medium for OpenAI/ChatGPT paid placements.
// Deliberately excluded from APPROVED_MEDIUMS — not yet a GA4-ratified value.
// GA4 will report this as "Unassigned" until an official AI Ads channel grouping
// is published. When that happens, remap here and in lib/claude.ts.
// Decision made: June 2026. Revisit when GA4 publishes official spec.
export const INTERIM_AI_AD_MEDIUMS = ['paid_ai'] as const

// Paired source for OpenAI ad placements.
// Expand this list if OpenAI introduces distinct named placements.
export const OPENAI_AD_SOURCES = ['chatgpt'] as const

export type ApprovedMedium = (typeof APPROVED_MEDIUMS)[number]

// Approved utm_source base values. affiliate_[partner] is also valid (checked by regex).
// newsletter and email are legacy values — no longer presented as options; visme_admin replaces them for admin sends.
export const APPROVED_SOURCES = [
  'google',
  'bing',
  'yandex',
  'hubspot',
  'instantly',
  'mixmax',
  'visme_admin',
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
  'reddit',
  'snapchat',
  'whatsapp',
  'chatgpt',
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
  { label: 'Reddit',      value: 'reddit'    },
  { label: 'Snapchat',    value: 'snapchat'  },
  { label: 'WhatsApp',    value: 'whatsapp'  },
] as const

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]['value']

export const EMAIL_PLATFORMS = [
  { label: 'HubSpot',     value: 'hubspot'     },
  { label: 'Instantly',   value: 'instantly'   },
  { label: 'MixMax',      value: 'mixmax'      },
  { label: 'Visme Admin', value: 'visme_admin' },
] as const

export type EmailPlatform = (typeof EMAIL_PLATFORMS)[number]['value']

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
