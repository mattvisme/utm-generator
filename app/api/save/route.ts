import { NextRequest, NextResponse } from 'next/server'
import { saveUTMRecord } from '@/lib/notion'
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

  return NextResponse.json({ success: true, notion_url: notionUrl })
}
