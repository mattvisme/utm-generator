import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import { NotionUser } from '@/types/utm'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

let cachedUsers: NotionUser[] | null = null
let cacheExpiresAt = 0

export async function GET() {
  // Serve from cache if still valid
  if (cachedUsers && Date.now() < cacheExpiresAt) {
    return NextResponse.json({ users: cachedUsers })
  }

  try {
    const notion = new Client({ auth: process.env.NOTION_API_KEY })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (notion.users as any).list({ page_size: 100 })

    const people: NotionUser[] = res.results
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((u: any) => u.type === 'person' && u.name && u.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((u: any) => ({ id: u.id, name: u.name }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => a.name.localeCompare(b.name))

    cachedUsers = people
    cacheExpiresAt = Date.now() + CACHE_TTL_MS

    return NextResponse.json({ users: people })
  } catch (err) {
    console.error('[users]', err)
    // Return stale cache rather than an empty list if Notion is temporarily unreachable
    return NextResponse.json({ users: cachedUsers ?? [] })
  }
}
