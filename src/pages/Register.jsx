import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { logoBase64 } from '../assets/logo'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !password) { toast('Lengkapi semua field ya!', 'error'); return }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) { toast('Password minimal 8 karakter, harus ada huruf dan angka', 'error'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Format email tidak valid', 'error'); return }
    setLoading(true)
    const result = await register(name, email, password)
    setLoading(false)
    if (result.success) {
      toast('Akun berhasil dibuat! 🎉', 'success')
      navigate('/dashboard')
    } else {
      toast(result.error || 'Gagal mendaftar, coba lagi', 'error')
    }
  }

  return (
    <div className="app-shell auth-page">
      <div className="auth-content" style={{ animation: 'fadeIn 0.4s ease' }}>

        {/* Logo + Back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'clamp(16px,4vw,24px)' }}>
          <button className="back-btn" onClick={() => navigate('/login')}>←</button>
          <img src={logoBase64} alt="FinSmart" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <span style={{ fontWeight: 900, fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--primary)' }}>FinSmart</span>
        </div>

        <div style={{ marginBottom: 'clamp(16px,4vw,20px)' }}>
          <h2 style={{ fontSize: 'clamp(22px,6vw,30px)', fontWeight: 900, marginBottom: 4, fontFamily: 'var(--font-display)' }}>Buat Akun 🚀</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Mulai perjalanan finansialmu bersama FinSmart!</p>
        </div>

        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'clamp(20px,5vw,28px)', border: '1px solid rgba(124,58,237,0.1)', boxShadow: '0 8px 40px rgba(124,58,237,0.1)' }}>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Nama Lengkap</label>
              <input
                className="input-field"
                placeholder="Nama kamu"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                className="input-field"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input-field"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min 8 karakter, huruf + angka"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{ paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4 }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>Minimal 8 karakter, harus ada huruf dan angka</div>
            </div>

            {/* Info chips */}
            <div style={{ background: '#F5F3FF', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 16 }}>🔒</span>
              <p style={{ fontSize: 12, color: '#6D28D9', lineHeight: 1.5, margin: 0 }}>
                Data kamu aman. Akun baru otomatis tercatat di sistem FinSmart.
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{ padding: 'clamp(13px,3vw,16px)', marginTop: 4 }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <div className="spinner" /> Membuat akun...
                </span>
              ) : 'Daftar Sekarang 🎯'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 'clamp(14px,4vw,20px)', fontSize: 14, color: 'var(--text-muted)' }}>
          Sudah punya akun?{' '}
          <span style={{ color: 'var(--primary)', fontWeight: 800, cursor: 'pointer' }} onClick={() => navigate('/login')}>Masuk</span>
        </p>
      </div>
    </div>
  )
}
