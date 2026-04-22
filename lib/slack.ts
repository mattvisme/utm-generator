import { SaveRequest } from '@/types/utm'

export async function notifyGA4Setup(
  data: SaveRequest,
  notionUrl: string
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn('[slack] SLACK_WEBHOOK_URL not configured')
    return
  }

  const payload = {
    text: '🔧 GA4 Custom Channel Setup Required',
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🔧 GA4 Custom Channel Setup Required' },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'A new UTM link was created with a non-standard `utm_medium` that requires a GA4 custom channel group.',
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*utm_medium:*\n\`${data.utm_medium}\`` },
          { type: 'mrkdwn', text: `*utm_source:*\n\`${data.utm_source}\`` },
          { type: 'mrkdwn', text: `*Campaign:*\n\`${data.utm_campaign}\`` },
          { type: 'mrkdwn', text: `*Channel:*\n${data.channel}` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Full URL:*\n\`\`\`${data.url_with_utm}\`\`\``,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*What to do:* In GA4 Admin → Channel Groups, add a rule: \`utm_source\` exactly matches \`${data.utm_source}\` AND \`utm_medium\` exactly matches \`${data.utm_medium}\` → channel: *Product* (or appropriate channel name).\n\n*Notion record:* ${notionUrl}`,
        },
      },
    ],
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.error('[slack] Webhook responded with', res.status)
    }
  } catch (err) {
    console.error('[slack] Failed to send notification:', err)
  }
}
