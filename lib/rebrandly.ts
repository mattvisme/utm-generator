export async function shortenUrl(url: string, slug?: string): Promise<string> {
  const apiKey = process.env.REBRANDLY_API_KEY
  if (!apiKey) throw new Error('REBRANDLY_API_KEY not configured')

  const body: Record<string, unknown> = { destination: url }
  if (slug) body.slashtag = slug

  // Set REBRANDLY_DOMAIN once the custom subdomain is ready — no code change needed
  const domain = process.env.REBRANDLY_DOMAIN
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
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { message?: string }).message || `Rebrandly error ${res.status}`)
  }

  const data = await res.json() as { shortUrl: string }
  return `https://${data.shortUrl}`
}
