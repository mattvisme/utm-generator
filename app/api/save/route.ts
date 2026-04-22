import { NextRequest, NextResponse } from 'next/server'
import { saveUTMRecord } from '@/lib/notion'
import { notifyGA4Setup } from '@/lib/slack'
import { SaveRequest } from '@/types/utm'

export async function POST(req: NextRequest) {
  let notionUrl = ''
  const body: SaveRequest = await req.json()

  try {
    notionUrl = await saveUTMRecord(body)
  } catch (err) {
    console.error('[save] Notion write failed:', err)
    return NextResponse.json(
      { error: 'Could not save to Notion. Copy your URL now.' },
      { status: 500 }
    )
  }

  if (body.ga4_setup_required) {
    try {
      await notifyGA4Setup(body, notionUrl)
    } catch (err) {
      console.error('[save] Slack notify failed (non-fatal):', err)
    }
  }

  return NextResponse.json({ success: true, notion_url: notionUrl })
}
