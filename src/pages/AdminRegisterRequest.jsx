import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { logoBase64 } from '../assets/logo'
import { adminAuthApi } from '../api'

export default function AdminRegisterRequest() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '', reason: '' })
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)

  const handleChange = e => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setError('') }

  const handleSubmit = async () => {
    const { name, email, password, confirm, reason } = form
    if (!name.trim() || !email.trim() || !password) return setError('Nama, email, dan password wajib diisi.')
    if (password !== confirm) return setError('Konfirmasi password tidak cocok.')
    if (password.length < 8 || !/(?=.*[A-Za-z])(?=.*\d)/.test(password)) return setError('Password minimal 8 karakter, mengandung huruf dan angka.')
    setLoading(true)
    try {
      await adminAuthApi.registerRequest({ name: name.trim(), email: email.trim().toLowerCase(), password, reason: reason.trim() })
      setSuccess(true)
    } catch (e) { setError(e.message || 'Terjadi kesalahan. Coba lagi.') }
    setLoading(false)
  }

  if (success) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0F0A2E,#1E1B4B,#312E81)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ background: 'white', borderRadius: 24, padding: 'clamp(28px,6vw,48px)', maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontWeight: 900, fontSize: 22, marginBottom: 8, color: '#111827' }}>Permintaan Terkirim!</h2>
        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>Permintaan pendaftaran admin kamu berhasil dikirim.</p>
        <div style={{ background: '#EDE9FE', borderRadius: 14, padding: '14px 18px', marginBottom: 28, textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#5B21B6', fontWeight: 700 }}>⏳ Menunggu persetujuan Super Admin</p>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6D28D9' }}>Super Admin akan meninjau permintaanmu. Jika disetujui, akunmu akan langsung aktif.</p>
        </div>
        <button onClick={() => navigate('/admin-login')}
          style={{ width: '100%', background: 'linear-gradient(135deg,#1E1B4B,#7C3AED)', color: 'white', border: 'none', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(124,58,237,0.4)' }}>
          Ke Halaman Login Admin
        </button>
      </div>
    </div>
  )

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
        <h1 style={{ color: 'white', fontWeight: 900, fontSize: 32, margin: '0 0 12px', textAlign: 'center' }}>Request Admin</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
          Ajukan permintaan akses admin. Super Admin akan meninjau dan menyetujui akun kamu.
        </p>
        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 300 }}>
          {['📋 Isi formulir pendaftaran', '⏳ Tunggu persetujuan Super Admin', '✅ Login setelah disetujui'].map((t, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 18px', color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 600 }}>{t}</div>
          ))}
        </div>
      </div>

      {/* Panel kanan — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px,5vw,48px)', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* Logo mobile */}
          <div className="admin-logo-mobile" style={{ alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <img src={logoBase64} alt="FinSmart" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} />
            <span style={{ fontSize: 22, fontWeight: 900, color: '#1E1B4B' }}>Fin<span style={{ color: '#7C3AED' }}>Smart</span></span>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#7C3AED,#9333EA)', color: 'white', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, marginBottom: 14, boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
              📋 REQUEST AKSES
            </div>
            <h2 style={{ fontSize: 'clamp(22px,5vw,28px)', fontWeight: 900, color: '#111827', margin: '0 0 6px' }}>Request Akses Admin</h2>
            <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>Permintaanmu akan ditinjau oleh Super Admin</p>
          </div>

          <div style={{ background: 'white', borderRadius: 20, padding: 'clamp(24px,5vw,32px)', boxShadow: '0 8px 40px rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.08)' }}>

            <div style={{ background: '#FEF3C7', borderRadius: 12, padding: '10px 14px', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'flex-start', border: '1px solid #FDE68A' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
              <p style={{ margin: 0, fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>Akun akan dibuat oleh Super Admin setelah disetujui. Kamu bisa login dengan email & password yang didaftarkan.</p>
            </div>

            {error && <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 16, border: '1px solid #FCA5A5' }}>⚠️ {error}</div>}

            {[
              { name: 'name', label: 'Nama Lengkap', type: 'text', ph: 'Nama kamu' },
              { name: 'email', label: 'Email', type: 'email', ph: 'email@contoh.com' },
            ].map(f => (
              <div key={f.name} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 6 }}>{f.label}</label>
                <input name={f.name} type={f.type} placeholder={f.ph} value={form[f.name]} onChange={handleChange}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#7C3AED'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>
            ))}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input name="password" type={showPw ? 'text' : 'password'} placeholder="Min. 8 karakter, huruf + angka" value={form.password} onChange={handleChange}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 44px 12px 14px', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#7C3AED'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4 }}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 6 }}>Konfirmasi Password</label>
              <div style={{ position: 'relative' }}>
                <input name="confirm" type={showPw ? 'text' : 'password'} placeholder="Ulangi password" value={form.confirm} onChange={handleChange}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: `1.5px solid ${form.confirm && form.confirm !== form.password ? '#EF4444' : '#E5E7EB'}`, borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => { if (!form.confirm || form.confirm === form.password) e.target.style.borderColor = '#7C3AED' }}
                  onBlur={e => { e.target.style.borderColor = form.confirm && form.confirm !== form.password ? '#EF4444' : '#E5E7EB' }} />
              </div>
              {form.confirm && form.confirm !== form.password && <p style={{ fontSize: 12, color: '#EF4444', margin: '4px 0 0 4px' }}>Password tidak cocok</p>}
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 6 }}>
                Alasan <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opsional)</span>
              </label>
              <textarea name="reason" placeholder="Jelaskan mengapa kamu membutuhkan akses admin..." value={form.reason} onChange={handleChange} rows={3}
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
                onFocus={e => e.target.style.borderColor = '#7C3AED'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
            </div>

            <button onClick={handleSubmit} disabled={loading}
              style={{ width: '100%', background: loading ? '#C4B5FD' : 'linear-gradient(135deg,#1E1B4B,#7C3AED)', color: 'white', border: 'none', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 8px 20px rgba(124,58,237,0.4)' }}>
              {loading ? '⏳ Mengirim permintaan...' : '📋 Kirim Permintaan'}
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#6B7280' }}>
            Sudah punya akun admin?{' '}
            <Link to="/admin-login" style={{ color: '#7C3AED', fontWeight: 700, textDecoration: 'none' }}>Login di sini</Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: '#6B7280' }}>
            <span style={{ color: '#7C3AED', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/login')}>← Kembali ke aplikasi</span>
          </p>
        </div>
      </div>
    </div>
  )
}