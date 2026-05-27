'use client'

import { useState, useEffect } from 'react'
import { FormData, NotionUser, CHANNELS, PPC_CHANNELS, COHORT_CHANNELS, MONTHS, Channel } from '@/types/utm'
import { isVismeUrl, stripUtmParams } from '@/lib/utm-utils'
import PPCWarning from './PPCWarning'
import LoadingSpinner from './LoadingSpinner'

interface Props {
  onSubmit: (data: FormData & { cleanUrl: string }) => void
  loading: boolean
  initialData?: Partial<FormData>
}

const currentYear = new Date().getFullYear()
const YEARS = [currentYear - 1, currentYear, currentYear + 1].map(String)

const toggleButtonStyle = (active: boolean) => ({
  flex: 1,
  padding: '0.5rem',
  borderRadius: 'var(--radius-sm)',
  border: active ? '2px solid var(--accent)' : '1px solid var(--border)',
  background: active ? 'var(--surface2)' : 'var(--surface)',
  color: active ? 'var(--accent-dark)' : 'var(--text-muted)',
  fontFamily: 'Lato, sans-serif',
  fontSize: '0.875rem',
  fontWeight: active ? 700 : 400,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
})

export default function InputForm({ onSubmit, loading, initialData }: Props) {
  const [url, setUrl] = useState(initialData?.url || '')
  const [channel, setChannel] = useState(initialData?.channel || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [vcParam, setVcParam] = useState(initialData?.vc_parameter || '')
  const [campaignName, setCampaignName] = useState(initialData?.campaign_name || '')
  const [campaignMonth, setCampaignMonth] = useState(initialData?.campaign_month || '')
  const [campaignYear, setCampaignYear] = useState(initialData?.campaign_year || String(currentYear))
  const [cohort, setCohort] = useState(initialData?.cohort || '')
  const [isAbTest, setIsAbTest] = useState(initialData?.is_ab_test || false)
  // Separate preset (a/b/c) and custom label so switching between them never
  // leaves stale text in the custom input
  const initVariant = initialData?.ab_variant || ''
  const [abPreset, setAbPreset] = useState(['a', 'b', 'c'].includes(initVariant) ? initVariant : '')
  const [abCustom, setAbCustom] = useState(['a', 'b', 'c'].includes(initVariant) ? '' : initVariant)
  const abVariant = abPreset || abCustom
  const [urlError, setUrlError] = useState('')
  const [urlNotice, setUrlNotice] = useState('')

  // Created by
  const [users, setUsers] = useState<NotionUser[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [createdById, setCreatedById] = useState(initialData?.created_by_id || '')
  const [createdByName, setCreatedByName] = useState(initialData?.created_by_name || '')

  const [affiliateName, setAffiliateName] = useState(initialData?.affiliate_name || '')

  const isPPC = PPC_CHANNELS.includes(channel as Channel)
  const showCohort = COHORT_CHANNELS.includes(channel as Channel)
  const isAffiliate = channel === 'Affiliate / Partner'

  // Fetch user list once on mount
  useEffect(() => {
    setUsersLoading(true)
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => { setUsers(data.users || []); setUsersLoading(false) })
      .catch(() => { setUsers([]); setUsersLoading(false) })
  }, [])

  // No localStorage restore — Created By is required and must be chosen each session

  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '')
      setDescription(initialData.description || '')
    }
  }, [initialData])

  useEffect(() => {
    if (!showCohort) setCohort('')
  }, [showCohort])

  useEffect(() => {
    if (!isAffiliate) setAffiliateName('')
  }, [isAffiliate])

  useEffect(() => {
    if (!isAbTest) { setAbPreset(''); setAbCustom('') }
  }, [isAbTest])

  const handleUserChange = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (user) {
      setCreatedById(user.id)
      setCreatedByName(user.name)
    } else {
      setCreatedById('')
      setCreatedByName('')
    }
  }

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
    onSubmit({
      url,
      channel,
      description,
      vc_parameter: vcParam,
      campaign_name: campaignName,
      campaign_month: campaignMonth,
      campaign_year: campaignYear,
      cohort,
      is_ab_test: isAbTest,
      ab_variant: abVariant,
      created_by_id: createdById,
      created_by_name: createdByName,
      affiliate_name: affiliateName,
      cleanUrl: base,
    })
  }

  const isValid = url && channel && channel !== '-- Select a channel --' && description && createdById && !urlError && (!isAffiliate || affiliateName)

  const fieldLabel = (text: string, optional = false) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.375rem' }}>
      <label className="label" style={{ margin: 0 }}>{text}</label>
      {optional && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'Lato, sans-serif' }}>
          optional
        </span>
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Created by */}
      <div>
        {fieldLabel('Created by')}
        <select
          className="input-field"
          value={createdById}
          onChange={(e) => handleUserChange(e.target.value)}
          disabled={loading || usersLoading}
          style={{ cursor: usersLoading ? 'wait' : 'pointer' }}
        >
          <option value="">{usersLoading ? 'Loading team members…' : '-- Select your name --'}</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

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

      {/* Affiliate name — conditional on Affiliate / Partner channel */}
      {isAffiliate && (
        <div>
          {fieldLabel('Affiliate / Partner Name')}
          <input
            id="affiliate_name"
            type="text"
            className="input-field"
            placeholder="e.g. John Smith or buffer"
            value={affiliateName}
            onChange={(e) =>
              setAffiliateName(
                e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_')
              )
            }
            disabled={loading}
            required
          />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.375rem', fontFamily: 'Lato, sans-serif' }}>
            Sets <code style={{ background: '#f0f0f0', padding: '1px 4px', borderRadius: '3px' }}>utm_source=affiliate_{affiliateName || 'name'}</code>
          </p>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="label" htmlFor="description">
          What is this link for? <span style={{ color: '#DC2626' }}>*</span>
        </label>
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

      {/* Campaign name */}
      <div>
        {fieldLabel('Campaign Name', true)}
        <input
          id="campaign_name"
          type="text"
          className="input-field"
          placeholder="e.g. spring_promo — leave blank for Claude to suggest"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_'))}
          disabled={loading}
        />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.375rem', fontFamily: 'Lato, sans-serif' }}>
          Lowercase, underscores only. If blank, one will be suggested for you.
        </p>
      </div>

      {/* Campaign date */}
      <div>
        {fieldLabel('Campaign Date', true)}
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <select
            className="input-field"
            value={campaignMonth}
            onChange={(e) => setCampaignMonth(e.target.value)}
            disabled={loading}
            style={{ cursor: 'pointer', flex: 1 }}
          >
            <option value="">-- Month --</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            className="input-field"
            value={campaignYear}
            onChange={(e) => setCampaignYear(e.target.value)}
            disabled={loading}
            style={{ cursor: 'pointer', flex: 1 }}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.375rem', fontFamily: 'Lato, sans-serif' }}>
          Appended to campaign name as a suffix, e.g. <code style={{ background: '#f0f0f0', padding: '1px 4px', borderRadius: '3px' }}>_apr_2026</code>
        </p>
      </div>

      {/* A/B test variant */}
      <div>
        {fieldLabel('A/B Test', true)}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setIsAbTest(!isAbTest)}
            disabled={loading}
            style={{
              ...toggleButtonStyle(isAbTest),
              flex: 'none',
              padding: '0.5rem 1rem',
            }}
          >
            {isAbTest ? '✓ A/B test variant' : 'Mark as A/B test variant'}
          </button>
        </div>

        {isAbTest && (
          <div style={{ marginTop: '0.75rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '0.5rem', fontFamily: 'Lato, sans-serif' }}>
              Variant label — goes into <code style={{ background: '#f0f0f0', padding: '1px 4px', borderRadius: '3px' }}>utm_content</code>
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['a', 'b', 'c'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => { setAbPreset(v); setAbCustom('') }}
                  disabled={loading}
                  style={{ ...toggleButtonStyle(abPreset === v), flex: 'none', padding: '0.4rem 0.875rem' }}
                >
                  Variant {v.toUpperCase()}
                </button>
              ))}
              <input
                type="text"
                className="input-field"
                placeholder="or custom label"
                value={abCustom}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_')
                  setAbPreset('')
                  setAbCustom(val)
                }}
                disabled={loading}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Cohort — conditional on Email/Newsletter and Product Feature */}
      {showCohort && (
        <div>
          {fieldLabel('Target Audience', true)}
          <div style={{ display: 'flex', gap: '0.625rem' }}>
            {(['', 'managed', 'unmanaged'] as const).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setCohort(val)}
                disabled={loading}
                style={toggleButtonStyle(cohort === val)}
              >
                {val === '' ? 'Both' : val.charAt(0).toUpperCase() + val.slice(1)}
              </button>
            ))}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.375rem', fontFamily: 'Lato, sans-serif' }}>
            Whether this link targets managed or unmanaged accounts.
          </p>
        </div>
      )}

      {/* vc= field (PPC only) */}
      {isPPC && (
        <div>
          {fieldLabel('vc= parameter', true)}
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
          <LoadingSpinner text="Generating UTMs..." />
        ) : (
          'Generate UTMs →'
        )}
      </button>
    </form>
  )
}
