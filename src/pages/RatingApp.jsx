import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import { ratingApi } from '../api/index'
import BottomNav from '../components/BottomNav'

const ASPECTS = [
  { id: 'design', label: 'Tampilan & Desain', icon: '🎨' },
  { id: 'ease', label: 'Kemudahan Penggunaan', icon: '🖐️' },
  { id: 'feature', label: 'Fitur & Fungsi', icon: '⚙️' },
  { id: 'performance', label: 'Kecepatan & Performa', icon: '⚡' },
]

const EMOJIS = ['😞', '😕', '😐', '😊', '🤩']
const LABELS = ['Sangat Buruk', 'Kurang Baik', 'Cukup', 'Bagus', 'Luar Biasa!']

export default function RatingApp() {
  const navigate = useNavigate()
  const toast = useToast()
  const [mainRating, setMainRating] = useState(0)
  const [hoveredMain, setHoveredMain] = useState(0)
  const [aspects, setAspects] = useState({ design: 0, ease: 0, feature: 0, performance: 0 })
  const [review, setReview] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const activeMain = hoveredMain || mainRating

  const handleAspect = (id, val) => setAspects(prev => ({ ...prev, [id]: val }))

  const handleSubmit = async () => {
    if (mainRating === 0) { toast('Pilih rating utama dulu ya! ⭐', 'error'); return }
    setSubmitting(true)
    try {
      await ratingApi.submit(mainRating, review, aspects)
      setSubmitted(true)
    } catch (err) {
      toast(err?.message || 'Gagal mengirim rating, coba lagi.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="app-shell">
        <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '0 var(--page-padding)' }}>
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 80, marginBottom: 16, animation: 'bounceIn 0.6s ease' }}>🎉</div>
            <h2 style={{ fontSize: 26, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: 10 }}>Terima Kasih!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 8 }}>
              Rating kamu sangat berarti untuk kami terus berkembang.
            </p>
            <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 14, marginBottom: 32 }}>
              FinSmart akan semakin baik berkat masukanmu ✨
            </p>
            {/* Stars display */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
              {[1,2,3,4,5].map(i => (
                <span key={i} style={{ fontSize: 32, filter: i <= mainRating ? 'none' : 'grayscale(1) opacity(0.3)', transition: 'all 0.3s', animationDelay: `${i * 0.1}s` }}>⭐</span>
              ))}
            </div>
            <button className="btn btn-primary w-full" style={{ padding: '14px', borderRadius: 'var(--radius-sm)' }} onClick={() => navigate('/profile')}>
              Kembali ke Profil
            </button>
          </div>
        </div>
        <BottomNav />
        <style>{`
          @keyframes bounceIn {
            0% { transform: scale(0); opacity: 0; }
            60% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="page">
        {/* Header */}
        <div style={{ background: 'var(--gradient-main)', padding: 'clamp(40px,8vw,56px) var(--page-padding) clamp(24px,5vw,32px)', textAlign: 'center', borderRadius: '0 0 var(--radius-xl) var(--radius-xl)', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <span style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          {/* Back button */}
          <button onClick={() => navigate('/profile')} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 38, height: 38, cursor: 'pointer', fontSize: 20, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <div style={{ fontSize: 48, marginBottom: 10 }}>⭐</div>
          <h2 style={{ color: 'white', fontSize: 'clamp(18px,5vw,22px)', fontWeight: 900, fontFamily: 'var(--font-display)', marginBottom: 6 }}>Beri Rating Aplikasi</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>Bantu kami terus berkembang untuk kamu</p>
        </div>

        <div style={{ padding: '0 var(--page-padding)' }}>

          {/* Main Star Rating */}
          <div className="card animate-fadeup" style={{ marginBottom: 14, textAlign: 'center', padding: 'clamp(20px,5vw,28px)' }}>
            <div style={{ fontWeight: 800, fontSize: 16, fontFamily: 'var(--font-display)', marginBottom: 6 }}>Seberapa puas kamu dengan FinSmart?</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Ketuk bintang untuk memberi penilaian</p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 12 }}>
              {[1,2,3,4,5].map(i => (
                <button
                  key={i}
                  onMouseEnter={() => setHoveredMain(i)}
                  onMouseLeave={() => setHoveredMain(0)}
                  onClick={() => setMainRating(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, transition: 'transform 0.15s', transform: activeMain >= i ? 'scale(1.15)' : 'scale(1)' }}
                >
                  <span style={{ fontSize: 'clamp(32px,9vw,40px)', filter: activeMain >= i ? 'none' : 'grayscale(1) opacity(0.35)', transition: 'all 0.2s' }}>⭐</span>
                </button>
              ))}
            </div>

            {activeMain > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
                <span style={{ fontSize: 28 }}>{EMOJIS[activeMain - 1]}</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>{LABELS[activeMain - 1]}</span>
              </div>
            )}
          </div>

          {/* Aspect Ratings */}
          <div className="card animate-fadeup" style={{ marginBottom: 14, padding: 'clamp(16px,4vw,22px)' }}>
            <div style={{ fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-display)', marginBottom: 14 }}>Penilaian per Aspek</div>
            {ASPECTS.map(asp => (
              <div key={asp.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{asp.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{asp.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1,2,3,4,5].map(i => (
                    <button
                      key={i}
                      onClick={() => handleAspect(asp.id, i)}
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        border: aspects[asp.id] >= i ? '2px solid var(--primary)' : '2px solid var(--border)',
                        borderRadius: 'var(--radius-xs)',
                        background: aspects[asp.id] >= i ? 'var(--primary-xlight)' : 'white',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 13,
                        color: aspects[asp.id] >= i ? 'var(--primary)' : 'var(--text-muted)',
                        transition: 'all 0.15s'
                      }}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Review Text */}
          <div className="card animate-fadeup" style={{ marginBottom: 14, padding: 'clamp(16px,4vw,22px)' }}>
            <div style={{ fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-display)', marginBottom: 6 }}>💬 Ceritakan Pengalamanmu</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>Opsional — saran atau masukanmu sangat kami hargai</p>
            <textarea
              value={review}
              onChange={e => setReview(e.target.value)}
              placeholder="Tulis ulasan di sini... (contoh: Fitur budget sangat membantu!)"
              rows={4}
              style={{
                width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)', resize: 'none', outline: 'none',
                background: 'var(--border-light)', lineHeight: 1.6, transition: 'border 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{review.length}/500</div>
          </div>

          {/* Submit */}
          <button
            className="btn btn-primary w-full"
            style={{ padding: '15px', borderRadius: 'var(--radius-sm)', marginBottom: 24, fontSize: 15 }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><div className="spinner" />Mengirim Rating...</span>
              : '⭐ Kirim Rating'}
          </button>
        </div>
      </div>
      <BottomNav />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}