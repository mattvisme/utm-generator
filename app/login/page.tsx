'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        localStorage.setItem(
          'utm_authenticated',
          JSON.stringify({ authenticated: true, timestamp: Date.now() })
        )
        router.push('/')
      } else {
        setError('Incorrect password. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ background: 'var(--dark-header)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div
          style={{
            maxWidth: '480px',
            margin: '0 auto',
            padding: '0 1.5rem',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://www.visme.co/favicon-32x32.png" alt="Visme" width={22} height={22} style={{ borderRadius: '4px' }} />
          <span
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 800,
              fontSize: '1.0625rem',
              color: '#fff',
            }}
          >
            UTM <span style={{ color: 'var(--accent)' }}>Generator</span>
          </span>
        </div>
      </header>

      {/* Login card */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
        }}
      >
        <div
          className="card"
          style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.visme.co/favicon-32x32.png"
              alt="Visme"
              width={40}
              height={40}
              style={{ borderRadius: '8px', marginBottom: '1rem' }}
            />
            <h1
              style={{
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 800,
                fontSize: '1.5rem',
                color: 'var(--text)',
                marginBottom: '0.5rem',
              }}
            >
              UTM Generator
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', fontFamily: 'Lato, sans-serif' }}>
              Visme Internal Tool
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={`input-field${error ? ' error' : ''}`}
                placeholder="Enter access password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                disabled={loading}
                autoComplete="current-password"
                required
              />
              {error && (
                <p style={{ color: '#DC2626', fontSize: '0.8125rem', marginTop: '0.375rem', fontFamily: 'Lato, sans-serif' }}>
                  {error}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '0.75rem', fontSize: '0.9375rem', width: '100%', marginTop: '0.25rem' }}
              disabled={loading || !password}
            >
              {loading ? 'Checking...' : 'Access Tool'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
