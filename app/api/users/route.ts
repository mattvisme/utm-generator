import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

export async function GET() {
  try {
    const notion = new Client({ auth: process.env.NOTION_API_KEY })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (notion.users as any).list({ page_size: 100 })

    const people = res.results
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((u: any) => u.type === 'person' && u.name && u.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((u: any) => ({ id: u.id, name: u.name }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => a.name.localeCompare(b.name))

    return NextResponse.json({ users: people })
  } catch (err) {
    console.error('[users]', err)
    return NextResponse.json({ users: [] })
  }
}
