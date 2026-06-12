import { Client } from '@notionhq/client'
import { SaveRequest } from '@/types/utm'

const getClient = () =>
  new Client({ auth: process.env.NOTION_API_KEY })

export async function saveUTMRecord(data: SaveRequest): Promise<string> {
  const notion = getClient()
  const dbId = process.env.NOTION_DATABASE_ID!

  const page = await notion.pages.create({
    parent: { database_id: dbId },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: [
                data.utm_source,
                data.utm_medium,
                data.utm_campaign,
                data.utm_content || null,
              ]
                .filter(Boolean)
                .join(' / '),
            },
          },
        ],
      },
      'URL (Original)': { url: data.url_original },
      'URL (With UTMs)': { url: data.url_with_utm },
      Description: {
        rich_text: [{ text: { content: data.description } }],
      },
      Channel: { select: { name: data.channel } },
      utm_source: {
        rich_text: [{ text: { content: data.utm_source } }],
      },
      utm_medium: {
        rich_text: [{ text: { content: data.utm_medium } }],
      },
      utm_campaign: {
        rich_text: [{ text: { content: data.utm_campaign } }],
      },
      utm_content: {
        rich_text: [{ text: { content: data.utm_content || '' } }],
      },
      utm_term: {
        rich_text: [{ text: { content: data.utm_term || '' } }],
      },
      vc_parameter: {
        rich_text: [{ text: { content: data.vc_parameter || '' } }],
      },
      'GA4 Setup Required': { checkbox: data.ga4_setup_required },
      'GA4 Setup Notes': {
        rich_text: [{ text: { content: data.ga4_setup_reason || '' } }],
      },
      Reasoning: {
        rich_text: [{ text: { content: (data.reasoning || '').slice(0, 2000) } }],
      },
      Created: { date: { start: new Date().toISOString() } },
      // Only set Created By when we have a valid Notion user ID — the column is
      // typed as PERSON and will reject a rich_text fallback with a 400 error.
      ...(data.created_by_id ? { 'Created By': { people: [{ id: data.created_by_id }] } } : {}),
      ...(data.url_short ? { 'URL (Short)': { url: data.url_short } } : {}),
    },
  })

  return `https://notion.so/${page.id.replace(/-/g, '')}`
}

export async function findSimilarRecord(
  baseUrl: string,
  utmSource: string,
  utmCampaign: string
): Promise<{ url: string; campaign: string; notion_url: string } | null> {
  try {
    const notion = getClient()
    const dbId = process.env.NOTION_DATABASE_ID!

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notionAny = notion as any
    const response = await notionAny.databases.query({
      database_id: dbId,
      filter: {
        and: [
          {
            property: 'URL (Original)',
            url: { equals: baseUrl },
          },
          {
            property: 'utm_source',
            rich_text: { equals: utmSource },
          },
          {
            property: 'utm_campaign',
            rich_text: { equals: utmCampaign },
          },
        ],
      },
      page_size: 1,
    })

    if (response.results.length === 0) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = response.results[0] as any
    const urlProp = page.properties?.['URL (With UTMs)']?.url || ''
    const campaignProp = page.properties?.utm_campaign?.rich_text?.[0]?.text?.content || ''
    const notionUrl = `https://notion.so/${page.id.replace(/-/g, '')}`

    return { url: urlProp, campaign: campaignProp, notion_url: notionUrl }
  } catch {
    return null
  }
}
