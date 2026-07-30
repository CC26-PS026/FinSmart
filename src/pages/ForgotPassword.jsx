import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import { logoBase64 } from '../assets/logo'
import { authApi } from '../api'

// Step states: 'email' | 'otp' | 'reset' | 'success'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const toast = useToast()

  const [step, setStep] = useState('email')
  const [loading, setLoading] = useState(false)

  // Form values
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // ── Step 1: Kirim Email ───────────────────────────────────────────
  const handleSendEmail = async (e) => {
    e.preventDefault()
    if (!email) { toast('Masukkan email kamu dulu ya!', 'error'); return }
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      toast('Kode OTP sudah dikirim ke emailmu 📧', 'success')
      setStep('otp')
    } catch (err) {
      toast(err.message || 'Email tidak ditemukan', 'error')
    }
    setLoading(false)
  }

  // ── Step 2: Verifikasi OTP ────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) { toast('Masukkan 6 digit kode OTP ya!', 'error'); return }
    setLoading(true)
    try {
      await authApi.verifyOtp(email, code)
      toast('Kode OTP berhasil diverifikasi ✅', 'success')
      setStep('reset')
    } catch (err) {
      toast(err.message || 'Kode OTP salah atau sudah kadaluarsa', 'error')
    }
    setLoading(false)
  }

  const handleResendOtp = async () => {
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      toast('Kode OTP baru sudah dikirim ulang 📧', 'success')
      setOtp(['', '', '', '', '', ''])
    } catch (err) {
      toast(err.message || 'Gagal kirim ulang OTP', 'error')
    }
    setLoading(false)
  }

  // ── Step 3: Reset Password ────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!newPassword || !confirmPassword) { toast('Lengkapi semua field dulu ya!', 'error'); return }
    if (newPassword.length < 6) { toast('Password minimal 6 karakter ya!', 'error'); return }
    if (newPassword !== confirmPassword) { toast('Password tidak cocok nih!', 'error'); return }
    setLoading(true)
    try {
      await authApi.resetPassword(email, otp.join(''), newPassword)
      toast('Password berhasil diubah! 🎉', 'success')
      setStep('success')
    } catch (err) {
      toast(err.message || 'Gagal mengubah password', 'error')
    }
    setLoading(false)
  }

  // ── Progress indicator ────────────────────────────────────────────
  const steps = ['email', 'otp', 'reset']
  const stepIndex = steps.indexOf(step)

  const stepLabels = ['Email', 'Verifikasi', 'Password Baru']

  return (
    <div className="app-shell auth-page">
      <div
        className="auth-content"
        style={{
          padding: 'clamp(24px,6vw,40px) var(--page-padding)',
          animation: 'fadeIn 0.4s ease',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(20px,5vw,28px)' }}>
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '12px 20px',
              boxShadow: '0 8px 32px rgba(124,58,237,0.18)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <img
              src={logoBase64}
              alt="FinSmart"
              style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }}
            />
            <span
              style={{
                fontSize: 22,
                fontWeight: 900,
                fontFamily: 'var(--font-display)',
                color: 'var(--text)',
                letterSpacing: '-0.5px',
              }}
            >
              Fin<span style={{ color: '#7C3AED' }}>Smart</span>
            </span>
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: 'clamp(24px,6vw,36px)',
            marginBottom: 16,
            border: '1px solid rgba(124,58,237,0.08)',
            boxShadow: '0 8px 40px rgba(124,58,237,0.1)',
          }}
        >
          {/* Progress steps — hanya tampil kalau belum success */}
          {step !== 'success' && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28, gap: 0 }}>
              {stepLabels.map((label, i) => {
                const isActive = i === stepIndex
                const isDone = i < stepIndex
                return (
                  <React.Fragment key={i}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: i < 2 ? 0 : 'none' }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          fontWeight: 800,
                          transition: 'all 0.3s ease',
                          background: isDone
                            ? 'var(--success)'
                            : isActive
                            ? 'var(--primary)'
                            : 'var(--border)',
                          color: isDone || isActive ? 'white' : 'var(--text-muted)',
                          boxShadow: isActive ? '0 4px 12px rgba(124,58,237,0.35)' : 'none',
                        }}
                      >
                        {isDone ? '✓' : i + 1}
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          marginTop: 4,
                          fontWeight: 700,
                          color: isActive ? 'var(--primary)' : isDone ? 'var(--success)' : 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div
                        style={{
                          flex: 1,
                          height: 2,
                          marginBottom: 18,
                          background: i < stepIndex ? 'var(--success)' : 'var(--border)',
                          transition: 'background 0.3s ease',
                        }}
                      />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          )}

          {/* ── STEP: EMAIL ── */}
          {step === 'email' && (
            <div style={{ animation: 'slideInRight 0.35s ease' }}>
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🔑</div>
                <h2
                  style={{
                    fontSize: 'clamp(20px,5.5vw,26px)',
                    fontWeight: 900,
                    marginBottom: 6,
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text)',
                  }}
                >
                  Lupa Password?
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.5 }}>
                  Tenang aja! Masukkan email kamu dan kami akan kirim kode verifikasi.
                </p>
              </div>

              <form onSubmit={handleSendEmail}>
                <div className="input-group">
                  <label className="input-label">Alamat Email</label>
                  <input
                    className="input-field"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  style={{ padding: 'clamp(14px,3.5vw,17px)', fontSize: 16, marginTop: 4 }}
                  disabled={loading}
                >
                  {loading ? <div className="spinner" /> : 'Kirim Kode OTP 📧'}
                </button>
              </form>
            </div>
          )}

          {/* ── STEP: OTP ── */}
          {step === 'otp' && (
            <div style={{ animation: 'slideInRight 0.35s ease' }}>
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📲</div>
                <h2
                  style={{
                    fontSize: 'clamp(20px,5.5vw,26px)',
                    fontWeight: 900,
                    marginBottom: 6,
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text)',
                  }}
                >
                  Cek Emailmu!
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.5 }}>
                  Kode 6 digit sudah dikirim ke{' '}
                  <strong style={{ color: 'var(--primary)' }}>{email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp}>
                <label className="input-label" style={{ marginBottom: 12, display: 'block' }}>
                  Kode OTP
                </label>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      style={{
                        width: 44,
                        height: 52,
                        textAlign: 'center',
                        fontSize: 22,
                        fontWeight: 800,
                        fontFamily: 'var(--font-display)',
                        border: `2px solid ${digit ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)',
                        outline: 'none',
                        background: digit ? 'var(--primary-xlight)' : 'white',
                        color: 'var(--text)',
                        transition: 'all 0.2s ease',
                        boxShadow: digit ? '0 2px 8px rgba(124,58,237,0.15)' : 'none',
                      }}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  style={{ padding: 'clamp(14px,3.5vw,17px)', fontSize: 16 }}
                  disabled={loading}
                >
                  {loading ? <div className="spinner" /> : 'Verifikasi Kode ✅'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Tidak dapat kode?{' '}
                </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Kirim ulang
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']) }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  ← Ganti email
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: RESET ── */}
          {step === 'reset' && (
            <div style={{ animation: 'slideInRight 0.35s ease' }}>
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🔒</div>
                <h2
                  style={{
                    fontSize: 'clamp(20px,5.5vw,26px)',
                    fontWeight: 900,
                    marginBottom: 6,
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text)',
                  }}
                >
                  Buat Password Baru
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.5 }}>
                  Buat password yang kuat dan mudah kamu ingat ya!
                </p>
              </div>

              <form onSubmit={handleResetPassword}>
                <div className="input-group">
                  <label className="input-label">Password Baru</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input-field"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Minimal 6 karakter"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ paddingRight: 48 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => !p)}
                      style={{
                        position: 'absolute',
                        right: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        fontSize: 18,
                        cursor: 'pointer',
                        padding: 4,
                      }}
                    >
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>

                  {/* Password strength */}
                  {newPassword.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        {[1, 2, 3, 4].map((level) => {
                          const strength = getPasswordStrength(newPassword)
                          return (
                            <div
                              key={level}
                              style={{
                                flex: 1,
                                height: 4,
                                borderRadius: 4,
                                transition: 'background 0.3s ease',
                                background:
                                  strength >= level
                                    ? level <= 1
                                      ? 'var(--danger)'
                                      : level <= 2
                                      ? 'var(--warning)'
                                      : level <= 3
                                      ? 'var(--accent)'
                                      : 'var(--success)'
                                    : 'var(--border)',
                              }}
                            />
                          )
                        })}
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color:
                            getPasswordStrength(newPassword) <= 1
                              ? 'var(--danger)'
                              : getPasswordStrength(newPassword) <= 2
                              ? 'var(--warning)'
                              : getPasswordStrength(newPassword) <= 3
                              ? 'var(--accent)'
                              : 'var(--success)',
                        }}
                      >
                        {['', 'Lemah 😬', 'Lumayan 😐', 'Kuat 💪', 'Sangat Kuat 🔥'][getPasswordStrength(newPassword)]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <label className="input-label">Konfirmasi Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input-field"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Ulangi password baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        paddingRight: 48,
                        borderColor:
                          confirmPassword && newPassword !== confirmPassword
                            ? 'var(--danger)'
                            : confirmPassword && newPassword === confirmPassword
                            ? 'var(--success)'
                            : undefined,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((p) => !p)}
                      style={{
                        position: 'absolute',
                        right: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        fontSize: 18,
                        cursor: 'pointer',
                        padding: 4,
                      }}
                    >
                      {showConfirm ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4, fontWeight: 600 }}>
                      Password tidak cocok nih!
                    </p>
                  )}
                  {confirmPassword && newPassword === confirmPassword && (
                    <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 4, fontWeight: 600 }}>
                      Password cocok ✓
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  style={{ padding: 'clamp(14px,3.5vw,17px)', fontSize: 16, marginTop: 4 }}
                  disabled={loading}
                >
                  {loading ? <div className="spinner" /> : 'Simpan Password Baru 🔑'}
                </button>
              </form>
            </div>
          )}

          {/* ── STEP: SUCCESS ── */}
          {step === 'success' && (
            <div
              style={{
                textAlign: 'center',
                padding: '12px 0',
                animation: 'bounceIn 0.5s ease',
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'var(--success-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 40,
                  margin: '0 auto 20px',
                  animation: 'pulse 1.5s ease infinite',
                }}
              >
                🎉
              </div>
              <h2
                style={{
                  fontSize: 'clamp(20px,5.5vw,26px)',
                  fontWeight: 900,
                  marginBottom: 8,
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text)',
                }}
              >
                Password Berhasil Diubah!
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
                Yeay! Password kamu sudah berhasil diperbarui. Sekarang kamu bisa masuk dengan password baru.
              </p>
              <button
                className="btn btn-primary w-full"
                style={{ padding: 'clamp(14px,3.5vw,17px)', fontSize: 16 }}
                onClick={() => navigate('/login')}
              >
                Masuk Sekarang ✨
              </button>
            </div>
          )}
        </div>

        {/* Back to login */}
        {step !== 'success' && (
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            Ingat password kamu?{' '}
            <span
              style={{ color: 'var(--primary)', fontWeight: 800, cursor: 'pointer' }}
              onClick={() => navigate('/login')}
            >
              Masuk di sini
            </span>
          </p>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes bounceIn {
          0%   { opacity: 0; transform: scale(0.7); }
          60%  { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.06); }
        }
        .auth-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
      `}</style>
    </div>
  )
}

// Helper: hitung kekuatan password (1–4)
function getPasswordStrength(password) {
  let score = 0
  if (password.length >= 6)  score++
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password) || /\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return Math.max(1, score)
}