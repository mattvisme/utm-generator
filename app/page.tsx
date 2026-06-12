'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import InputForm from '@/components/InputForm'
import UTMResult from '@/components/UTMResult'
import SuccessState from '@/components/SuccessState'
import { AppState, FormData, GenerateResponse, SHORTLINK_CHANNELS, Channel } from '@/types/utm'

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>('input')
  const [formData, setFormData] = useState<(FormData & { cleanUrl: string }) | null>(null)
  const [generateResult, setGenerateResult] = useState<GenerateResponse | null>(null)
  const [generateError, setGenerateError] = useState('')
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [notionUrl, setNotionUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')        // preview URL shown on result screen
  const [shortSlug, setShortSlug] = useState<string | null>(null) // slug to create on approve
  const [shortening, setShortening] = useState(false)
  const [shortenError, setShortenError] = useState('')

  const handleGenerate = async (data: FormData & { cleanUrl: string }) => {
    setFormData(data)
    setGenerateError('')
    setLoading(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: data.cleanUrl,
          channel: data.channel,
          description: data.description,
          vc_parameter: data.vc_parameter || undefined,
          campaign_name: data.campaign_name || undefined,
          campaign_date: data.campaign_month
            ? `${['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'][parseInt(data.campaign_month) - 1]}_${data.campaign_year}`
            : undefined,
          cohort: data.cohort || undefined,
          ab_variant: data.is_ab_test && data.ab_variant ? data.ab_variant : undefined,
          affiliate_name: data.affiliate_name || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setGenerateError(json.error || 'Something went wrong generating UTMs. Please try again.')
        return
      }
      setGenerateResult(json)
      setAppState('result')
      // Check slug availability in the background for social channels (does NOT create the link yet)
      if (SHORTLINK_CHANNELS.includes(data.channel as Channel)) {
        setShortUrl('')
        setShortSlug(null)
        setShortenError('')
        setShortening(true)
        fetch('/api/shorten', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'check',
            url: json.final_url,
            custom_slug: data.custom_slug || undefined,
            utm_source: json.suggestion.utm_source,
            utm_campaign: json.suggestion.utm_campaign,
          }),
        })
          .then((r) => r.json())
          .then((sj) => {
            if (sj.short_url) { setShortUrl(sj.short_url); setShortSlug(sj.slug ?? null) }
            else setShortenError(sj.error || 'Could not check short link availability.')
          })
          .catch(() => setShortenError('Could not check short link availability.'))
          .finally(() => setShortening(false))
      } else {
        setShortUrl('')
        setShortSlug(null)
        setShortenError('')
      }
    } catch {
      setGenerateError('Something went wrong generating UTMs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!generateResult || !formData) return
    setApproving(true)
    setSaveError('')
    try {
      const { suggestion, final_url } = generateResult

      // Create the Rebrandly link now that the user has approved
      let confirmedShortUrl = ''
      if (shortUrl && SHORTLINK_CHANNELS.includes(formData.channel as Channel)) {
        try {
          const sr = await fetch('/api/shorten', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', url: final_url, slug: shortSlug }),
          })
          const sj = await sr.json()
          if (sj.short_url) confirmedShortUrl = sj.short_url
        } catch {
          // Non-fatal — save proceeds without the short URL
        }
      }

      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url_original: formData.cleanUrl,
          url_with_utm: final_url,
          description: formData.description,
          channel: formData.channel,
          utm_source: suggestion.utm_source,
          utm_medium: suggestion.utm_medium,
          utm_campaign: suggestion.utm_campaign,
          utm_content: suggestion.utm_content,
          utm_term: suggestion.utm_term,
          vc_parameter: suggestion.vc_parameter,
          ga4_setup_required: suggestion.ga4_setup_required,
          ga4_setup_reason: suggestion.ga4_setup_reason,
          reasoning: suggestion.reasoning,
          created_by_id: formData.created_by_id || undefined,
          created_by_name: formData.created_by_name || undefined,
          url_short: confirmedShortUrl || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setSaveError(json.error || 'Could not save to Notion. Copy your URL now.')
        return
      }
      setNotionUrl(json.notion_url)
      if (confirmedShortUrl) setShortUrl(confirmedShortUrl)
      setAppState('success')
    } catch {
      setSaveError('Could not save to Notion. Copy your URL now.')
    } finally {
      setApproving(false)
    }
  }

  const handleReject = () => {
    setGenerateResult(null)
    setGenerateError('')
    setShortUrl('')
    setShortSlug(null)
    setShortenError('')
    setAppState('input')
  }

  const handleReset = () => {
    setFormData(null)
    setGenerateResult(null)
    setGenerateError('')
    setSaveError('')
    setNotionUrl('')
    setShortUrl('')
    setShortSlug(null)
    setShortenError('')
    setAppState('input')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Header />

      <main style={{ flex: 1, padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>

          {/* State: Input */}
          {appState === 'input' && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <div style={{ marginBottom: '1.75rem' }}>
                <h2
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    color: 'var(--text)',
                    marginBottom: '0.375rem',
                  }}
                >
                  Generate a UTM link
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', fontFamily: 'Lato, sans-serif' }}>
                  Describe your link and Claude will apply Visme&apos;s UTM framework automatically.
                </p>
              </div>

              <div className="card" style={{ padding: '1.75rem 1.5rem' }}>
                <InputForm
                  onSubmit={handleGenerate}
                  loading={loading}
                  initialData={formData ?? undefined}
                />
                {generateError && (
                  <p
                    style={{
                      color: '#DC2626',
                      fontSize: '0.875rem',
                      marginTop: '1rem',
                      fontFamily: 'Lato, sans-serif',
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem 1rem',
                    }}
                  >
                    {generateError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* State: Result */}
          {appState === 'result' && generateResult && formData && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={handleReject}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontFamily: 'Lato, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: 0,
                  }}
                >
                  ← Back
                </button>
                <span style={{ color: 'var(--border)', fontSize: '1rem' }}>|</span>
                <h2
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 700,
                    fontSize: '1.125rem',
                    color: 'var(--text)',
                  }}
                >
                  UTM Suggestion
                </h2>
              </div>

              <UTMResult
                result={generateResult}
                formData={formData}
                onApprove={handleApprove}
                onReject={handleReject}
                approving={approving}
                shortUrl={shortUrl}
                shortening={shortening}
                shortenError={shortenError}
              />

              {saveError && (
                <div
                  style={{
                    marginTop: '1rem',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.875rem 1rem',
                    color: '#DC2626',
                    fontFamily: 'Lato, sans-serif',
                    fontSize: '0.875rem',
                  }}
                >
                  <strong>Save failed:</strong> {saveError}
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>Your URL (copy it now):</strong>
                    <br />
                    <code style={{ fontSize: '0.8125rem', wordBreak: 'break-all' }}>
                      {generateResult.final_url}
                    </code>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* State: Success */}
          {appState === 'success' && generateResult && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <SuccessState
                result={generateResult}
                onReset={handleReset}
                notionUrl={notionUrl}
                shortUrl={shortUrl}
              />
            </div>
          )}

        </div>
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
