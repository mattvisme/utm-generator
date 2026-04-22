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
