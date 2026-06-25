'use client'

import { useState } from 'react'
import { GenerateResponse } from '@/types/utm'
import LoadingSpinner from './LoadingSpinner'

interface Props {
  result: GenerateResponse
  step: string
  stepIndex: number
  totalSteps: number
  stepUrl: string
  onApprove: () => void
  onSkip: () => void
  onCancel: () => void
  approving: boolean
  saveError?: string
}

export default function SequenceReview({
  result, step, stepIndex, totalSteps, stepUrl,
  onApprove, onSkip, onCancel, approving, saveError,
}: Props) {
  const [copied, setCopied] = useState(false)
  const { suggestion } = result

  const copy = async () => {
    await navigator.clipboard.writeText(stepUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const params = [
    { key: 'utm_source',   value: suggestion.utm_source },
    { key: 'utm_medium',   value: suggestion.utm_medium },
    { key: 'utm_campaign', value: suggestion.utm_campaign },
    { key: 'utm_content',  value: step },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Lato, sans-serif', marginBottom: '0.25rem' }}>
            Email Sequence — Step {stepIndex + 1} of {totalSteps}
          </p>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.125rem', color: 'var(--text)' }}>
            <code style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--accent)' }}>{step}</code>
          </h2>
        </div>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: i < stepIndex ? '#16A34A' : i === stepIndex ? 'var(--accent)' : 'var(--border)',
                transition: 'background 0.2s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* UTM params */}
        <div style={{ padding: '1.25rem 1.5rem' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem', fontFamily: 'Lato, sans-serif' }}>
            UTM Parameters
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {params.map(({ key, value }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', minWidth: '110px' }}>
                  {key}
                </span>
                <span style={{
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: key === 'utm_content' ? 'var(--accent)' : 'var(--text)',
                }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* URL */}
        <div style={{ borderTop: '1px solid var(--border-light)', padding: '1rem 1.5rem', background: '#f5f9fc' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>Final URL</p>
            <button
              onClick={copy}
              className="btn-secondary"
              style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
          <code style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.625rem 0.875rem',
            fontSize: '0.8125rem',
            color: 'var(--text)',
            wordBreak: 'break-all',
            lineHeight: '1.5',
            display: 'block',
          }}>
            {stepUrl}
          </code>
        </div>
      </div>

      {saveError && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          color: '#DC2626',
          fontSize: '0.875rem',
          fontFamily: 'Lato, sans-serif',
        }}>
          Save failed: {saveError}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={onApprove}
          className="btn-primary"
          style={{ flex: 1, padding: '0.75rem 1rem', fontSize: '0.9375rem' }}
          disabled={approving}
        >
          {approving ? <LoadingSpinner text="Saving..." /> : '✓ Approve & Save'}
        </button>
        <button
          onClick={onSkip}
          className="btn-secondary"
          style={{ flex: 1, padding: '0.75rem 1rem', fontSize: '0.9375rem' }}
          disabled={approving}
        >
          Skip →
        </button>
      </div>

      <button
        onClick={onCancel}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: '0.8125rem',
          fontFamily: 'Lato, sans-serif',
          padding: 0,
          textAlign: 'center' as const,
        }}
      >
        Cancel sequence
      </button>
    </div>
  )
}
