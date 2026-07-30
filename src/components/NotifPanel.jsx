import React from 'react'
import { useNotifications } from '../hooks/useNotifications'

const ICONS = {
  register:    { icon: '🎉', color: '#7C3AED', bg: '#EDE9FE' },
  transaction: { icon: '💸', color: '#059669', bg: '#D1FAE5' },
  income:      { icon: '💰', color: '#059669', bg: '#D1FAE5' },
  expense:     { icon: '🛒', color: '#DC2626', bg: '#FEE2E2' },
  budget:      { icon: '📊', color: '#D97706', bg: '#FEF3C7' },
  system:      { icon: '🔔', color: '#6B7280', bg: '#F3F4F6' },
  login:       { icon: '👋', color: '#2563EB', bg: '#DBEAFE' },
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  return `${Math.floor(h / 24)} hari lalu`
}

export default function NotifPanel({ onClose }) {
  const { notifs, markRead, markAllRead, clearAll, unreadCount } = useNotifications()

  const handleClick = (id) => {
    markRead(id)
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 998,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0,
        width: '100%',
        maxWidth: 400,
        height: '100dvh',
        background: 'white',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
        animation: 'slideInRight 0.3s ease',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid #F3F4F6',
          background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
          color: 'white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: 'white', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ←
              </button>
              <div>
                <h2 style={{ fontWeight: 900, fontSize: 18, fontFamily: 'var(--font-display)', margin: 0 }}>Notifikasi</h2>
                {unreadCount > 0 && (
                  <span style={{ fontSize: 12, opacity: 0.85 }}>{unreadCount} belum dibaca</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 20, padding: '6px 12px', fontSize: 12, color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  Baca semua
                </button>
              )}
              {notifs.length > 0 && (
                <button onClick={clearAll} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 20, padding: '6px 12px', fontSize: 12, color: 'white', cursor: 'pointer' }}>
                  Hapus
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {notifs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 12, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 56 }}>🔔</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Belum ada notifikasi</div>
              <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 220, lineHeight: 1.6 }}>
                Aktivitas akun dan transaksi kamu akan muncul di sini
              </div>
            </div>
          ) : (
            notifs.map(n => {
              const style = ICONS[n.type] || ICONS.system
              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n.id)}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '14px 20px',
                    cursor: 'pointer',
                    background: n.read ? 'white' : '#FAFAFF',
                    borderBottom: '1px solid #F9FAFB',
                    transition: 'background 0.15s ease',
                    borderLeft: n.read ? '3px solid transparent' : '3px solid #7C3AED',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: style.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                  }}>
                    {style.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: n.read ? 600 : 800, fontSize: 14, color: 'var(--text)', lineHeight: 1.3 }}>
                        {n.title}
                      </span>
                      {!n.read && (
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED', flexShrink: 0, marginTop: 3 }} />
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 4 }}>
                      {n.body}
                    </div>
                    <div style={{ fontSize: 11, color: '#A78BFA', fontWeight: 600 }}>
                      {timeAgo(n.time)}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer info */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12 }}>
            <span>🔔</span>
            <span>Notifikasi tersimpan secara lokal di perangkat kamu</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
