import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logoBase64 } from '../assets/logo'

const slides = [
  {
    title: 'FinSmart',
    subtitle: 'Uangmu, hidupmu.',
    desc: 'Kelola keuangan lebih cerdas bersama FinSmart ✨',
    bg: 'linear-gradient(160deg, #EDE9FE 0%, #F5F0FF 50%, #EEF9FF 100%)',
    useLogo: true,
  },
  {
    emoji: '📊',
    title: 'Catat Transaksi',
    subtitle: 'Semua pengeluaran & pemasukan',
    desc: 'Pantau arus keuanganmu setiap hari 💸',
    bg: 'linear-gradient(160deg, #F0FDF4 0%, #ECFDF5 60%, #EDE9FE 100%)',
  },
  {
    emoji: '🎯',
    title: 'Budget Cerdas',
    subtitle: 'Metode 50/30/20',
    desc: 'Otomatis bagi pemasukan dengan bijak 🧠',
    bg: 'linear-gradient(160deg, #FFF7ED 0%, #FFFBEB 60%, #EDE9FE 100%)',
  },
]

export default function Onboarding() {
  const [cur, setCur] = useState(0)
  const navigate = useNavigate()
  const slide = slides[cur]

  const next = () => cur < slides.length - 1 ? setCur(c => c + 1) : navigate('/login')

  return (
    <div className="app-shell auth-page" style={{ background: slide.bg, transition: 'background 0.5s ease' }}>
      <div
        key={cur}
        className="auth-content"
        style={{
          alignItems: 'center',
          padding: 'clamp(32px,8vw,56px) var(--page-padding)',
          textAlign: 'center',
          animation: 'fadeUp 0.45s ease both',
        }}
      >
        {slide.useLogo ? (
          <div style={{ marginBottom: 'clamp(24px,6vw,36px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            
            {/* Bird icon dalam kotak putih */}
            <div style={{
              background: 'white',
              borderRadius: '28px',
              padding: '24px',
              boxShadow: '0 16px 56px rgba(124,58,237,0.22), 0 4px 16px rgba(124,58,237,0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img
                src={logoBase64}
                alt="FinSmart"
                style={{
                  width: 'clamp(120px,28vw,170px)',
                  height: 'clamp(120px,28vw,170px)',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* Teks logo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{
                fontSize: 'clamp(34px,8.5vw,46px)',
                fontWeight: 900,
                fontFamily: 'var(--font-display)',
                color: 'var(--text)',
                letterSpacing: '-1.5px',
                lineHeight: 1,
              }}>
                Fin<span style={{ color: '#7C3AED' }}>Smart</span>
              </span>
              <span style={{
                fontSize: 'clamp(11px,2.5vw,13px)',
                fontWeight: 600,
                color: '#9333EA',
                letterSpacing: '3.5px',
                textTransform: 'uppercase',
                opacity: 0.7,
              }}>
                Smart Finance
              </span>
            </div>
          </div>
        ) : (
          <div style={{
            width: 'clamp(96px,24vw,120px)',
            height: 'clamp(96px,24vw,120px)',
            background: 'white',
            borderRadius: 'clamp(24px,6vw,32px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto clamp(24px,6vw,32px)',
            fontSize: 'clamp(44px,11vw,56px)',
            boxShadow: '0 12px 48px rgba(124,58,237,0.18)',
            border: '3px solid rgba(124,58,237,0.1)',
          }}>
            {slide.emoji}
          </div>
        )}

        {!slide.useLogo && (
          <h1 style={{
            fontSize: 'clamp(26px,7vw,38px)',
            fontWeight: 900,
            marginBottom: 10,
            color: 'var(--text)',
            fontFamily: 'var(--font-display)',
          }}>
            {slide.title}
          </h1>
        )}

        <p style={{
          fontSize: 'clamp(16px,4.5vw,20px)',
          fontWeight: 800,
          marginBottom: 10,
          color: '#4C1D95',
        }}>
          {slide.subtitle}
        </p>

        <p style={{
          fontSize: 'clamp(13px,3.5vw,15px)',
          color: 'var(--text-muted)',
          marginBottom: 'clamp(32px,8vw,48px)',
          lineHeight: 1.7,
          maxWidth: 300,
        }}>
          {slide.desc}
        </p>

        <div className="flex-center gap-8" style={{ marginBottom: 'clamp(20px,5vw,28px)' }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCur(i)}
              style={{
                width: i === cur ? 28 : 8,
                height: 8,
                borderRadius: 50,
                background: i === cur ? '#7C3AED' : '#D8B4FE',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>

        <button
          className="btn btn-primary"
          style={{
            fontSize: 'clamp(14px,4vw,16px)',
            padding: 'clamp(14px,3.5vw,17px) 0',
            width: '100%',
            maxWidth: 320,
          }}
          onClick={next}
        >
          {cur < slides.length - 1 ? 'Selanjutnya →' : 'Mulai Sekarang 🚀'}
        </button>

        {cur === 0 && (
          <div style={{ marginTop: 18 }}>
            <button
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              onClick={() => navigate('/login')}
            >
              Sudah punya akun?{' '}
              <span style={{ color: '#7C3AED', fontWeight: 700 }}>Masuk</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}