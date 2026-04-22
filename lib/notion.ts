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
              content: `${data.utm_source} / ${data.utm_medium} / ${data.utm_campaign}`,
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
      Created: { date: { start: new Date().toISOString() } },
      'Created By': {
        rich_text: [{ text: { content: 'UTM Generator' } }],
      },
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
