const REBRANDLY_API = 'https://api.rebrandly.com/v1'

function getCredentials() {
  const apiKey = process.env.REBRANDLY_API_KEY
  if (!apiKey) throw new Error('REBRANDLY_API_KEY not set')
  return { apiKey, domain: process.env.REBRANDLY_DOMAIN }
}

export async function checkSlugAvailable(slug: string): Promise<boolean> {
  const { apiKey, domain } = getCredentials()
  const params = new URLSearchParams({ slashtag: slug })
  if (domain) params.set('domain.fullName', domain)

  const res = await fetch(`${REBRANDLY_API}/links?${params}`, {
    headers: { apikey: apiKey },
  })
  if (!res.ok) throw new Error(`Rebrandly check error ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) && data.length === 0
}

export async function createShortLink(url: string, slug?: string): Promise<string> {
  const { apiKey, domain } = getCredentials()

  const body: Record<string, unknown> = { destination: url }
  if (slug) body.slashtag = slug
  if (domain) body.domain = { fullName: domain }

  const res = await fetch(`${REBRANDLY_API}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: apiKey },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    if (text.includes('AlreadyExists')) throw new Error('slug_conflict')
    throw new Error(`Rebrandly error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return `https://${data.shortUrl}`
}
