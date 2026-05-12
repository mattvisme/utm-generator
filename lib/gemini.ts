import { GoogleGenerativeAI } from '@google/generative-ai'
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
- internal       → Custom on-site CTA (requires GA4 setup — set ga4_setup_required: true)

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
- Blog / On-site CTA: source=blog, medium=internal. Set ga4_setup_required=true with reason "utm_medium=internal requires a GA4 custom channel group."

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
  cohort?: string,
  abVariant?: string
): Promise<UTMSuggestion> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  })

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
    abVariant
      ? `This is an A/B test variant. Variant label: "${abVariant}". Set utm_content to this variant label (e.g. "variant_${abVariant}"). This is critical for comparing variant performance in GA4.`
      : null,
    vcParameter ? `Existing vc= value to preserve: ${vcParameter}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const callGemini = async (): Promise<string> => {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 500,
        responseMimeType: 'application/json',
      },
    })
    return result.response.text()
  }

  const parseJson = (text: string): UTMSuggestion => {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    return JSON.parse(cleaned)
  }

  let raw: string
  try {
    raw = await Promise.race([
      callGemini(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 15000)
      ),
    ])
  } catch (err) {
    console.error('[gemini] API error:', err)
    throw new Error('Failed to generate UTMs. Please try again.')
  }

  let suggestion: UTMSuggestion
  try {
    suggestion = parseJson(raw)
  } catch {
    console.warn('[gemini] First parse failed, retrying... Raw was:', raw)
    try {
      raw = await callGemini()
      suggestion = parseJson(raw)
    } catch (err) {
      console.error('[gemini] Second parse failed:', err, 'Raw:', raw)
      throw new Error('Failed to generate UTMs. Please try again.')
    }
  }

  console.log('[gemini] Generated:', {
    source: suggestion.utm_source,
    medium: suggestion.utm_medium,
    campaign: suggestion.utm_campaign,
    confidence: suggestion.confidence,
  })

  return suggestion
}
