import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'
import BottomNav from '../components/BottomNav'


const ICONS = {
  register:    { icon: '🎉', color: '#7C3AED', bg: '#EDE9FE' },
  transaction: { icon: '💸', color: '#059669', bg: '#D1FAE5' },
  income:      { icon: '💰', color: '#059669', bg: '#D1FAE5' },
  expense:     { icon: '🛒', color: '#DC2626', bg: '#FEE2E2' },
  budget:      { icon: '📊', color: '#D97706', bg: '#FEF3C7' },
  system:      { icon: '🔔', color: '#6B7280', bg: '#F3F4F6' },
  login:       { icon: '👋', color: '#2563EB', bg: '#DBEAFE' },
}

const FILTER_TABS = [
  { id: 'all',    label: 'Semua' },
  { id: 'unread', label: 'Belum Dibaca' },
  { id: 'transaction', label: 'Transaksi' },
  { id: 'budget', label: 'Budget' },
  { id: 'system', label: 'Sistem' },
]

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  return `${Math.floor(h / 24)} hari lalu`
}

function formatDate(iso) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Hari Ini'
  if (d.toDateString() === yesterday.toDateString()) return 'Kemarin'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function groupByDate(notifs) {
  const groups = {}
  notifs.forEach(n => {
    const key = formatDate(n.time)
    if (!groups[key]) groups[key] = []
    groups[key].push(n)
  })
  return groups
}

