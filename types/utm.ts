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
  ppc_warning_message: string | null
  confidence: number
  reasoning: string
}

export interface GenerateRequest {
  url: string
  channel: string
  description: string
  vc_parameter?: string
  campaign_name?: string
  campaign_date?: string   // formatted as "apr_2026"
  cohort?: 'managed' | 'unmanaged'
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
}

export const CHANNELS = [
  '-- Select a channel --',
  'Email / Newsletter',
  'Organic Social',
  'Paid Social',
  'Paid Search (Google Ads)',
  'Paid Search (Bing Ads)',
  'Display',
  'Affiliate / Partner',
  'Product Feature',
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
