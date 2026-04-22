'use client'

import { useState, useEffect } from 'react'
import { FormData, CHANNELS, PPC_CHANNELS, Channel } from '@/types/utm'
import { isVismeUrl, stripUtmParams } from '@/lib/utm-utils'
import PPCWarning from './PPCWarning'
import LoadingSpinner from './LoadingSpinner'

interface Props {
  onSubmit: (data: FormData & { cleanUrl: string }) => void
  loading: boolean
  initialData?: Partial<FormData>
}

export default function InputForm({ onSubmit, loading, initialData }: Props) {
  const [url, setUrl] = useState(initialData?.url || '')
  const [channel, setChannel] = useState(initialData?.channel || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [vcParam, setVcParam] = useState(initialData?.vc_parameter || '')
  const [urlError, setUrlError] = useState('')
  const [urlNotice, setUrlNotice] = useState('')

  const isPPC = PPC_CHANNELS.includes(channel as Channel)

  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '')
      setDescription(initialData.description || '')
    }
  }, [initialData])

  const handleUrlBlur = () => {
    if (!url) return
    if (!isVismeUrl(url)) {
      setUrlError('This tool is for visme.co URLs only.')
      setUrlNotice('')
      return
    }
    setUrlError('')
    const { hadUtms } = stripUtmParams(url)
    setUrlNotice(hadUtms ? 'Existing UTM parameters were removed. New ones will be generated.' : '')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url || !channel || channel === '-- Select a channel --' || !description) return
    if (!isVismeUrl(url)) {
      setUrlError('This tool is for visme.co URLs only.')
      return
    }
    const { base } = stripUtmParams(url)
    onSubmit({ url, channel, description, vc_parameter: vcParam, cleanUrl: base })
  }

  const isValid =
    url &&
    channel &&
    channel !== '-- Select a channel --' &&
    description &&
    !urlError

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* URL */}
      <div>
        <label className="label" htmlFor="url">Destination URL</label>
        <input
          id="url"
          type="url"
          className={`input-field${urlError ? ' error' : ''}`}
          placeholder="https://www.visme.co/..."
          value={url}
          onChange={(e) => { setUrl(e.target.value); setUrlError('') }}
          onBlur={handleUrlBlur}
          disabled={loading}
          required
        />
        {urlError && (
          <p style={{ color: '#DC2626', fontSize: '0.8125rem', marginTop: '0.375rem', fontFamily: 'Lato, sans-serif' }}>
            {urlError}
          </p>
        )}
        {urlNotice && !urlError && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.375rem', fontFamily: 'Lato, sans-serif' }}>
            {urlNotice}
          </p>
        )}
      </div>

      {/* Channel */}
      <div>
        <label className="label" htmlFor="channel">Channel</label>
        <select
          id="channel"
          className="input-field"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          disabled={loading}
          required
          style={{ cursor: 'pointer' }}
        >
          {CHANNELS.map((c) => (
            <option key={c} value={c} disabled={c === '-- Select a channel --'}>
              {c}
            </option>
          ))}
        </select>
        {isPPC && (
          <div style={{ marginTop: '0.75rem' }}>
            <PPCWarning />
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="label" htmlFor="description">What is this link for?</label>
        <textarea
          id="description"
          className="input-field"
          placeholder="e.g. April newsletter — link to the infographics template page, hero CTA button"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          rows={3}
          required
          style={{ resize: 'vertical', minHeight: '80px' }}
        />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.375rem', fontFamily: 'Lato, sans-serif' }}>
          Be specific. The more context you give, the better the UTM suggestion.
        </p>
      </div>

      {/* vc= field (PPC only) */}
      {isPPC && (
        <div>
          <label className="label" htmlFor="vc">vc= parameter (optional)</label>
          <input
            id="vc"
            type="text"
            className="input-field"
            placeholder="e.g. pmax-whitepapers"
            value={vcParam}
            onChange={(e) => setVcParam(e.target.value)}
            disabled={loading}
          />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.375rem', fontFamily: 'Lato, sans-serif' }}>
            Visme&apos;s custom PPC tracking value. Leave blank if not applicable.
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="btn-primary"
        style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem', width: '100%' }}
        disabled={loading || !isValid}
      >
        {loading ? (
          <LoadingSpinner text="Analysing with Claude..." />
        ) : (
          'Generate UTMs →'
        )}
      </button>
    </form>
  )
}