export default function Notifikasi() {
  const navigate = useNavigate()
  const { notifs, markRead, markAllRead, clearAll, unreadCount, synced } = useNotifications()
  const [activeFilter, setActiveFilter] = useState('all')
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [swipedId, setSwipedId] = useState(null)

  const filtered = notifs.filter(n => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'unread') return !n.read
    if (activeFilter === 'transaction') return ['transaction', 'income', 'expense'].includes(n.type)
    if (activeFilter === 'budget') return n.type === 'budget'
    if (activeFilter === 'system') return ['system', 'login', 'register'].includes(n.type)
    return true
  })

  const grouped = groupByDate(filtered)
  const dateKeys = Object.keys(grouped)

  const handleClick = (id) => {
    markRead(id)
    setSwipedId(null)
  }

  return (
    <div className="app-shell">
      <div className="page">

        {/* Header */}
        <div style={{
          background: 'var(--gradient-main)',
          padding: 'clamp(40px,8vw,56px) var(--page-padding) 0',
          borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
          marginBottom: 0,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <span style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <span style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

          {/* Back + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={() => navigate('/profile')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 38, height: 38, cursor: 'pointer', fontSize: 20, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>‹</button>
            <div style={{ flex: 1 }}>
              <h2 style={{ color: 'white', fontSize: 'clamp(18px,5vw,22px)', fontWeight: 900, fontFamily: 'var(--font-display)', margin: 0 }}>Notifikasi</h2>
              {unreadCount > 0 && (
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 }}>{unreadCount} belum dibaca</p>
              )}
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 1 }}>
                {synced ? '✓ tersinkron dengan server' : '○ mode offline (cache lokal)'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 20, padding: '7px 13px', fontSize: 12, color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)' }}
                >
                  Baca semua
                </button>
              )}
              {notifs.length > 0 && (
                <button
                  onClick={() => setShowConfirmClear(true)}
                  style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 20, padding: '7px 13px', fontSize: 12, color: 'rgba(255,255,255,0.85)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                >
                  Hapus
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16, scrollbarWidth: 'none' }}>
            {FILTER_TABS.map(tab => {
              const count = tab.id === 'unread' ? unreadCount : null
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  style={{
                    flexShrink: 0,
                    padding: '7px 14px',
                    border: 'none',
                    borderRadius: 20,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: 13,
                    transition: 'all 0.15s',
                    background: activeFilter === tab.id ? 'white' : 'rgba(255,255,255,0.15)',
                    color: activeFilter === tab.id ? 'var(--primary)' : 'rgba(255,255,255,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  {tab.label}
                  {count !== null && count > 0 && (
                    <span style={{
                      background: activeFilter === tab.id ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
                      color: activeFilter === tab.id ? 'white' : 'white',
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '1px 6px',
                      minWidth: 18,
                      textAlign: 'center',
                    }}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* List */}
        <div style={{ padding: '12px 0', minHeight: 200 }}>
          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ fontSize: 60, marginBottom: 14 }}>
                {activeFilter === 'unread' ? '✅' : activeFilter === 'budget' ? '📊' : '🔔'}
              </div>
              <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)', marginBottom: 8, fontFamily: 'var(--font-display)' }}>
                {activeFilter === 'unread' ? 'Semua sudah dibaca!' : 'Belum ada notifikasi'}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, maxWidth: 240 }}>
                {activeFilter === 'unread'
                  ? 'Kamu sudah membaca semua notifikasi 🎉'
                  : 'Aktivitas akun dan transaksimu akan muncul di sini'}
              </p>
            </div>
          ) : (
            dateKeys.map(dateKey => (
              <div key={dateKey}>
                {/* Date divider */}
                <div style={{ padding: '8px var(--page-padding) 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{dateKey}</span>
                  <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                </div>

                {grouped[dateKey].map(n => {
                  const style = ICONS[n.type] || ICONS.system
                  const isActive = swipedId === n.id
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleClick(n.id)}
                      style={{
                        display: 'flex',
                        gap: 12,
                        padding: '13px var(--page-padding)',
                        cursor: 'pointer',
                        background: n.read ? 'white' : '#FAFAFF',
                        borderBottom: '1px solid var(--border-light)',
                        borderLeft: n.read ? '3px solid transparent' : '3px solid var(--primary)',
                        transition: 'background 0.15s ease',
                        animation: 'fadeIn 0.25s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                      onMouseLeave={e => e.currentTarget.style.background = n.read ? 'white' : '#FAFAFF'}
                    >
                      {/* Icon bubble */}
                      <div style={{
                        width: 46, height: 46, borderRadius: '50%',
                        background: style.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 21, flexShrink: 0,
                      }}>
                        {style.icon}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontWeight: n.read ? 600 : 800, fontSize: 14, color: 'var(--text)', lineHeight: 1.3, fontFamily: 'var(--font-body)' }}>
                            {n.title}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            {!n.read && (
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 5 }}>
                          {n.body}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: 'var(--primary-light)', fontWeight: 600 }}>{timeAgo(n.time)}</span>
                          {/* Type badge */}
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 7px',
                            borderRadius: 8, background: style.bg, color: style.color,
                            textTransform: 'capitalize',
                          }}>{n.type}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Stats footer */}
        {notifs.length > 0 && (
          <div style={{ margin: '8px var(--page-padding) 20px', background: 'white', borderRadius: 'var(--radius-sm)', padding: '12px 16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, textAlign: 'center' }}>
              {[
                { label: 'Total', value: notifs.length, color: 'var(--primary)' },
                { label: 'Belum Dibaca', value: unreadCount, color: 'var(--warning)' },
                { label: 'Sudah Dibaca', value: notifs.length - unreadCount, color: 'var(--success)' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontWeight: 900, fontSize: 20, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />

      {/* Confirm clear modal */}
      {showConfirmClear && (
        <div
          onClick={() => setShowConfirmClear(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '28px var(--page-padding)', width: '100%', maxWidth: 'var(--shell-width)', animation: 'slideUp 0.3s ease' }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>🗑️</div>
              <h3 style={{ fontWeight: 900, fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: 8 }}>Hapus Semua Notifikasi?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>Semua {notifs.length} notifikasi akan dihapus permanen dan tidak bisa dikembalikan.</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1, padding: 14 }} onClick={() => setShowConfirmClear(false)}>Batal</button>
              <button className="btn btn-danger" style={{ flex: 1, padding: 14 }} onClick={() => { clearAll(); setShowConfirmClear(false) }}>Hapus Semua</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  )
}