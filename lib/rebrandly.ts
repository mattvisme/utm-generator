export async function shortenUrl(url: string, slug?: string): Promise<string> {
  const apiKey = process.env.REBRANDLY_API_KEY
  if (!apiKey) throw new Error('REBRANDLY_API_KEY not set')

  const domain = process.env.REBRANDLY_DOMAIN

  const body: Record<string, unknown> = { destination: url }
  if (slug) body.slashtag = slug
  if (domain) body.domain = { fullName: domain }

  const res = await fetch('https://api.rebrandly.com/v1/links', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
    },
    body: JSON.stringify(body),
  })

  if (res.status === 409) throw new Error('slug_conflict')
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Rebrandly error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return `https://${data.shortUrl}`
}
