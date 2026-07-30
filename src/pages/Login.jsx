import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { logoBase64 } from '../assets/logo'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)

  // State 2FA
  const [phase, setPhase]         = useState('login')   // 'login' | '2fa'
  const [twoFaEmail, setTwoFaEmail] = useState('')
  const [otp, setOtp]             = useState(['','','','','',''])
  const [countdown, setCountdown] = useState(0)
  const inputRefs = Array.from({ length: 6 }, () => React.useRef(null))

  const { login, login2fa } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  // Countdown timer kirim ulang
  React.useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // ── Submit login biasa ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { toast('Isi email dan password dulu ya!', 'error'); return }
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.success) {
      toast('Selamat datang kembali! 👋', 'success')
      navigate('/dashboard')
    } else if (result.requires2fa) {
      setTwoFaEmail(result.email)
      setPhase('2fa')
      setCountdown(60)
      toast(`📧 Kode OTP dikirim ke ${result.email}`, 'success')
    } else {
      toast(result.error || 'Login gagal', 'error')
    }
  }

  // ── OTP input handler ─────────────────────────────────────────────
  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[i] = val; setOtp(next)
    if (val && i < 5) inputRefs[i + 1].current?.focus()
    if (!val && i > 0) inputRefs[i - 1].current?.focus()
  }
  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs[i - 1].current?.focus()
  }

  // ── Submit OTP 2FA ────────────────────────────────────────────────
  const handleVerify2fa = async () => {
    const entered = otp.join('')
    if (entered.length < 6) { toast('Masukkan 6 digit kode OTP', 'error'); return }
    setLoading(true)
    const result = await login2fa(twoFaEmail, entered)
    setLoading(false)
    if (result.success) {
      toast('Selamat datang kembali! 👋', 'success')
      navigate('/dashboard')
    } else {
      toast(result.error || 'Kode OTP salah', 'error')
      setOtp(['','','','','',''])
      inputRefs[0].current?.focus()
    }
  }

  // ── Kirim ulang OTP ───────────────────────────────────────────────
  const handleResend = async () => {
    setLoading(true)
    // Login ulang untuk trigger kirim OTP baru
    await login(email, password)
    setLoading(false)
    setOtp(['','','','','',''])
    setCountdown(60)
    toast(`📧 Kode baru dikirim ke ${twoFaEmail}`, 'success')
  }

  const logoHeader = (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(20px,5vw,28px)' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '12px 20px', boxShadow: '0 8px 32px rgba(124,58,237,0.18)', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        <img src={logoBase64} alt="FinSmart" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} />
        <span style={{ fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.5px' }}>
          Fin<span style={{ color: '#7C3AED' }}>Smart</span>
        </span>
      </div>
    </div>
  )

  return (
    <div className="app-shell auth-page">
      <div className="auth-content" style={{ padding: 'clamp(24px,6vw,40px) var(--page-padding)', animation: 'fadeIn 0.4s ease' }}>

        {logoHeader}

        {/* ── PHASE: LOGIN BIASA ── */}
        {phase === 'login' && (
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'clamp(24px,6vw,36px)', marginBottom: 16, border: '1px solid rgba(124,58,237,0.08)', boxShadow: '0 8px 40px rgba(124,58,237,0.1)' }}>
            <div style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 'clamp(22px,6vw,28px)', fontWeight: 900, marginBottom: 4, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                Pantau Cuanmu Di Sini 💰
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Masuk dan cek keuanganmu</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input className="input-field" type="email" placeholder="nama@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="input-group">
                <label className="input-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="input-field" type={showPass ? 'text' : 'password'} placeholder="Masukan password anda" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" style={{ paddingRight: 48 }} />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4 }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ padding: 'clamp(14px,3.5vw,17px)', fontSize: 16, marginTop: 4 }} disabled={loading}>
                {loading ? <div className="spinner" /> : 'Masuk ✨'}
              </button>
              <div style={{ textAlign: 'right', marginTop: 10 }}>
                <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }} onClick={() => navigate('/forgot-password')}>
                  Lupa Password?
                </span>
              </div>
            </form>
          </div>
        )}

        {/* ── PHASE: 2FA OTP ── */}
        {phase === '2fa' && (
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'clamp(24px,6vw,36px)', marginBottom: 16, border: '1px solid rgba(124,58,237,0.08)', boxShadow: '0 8px 40px rgba(124,58,237,0.1)' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛡️</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: 6 }}>
                Verifikasi 2 Langkah
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Kode OTP dikirim ke<br/>
                <strong style={{ color: 'var(--text)' }}>📧 {twoFaEmail}</strong>
              </p>
            </div>

            {/* OTP Boxes */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={inputRefs[i]}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  style={{
                    width: 44, height: 52, textAlign: 'center', fontSize: 22, fontWeight: 900,
                    border: `2px solid ${digit ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 10, background: digit ? '#F5F3FF' : 'white',
                    color: 'var(--text)', outline: 'none', fontFamily: 'var(--font-display)',
                    transition: 'all 0.15s'
                  }}
                />
              ))}
            </div>

            <button className="btn btn-primary w-full" style={{ padding: 16, marginBottom: 12 }} onClick={handleVerify2fa} disabled={loading}>
              {loading ? <div className="spinner" /> : '✅ Verifikasi & Masuk'}
            </button>

            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              {countdown > 0
                ? <span>Kirim ulang kode dalam <strong>{countdown}s</strong></span>
                : <button onClick={handleResend} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>🔄 Kirim Ulang Kode</button>
              }
            </div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }} onClick={() => setPhase('login')}>
                ‹ Kembali ke Login
              </span>
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
          Belum punya akun?{' '}
          <span style={{ color: 'var(--primary)', fontWeight: 800, cursor: 'pointer' }} onClick={() => navigate('/register')}>
            Daftar sekarang
          </span>
        </p>

      </div>

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .auth-content { flex: 1; display: flex; flex-direction: column; justify-content: center; }
      `}</style>
    </div>
  )
}