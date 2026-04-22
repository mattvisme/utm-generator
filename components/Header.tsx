'use client'

export default function Header() {
  return (
    <header
      style={{
        background: 'var(--dark-header)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://www.visme.co/favicon-32x32.png"
          alt="Visme"
          width={22}
          height={22}
          style={{ borderRadius: '4px' }}
        />
        <h1
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 800,
            fontSize: '1.0625rem',
            color: '#fff',
            letterSpacing: '-0.01em',
          }}
        >
          UTM{' '}
          <span style={{ color: 'var(--accent)' }}>Generator</span>
        </h1>
        <span
          style={{
            marginLeft: '0.5rem',
            fontSize: '0.75rem',
            fontFamily: 'Lato, sans-serif',
            color: 'rgba(255,255,255,0.35)',
            fontWeight: 400,
          }}
        >
          Visme Internal Tool
        </span>
      </div>
    </header>
  )
}
