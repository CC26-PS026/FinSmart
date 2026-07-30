import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logoBase64 } from '../assets/logo'
import { adminAuthApi, setAdminToken } from '../api'

export default function AdminRegister() {
  const [name, setName]             = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !email.trim() || !password || !inviteCode.trim()) { setError('Semua field wajib diisi!'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Format email tidak valid'); return }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) { setError('Password minimal 8 karakter, mengandung huruf dan angka'); return }
    setLoading(true)
    try {
      const data = await adminAuthApi.register({ name: name.trim(), email: email.trim().toLowerCase(), password, inviteCode: inviteCode.trim() })
      setAdminToken(data.token)
      navigate('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'system-ui,sans-serif', background: '#F5F3FF' }}>
      <style>{`
        .admin-left { display: none !important; }
        .admin-logo-mobile { display: flex !important; }
        @media (min-width: 768px) {
          .admin-left { display: flex !important; }
          .admin-logo-mobile { display: none !important; }
        }
      `}</style>

      {/* Panel kiri — desktop only */}
      <div className="admin-left" style={{
        flex: 1, background: 'linear-gradient(160deg,#0F0A2E 0%,#1E1B4B 50%,#4C1D95 100%)',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: 48,
      }}>
        <img src={logoBase64} alt="FinSmart" style={{ width: 90, height: 90, borderRadius: 24, objectFit: 'cover', marginBottom: 28, boxShadow: '0 16px 48px rgba(124,58,237,0.5)' }} />
        <h1 style={{ color: 'white', fontWeight: 900, fontSize: 32, margin: '0 0 12px', textAlign: 'center' }}>Daftar Admin</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
          Daftarkan akun admin baru menggunakan kode undangan dari pengelola sistem.
        </p>
        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 300 }}>
          {['🔐 Butuh kode undangan', '🛡️ Akses penuh admin', '🚀 Langsung aktif setelah daftar'].map(t => (
            <div key={t} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 18px', color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 600 }}>{t}</div>
          ))}
        </div>
      </div>

      {/* Panel kanan — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px,5vw,48px)', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Logo mobile */}
          <div className="admin-logo-mobile" style={{ alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <img src={logoBase64} alt="FinSmart" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} />
            <span style={{ fontSize: 22, fontWeight: 900, color: '#1E1B4B' }}>Fin<span style={{ color: '#7C3AED' }}>Smart</span></span>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#7C3AED,#9333EA)', color: 'white', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, marginBottom: 14, boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
              🛡️ ADMIN PORTAL
            </div>
            <h2 style={{ fontSize: 'clamp(22px,5vw,28px)', fontWeight: 900, color: '#111827', margin: '0 0 6px' }}>Daftar Sebagai Admin 🚀</h2>
            <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>Butuh kode undangan dari pengelola sistem</p>
          </div>

          <div style={{ background: 'white', borderRadius: 20, padding: 'clamp(24px,5vw,32px)', boxShadow: '0 8px 40px rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.08)' }}>
            <form onSubmit={handleSubmit}>
              {[
                { label: 'Nama Lengkap', type: 'text', val: name, set: setName, ph: 'Nama admin' },
                { label: 'Email', type: 'email', val: email, set: setEmail, ph: 'admin@finsmart.id' },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = '#7C3AED'}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                </div>
              ))}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} placeholder="Min 8 karakter, huruf + angka" value={password}
                    onChange={e => setPassword(e.target.value)} autoComplete="new-password"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 44px 12px 14px', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = '#7C3AED'}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4 }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: '5px 0 0 2px' }}>Minimal 8 karakter, harus ada huruf dan angka</p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 6 }}>Kode Undangan Admin</label>
                <input type="password" placeholder="Kode dari pengelola sistem" value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)} autoComplete="off"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#7C3AED'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>

              <div style={{ background: '#F5F3FF', borderRadius: 12, padding: '10px 14px', marginBottom: 18, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16 }}>🔐</span>
                <p style={{ fontSize: 12, color: '#6D28D9', lineHeight: 1.5, margin: 0 }}>Akun admin memiliki akses penuh. Kode undangan diperoleh dari pengelola sistem FinSmart.</p>
              </div>

              {error && <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', color: '#DC2626', fontSize: 13, marginBottom: 14 }}>⚠️ {error}</div>}

              <button type="submit" disabled={loading}
                style={{ width: '100%', background: loading ? '#C4B5FD' : 'linear-gradient(135deg,#1E1B4B,#7C3AED)', color: 'white', border: 'none', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 8px 20px rgba(124,58,237,0.4)' }}>
                {loading ? '⏳ Memproses...' : '🛡️ Daftar & Masuk Dashboard'}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#6B7280' }}>
            Sudah punya akun admin?{' '}
            <span style={{ color: '#7C3AED', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/admin-login')}>Masuk di sini</span>
          </p>
          <p style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: '#6B7280' }}>
            <span style={{ color: '#7C3AED', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/login')}>← Kembali ke aplikasi</span>
          </p>
        </div>
      </div>
    </div>
  )
}