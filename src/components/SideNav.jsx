import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { logoBase64 } from '../assets/logo'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { label: 'Beranda', path: '/dashboard', icon: (a) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )},
  { label: 'Transaksi', path: '/transactions', icon: (a) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="15" x2="12" y2="15"/>
    </svg>
  )},
  { label: 'Budget', path: '/budget', icon: (a) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
    </svg>
  )},
  { label: 'Simulasi', path: '/simulation', icon: (a) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )},
  { label: 'Edukasi', path: '/education', icon: (a) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
    </svg>
  )},
  { label: 'Profil', path: '/profile', icon: (a) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )},
]

export default function SideNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user } = useAuth()

  return (
    <aside className="side-nav">
      {/* Logo */}
      <div className="side-nav-logo">
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-xlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <img src={logoBase64} alt="FinSmart" style={{ width: 36, height: 36, objectFit: 'contain' }} />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>FinSmart</span>
      </div>

      {/* Nav Items */}
      <nav className="side-nav-items">
        {navItems.map(({ label, path, icon }) => {
          const active = pathname === path
          return (
            <button
              key={path}
              className={`side-nav-item ${active ? 'active' : ''}`}
              onClick={() => navigate(path)}
            >
              <div className="side-nav-icon">{icon(active)}</div>
              <span>{label}</span>
            </button>
          )
        })}
      </nav>

      {/* User info at bottom */}
      <div className="side-nav-user">
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-xlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, overflow: 'hidden' }}>
          {user?.avatar
            ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : '👤'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Pengguna'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || ''}</div>
        </div>
      </div>
    </aside>
  )
}