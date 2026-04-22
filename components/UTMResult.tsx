'use client'

import { useState } from 'react'
import { GenerateResponse, FormData, PPC_CHANNELS, Channel } from '@/types/utm'
import PPCWarning from './PPCWarning'
import LoadingSpinner from './LoadingSpinner'

interface Props {
  result: GenerateResponse
  formData: FormData & { cleanUrl: string }
  onApprove: () => void
  onReject: () => void
  approving: boolean
}

export default function UTMResult({ result, formData, onApprove, onReject, approving }: Props) {
  const [copied, setCopied] = useState(false)
  const [reasoningOpen, setReasoningOpen] = useState(false)
  const { suggestion, final_url, truncated_campaign, similar_existing } = result
  const isPPC = PPC_CHANNELS.includes(formData.channel as Channel)

  const copy = async () => {
    await navigator.clipboard.writeText(final_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const params = [
    { key: 'utm_source', value: suggestion.utm_source },
    { key: 'utm_medium', value: suggestion.utm_medium },
    { key: 'utm_campaign', value: suggestion.utm_campaign },
    suggestion.utm_content ? { key: 'utm_content', value: suggestion.utm_content } : null,
    suggestion.utm_term ? { key: 'utm_term', value: suggestion.utm_term } : null,
    suggestion.vc_parameter ? { key: 'vc=', value: suggestion.vc_parameter } : null,
  ].filter(Boolean) as { key: string; value: string }[]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Main card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Two-column layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '0',
          }}
        >
          {/* Left: Input summary */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderRight: '1px solid var(--border-light)',
              background: '#fafcfe',
            }}
          >
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem', fontFamily: 'Lato, sans-serif' }}>
              Input Summary
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', marginBottom: '0.25rem' }}>Original URL</p>
                <p style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--text)', wordBreak: 'break-all' }}>
                  {formData.cleanUrl}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', marginBottom: '0.25rem' }}>Channel</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text)', fontFamily: 'Lato, sans-serif' }}>{formData.channel}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', marginBottom: '0.25rem' }}>Description</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text)', fontFamily: 'Lato, sans-serif', lineHeight: '1.5' }}>{formData.description}</p>
              </div>
            </div>
          </div>

          {/* Right: UTM params */}
          <div style={{ padding: '1.25rem 1.5rem' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem', fontFamily: 'Lato, sans-serif' }}>
              Suggested UTMs
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {params.map(({ key, value }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', minWidth: '110px', textTransform: 'lowercase' }}>
                    {key}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text)', fontFamily: 'monospace', fontWeight: 700 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {truncated_campaign && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontFamily: 'Lato, sans-serif' }}>
                Campaign name truncated to 30 characters.
              </p>
            )}

            {/* Reasoning toggle */}
            <button
              onClick={() => setReasoningOpen(!reasoningOpen)}
              style={{
                marginTop: '0.875rem',
                fontSize: '0.8125rem',
                color: 'var(--accent)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontFamily: 'Lato, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              {reasoningOpen ? '▾' : '▸'} Why these values?
            </button>
            {reasoningOpen && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.5rem', lineHeight: '1.5', fontFamily: 'Lato, sans-serif' }}>
                {suggestion.reasoning}
              </p>
            )}
          </div>
        </div>

        {/* Final URL */}
        <div
          style={{
            borderTop: '1px solid var(--border-light)',
            padding: '1rem 1.5rem',
            background: '#f5f9fc',
          }}
        >
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', marginBottom: '0.5rem' }}>Final URL</p>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <code
              style={{
                flex: 1,
                background: 'var(--surface)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.625rem 0.875rem',
                fontSize: '0.8125rem',
                color: 'var(--text)',
                wordBreak: 'break-all',
                lineHeight: '1.5',
                display: 'block',
              }}
            >
              {final_url}
            </code>
            <button
              onClick={copy}
              className="btn-secondary"
              style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* GA4 warning banner */}
      {suggestion.ga4_setup_required && (
        <div
          style={{
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 'var(--radius-sm)',
            padding: '0.875rem 1rem',
            color: '#92400E',
            fontFamily: 'Lato, sans-serif',
            fontSize: '0.875rem',
            lineHeight: '1.5',
          }}
        >
          <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>⚠️ GA4 Custom Setup Required</p>
          <p>
            <code style={{ background: 'rgba(0,0,0,0.08)', borderRadius: '3px', padding: '1px 4px' }}>
              utm_medium={suggestion.utm_medium}
            </code>{' '}
            is not a GA4 default channel. On approval, Matt (Analytics) will be notified via Slack
            to configure the custom channel group. This is a one-time setup per medium value.
          </p>
        </div>
      )}

      {/* PPC reminder */}
      {suggestion.ppc_warning && isPPC && <PPCWarning />}

      {/* Similar record warning */}
      {similar_existing && (
        <div
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            fontFamily: 'Lato, sans-serif',
          }}
        >
          A similar UTM link already exists in the database.{' '}
          <a
            href={similar_existing.notion_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent)', textDecoration: 'underline' }}
          >
            View it →
          </a>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={onApprove}
          className="btn-primary"
          style={{ flex: 1, padding: '0.75rem 1rem', fontSize: '0.9375rem' }}
          disabled={approving}
        >
          {approving ? <LoadingSpinner text="Saving to Notion..." /> : '✓ Approve & Save'}
        </button>
        <button
          onClick={onReject}
          className="btn-danger"
          style={{ flex: 1, padding: '0.75rem 1rem', fontSize: '0.9375rem' }}
          disabled={approving}
        >
          ✗ Reject — Try Again
        </button>
      </div>
    </div>
  )
}
