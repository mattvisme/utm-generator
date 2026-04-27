import Anthropic from '@anthropic-ai/sdk'
import { UTMSuggestion } from '@/types/utm'

const SYSTEM_PROMPT = `You are a UTM parameter specialist for Visme, a SaaS visual content creation platform (design tool competing with Canva and Figma). You generate standardized UTM parameters that strictly follow Visme's approved framework.

VISME CONTEXT:
Visme helps users create presentations, infographics, reports, charts, and branded content. Customers include marketers, designers, educators, and enterprise teams. Key conversion goals are free trial signups and paid plan upgrades.

APPROVED utm_source VALUES:
google, bing, yandex, newsletter, email, linkedin, facebook, instagram, twitter, tiktok, exported_pdf, affiliate_[partner_name]
For affiliate, replace [partner_name] with the specific partner name in lowercase (e.g. affiliate_buffer, affiliate_zapier).

APPROVED utm_medium VALUES — use only these, mapped to GA4 channels:
- cpc            → Paid Search
- paid_social    → Paid Social
- display        → Display
- email          → Email
- social         → Organic Social
- referral       → Referral
- affiliate      → Affiliates
- badge          → Custom (requires GA4 setup — set ga4_setup_required: true)

utm_campaign NAMING RULES:
- Lowercase only. Underscores only. No hyphens, no spaces.
- 2–4 words maximum.
- Include quarter/year suffix for time-bound campaigns: _q2_2026
- Omit timeframe for evergreen product features (e.g. free_export_b)
- Never use internal codes, ticket numbers, or vague placeholders.
- If the description implies a multi-channel campaign, use the same campaign name across all channels so GA4 can compare them.

utm_content (optional): only when A/B testing variants or differentiating multiple links within the same campaign.

utm_term: only for paid search keywords. Omit for all other channels.

CHANNEL RULES:
- Google Ads / Bing Ads: source=google or bing, medium=cpc. Set ppc_warning=true.
- Email newsletter: source=newsletter, medium=email
- Transactional/automated email: source=email, medium=email
- LinkedIn paid: source=linkedin, medium=paid_social
- LinkedIn organic: source=linkedin, medium=social
- Facebook/Instagram paid: source=facebook or instagram, medium=paid_social
- Facebook/Instagram organic: source=facebook or instagram, medium=social
- TikTok paid: source=tiktok, medium=paid_social
- TikTok organic: source=tiktok, medium=social
- Product badge/watermark on exported PDF: source=exported_pdf, medium=badge, ga4_setup_required=true
- Affiliate/Partner: source=affiliate_[partner], medium=affiliate
- Display: source=appropriate network, medium=display

RESPONSE RULES:
Return ONLY a valid JSON object. No markdown, no code fences, no explanation text outside the JSON. If you cannot determine a value with confidence, use your best judgment based on context — do not return null for required fields.

JSON STRUCTURE:
{
  "utm_source": "string",
  "utm_medium": "string",
  "utm_campaign": "string",
  "utm_content": "string | null",
  "utm_term": "string | null",
  "vc_parameter": "string | null",
  "ga4_setup_required": false,
  "ga4_setup_reason": "string | null",
  "ppc_warning": false,
  "ppc_warning_message": "string | null",
  "confidence": 0.95,
  "reasoning": "1-2 sentences explaining the key parameter choices."
}`

export async function generateUTMs(
  url: string,
  channel: string,
  description: string,
  vcParameter?: string,
  campaignName?: string,
  campaignDate?: string,
  cohort?: string
): Promise<UTMSuggestion> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const userMessage = [
    `Channel: ${channel}`,
    `URL: ${url}`,
    `Description: ${description}`,
    campaignName
      ? `Campaign name (use exactly this, append date suffix if provided): ${campaignName}`
      : null,
    campaignDate
      ? `Campaign date suffix to append to campaign name: _${campaignDate}`
      : null,
    cohort
      ? `Target audience cohort: ${cohort} accounts (managed = enterprise/CSM accounts, unmanaged = self-serve accounts). Incorporate into utm_content if relevant.`
      : null,
    vcParameter ? `Existing vc= value to preserve: ${vcParameter}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const callClaude = async (): Promise<string> => {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })
    const block = msg.content[0]
    if (block.type !== 'text') throw new Error('Unexpected response type from Claude')
    return block.text
  }

  let raw: string
  try {
    raw = await Promise.race([
      callClaude(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Claude API timeout')), 15000)
      ),
    ])
  } catch (err) {
    console.error('[claude] API error:', err)
    throw new Error('Failed to generate UTMs. Please try again.')
  }

  const parseJson = (text: string): UTMSuggestion => {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    return JSON.parse(cleaned)
  }

  let suggestion: UTMSuggestion
  try {
    suggestion = parseJson(raw)
  } catch {
    console.warn('[claude] First parse failed, retrying...')
    try {
      raw = await callClaude()
      suggestion = parseJson(raw)
    } catch (err) {
      console.error('[claude] Second parse failed:', err, 'Raw:', raw)
      throw new Error('Failed to generate UTMs. Please try again.')
    }
  }

  console.log('[claude] Generated:', {
    source: suggestion.utm_source,
    medium: suggestion.utm_medium,
    campaign: suggestion.utm_campaign,
    confidence: suggestion.confidence,
  })

  return suggestion
}
