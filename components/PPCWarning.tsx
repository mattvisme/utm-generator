'use client'

export default function PPCWarning() {
  return (
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
      <p style={{ fontWeight: 700, marginBottom: '0.375rem' }}>
        ⚠️ Google Ads / Bing Ads — Important
      </p>
      <p>
        Google and Microsoft auto-tag every ad click with GCLID / msclkid. Using manual UTMs in
        your ad destination URL can conflict with this auto-tagging and break cost data in GA4.
      </p>
      <p style={{ marginTop: '0.5rem' }}>
        These UTMs should be placed in the{' '}
        <strong>&ldquo;Final URL Suffix&rdquo;</strong> field in your ads platform — not in the destination URL
        itself. Confirm with your PPC setup before using this link.
      </p>
    </div>
  )
}
