'use client'

import { useState } from 'react'
import { GenerateResponse } from '@/types/utm'

const NOTION_DB_URL = 'https://www.notion.so/visme/34ad7facd2ae80469d62cb427f8e072c?v=34ad7facd2ae80e9a8f4000c69528090'

interface Props {
  result: GenerateResponse
  onReset: () => void
  notionUrl?: string
  shortUrl?: string
}

export default function SuccessState({ result, onReset, notionUrl, shortUrl }: Props) {
  const [copied, setCopied] = useState(false)
  const [copiedShort, setCopiedShort] = useState(false)
  const { suggestion, final_url } = result

  const copy = async () => {
    await navigator.clipboard.writeText(final_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyShort = async () => {
    if (!shortUrl) return
    await navigator.clipboard.writeText(shortUrl)
    setCopiedShort(true)
    setTimeout(() => setCopiedShort(false), 2000)
  }

  const badges = [
    { label: 'source', value: suggestion.utm_source },
    { label: 'medium', value: suggestion.utm_medium },
    { label: 'campaign', value: suggestion.utm_campaign },
  ]

  return (
    <div className="card" style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
      {/* Checkmark */}
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#DCFCE7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2
        style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          fontSize: '1.25rem',
          color: 'var(--text)',
          marginBottom: '0.5rem',
        }}
      >
        UTM link saved
      </h2>

      {/* Final URL */}
      <div style={{ margin: '1.25rem 0', textAlign: 'left' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', marginBottom: '0.5rem' }}>Final URL</p>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <code
            style={{
              flex: 1,
              background: '#f5f9fc',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.625rem 0.875rem',
              fontSize: '0.8125rem',
              color: 'var(--text)',
              wordBreak: 'break-all',
              lineHeight: '1.5',
              display: 'block',
              textAlign: 'left',
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

      {/* Short URL */}
      {shortUrl && (
        <div style={{ margin: '0 0 1.25rem', textAlign: 'left' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', marginBottom: '0.5rem' }}>Short URL</p>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <code
              style={{
                flex: 1,
                background: '#f0f7ff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.625rem 0.875rem',
                fontSize: '0.8125rem',
                color: 'var(--text)',
                wordBreak: 'break-all',
                lineHeight: '1.5',
                display: 'block',
                textAlign: 'left',
              }}
            >
              {shortUrl}
            </code>
            <button
              onClick={copyShort}
              className="btn-secondary"
              style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {copiedShort ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Badges */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {badges.map(({ label, value }) => (
          <span
            key={label}
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '0.25rem 0.75rem',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ color: 'var(--text-dim)' }}>{label}=</span>
            <span style={{ color: 'var(--text)', fontWeight: 700 }}>{value}</span>
          </span>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={onReset}
          className="btn-secondary"
          style={{ flex: 1, padding: '0.75rem 1rem', fontSize: '0.9375rem' }}
        >
          Generate Another
        </button>
        <a
          href={notionUrl || NOTION_DB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            fontSize: '0.9375rem',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {notionUrl ? 'View Record →' : 'View in Notion →'}
        </a>
      </div>
    </div>
  )
}
