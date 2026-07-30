import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logoBase64 } from '../assets/logo'
import { adminAuthApi, setAdminToken, getAdminToken } from '../api'
import { useEffect } from 'react'

export default function AdminLogin() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const navigate = useNavigate()

useEffect(() => {
  // jangan auto redirect kalau ada user token
}, [])

const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')
  if (!email.trim() || !password) { setError('Email dan password wajib diisi!'); return }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Format email tidak valid'); return }

  setLoading(true)
  try {
    const data = await adminAuthApi.login(email.trim().toLowerCase(), password)
    if (data.user?.role !== 'admin' && data.user?.role !== 'superadmin') {
      setError('Akun ini tidak memiliki hak akses admin.')
      setLoading(false)
      return
    }
    setAdminToken(data.token)
    if (data.user?.role === 'superadmin') {
      navigate('/superadmin')
    } else {
      navigate('/admin')
    }
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="app-shell auth-page">
      <div className="auth-content" style={{ padding: 'clamp(24px,6vw,40px) var(--page-padding)', animation: 'fadeIn 0.4s ease' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'clamp(20px,5vw,28px)' }}>
          <button onClick={() => navigate('/login')} style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 12, width: 38, height: 38, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>←</button>
          <div style={{ background: 'white', borderRadius: '16px', padding: '8px 14px', boxShadow: '0 4px 16px rgba(124,58,237,0.15)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <img src={logoBase64} alt="FinSmart" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6 }} />
            <span style={{ fontSize: 17, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Fin<span style={{ color: '#7C3AED' }}>Smart</span></span>
          </div>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#7C3AED,#9333EA)', color: 'white', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, marginBottom: 16, boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
          🛡️ ADMIN LOGIN
        </div>

        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 'clamp(22px,6vw,28px)', fontWeight: 900, marginBottom: 4, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Masuk Admin 🔐</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Masuk menggunakan akun admin yang terdaftar</p>
        </div>

        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'clamp(22px,5vw,32px)', border: '1px solid rgba(124,58,237,0.1)', boxShadow: '0 8px 40px rgba(124,58,237,0.1)' }}>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Email Admin</label>
              <input
                className="input-field"
                type="email"
                placeholder="admin@finsmart.id"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input-field"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password admin"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: 48 }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4 }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', color: '#DC2626', fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: 'linear-gradient(135deg,#7C3AED,#9333EA)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: 'clamp(14px,3.5vw,17px)', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(124,58,237,0.35)', fontFamily: 'var(--font-body)', marginTop: 4 }}
            >
              {loading ? <><div className="spinner" /> Memeriksa...</> : '🚀 Masuk ke Dashboard Admin'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--text-muted)' }}>
          Belum punya akun admin?{' '}
          <span style={{ color: 'var(--primary)', fontWeight: 800, cursor: 'pointer' }} onClick={() => navigate('/admin-register-request')}>Request akses</span>
        </p>
      </div>
    </div>
  )
}