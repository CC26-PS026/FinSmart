import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const navItems = [
  { label:'Beranda', path:'/dashboard', icon: (a) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )},
  { label:'Transaksi', path:'/transactions', icon: (a) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="15" x2="12" y2="15"/>
    </svg>
  )},
  { label:'Budget', path:'/budget', icon: (a) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
    </svg>
  )},
  { label:'Edukasi', path:'/education', icon: (a) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
    </svg>
  )},
  { label:'Profil', path:'/profile', icon: (a) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )},
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="bottom-nav">
      {navItems.map(({ label, path, icon }) => {
        const active = pathname === path
        return (
          <button key={path} className={`nav-item ${active ? 'active' : ''}`} onClick={() => navigate(path)} aria-label={label}>
            <div className="nav-icon-wrap">
              {icon(active)}
              {active && <span style={{ position:'absolute', bottom:-5, width:4, height:4, borderRadius:'50%', background:'var(--primary)' }}/>}
            </div>
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
