import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { logoBase64 } from '../assets/logo'
import { adminAuthApi, adminArticlesApi, adminRatingsApi, removeAdminToken } from '../api'

// ── HELPERS ──────────────────────────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime(), m = Math.floor(diff / 60000)
  if (m < 1) return 'Baru saja'; if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60); if (h < 24) return `${h} jam lalu`
  return `${Math.floor(h / 24)} hari lalu`
}
function fmtDate(s) { return s ? new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-' }
function initials(n = '') { return n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() }
const AV = ['var(--primary)', 'var(--accent)', 'var(--success)', 'var(--warning)', 'var(--danger)', '#EC4899', '#8B5CF6', '#0D9488']

const ARTICLE_CATEGORIES = ['INVESTASI', 'BUDGETING', 'TABUNGAN', 'PAY LATER', 'LAINNYA']
const ARTICLE_ICONS = ['📈', '💡', '🏦', '📊', '⚠️', '🛒', '📄', '💰', '🎯', '🔑']
const ARTICLE_COLORS = ['var(--primary-xlight)', 'var(--success-light)', 'var(--warning-light)', '#ECFEFF', 'var(--danger-light)', '#EFF6FF']
const EMPTY_FORM = { title: '', content: '', category: 'INVESTASI', read_time: 5, image: '📈', bg_color: 'var(--primary-xlight)' }

// ── STATIC DATA (fitur offline) ───────────────────────────────────────────────
const STATIC_NOTIFS = [
  { id: 0, dot: 'var(--danger)', text: 'Kritis: CPU Server mencapai 95%', time: '10 menit lalu', level: 'kritis', read: false },
  { id: 1, dot: 'var(--warning)', text: 'Peringatan: Storage database 82% terpakai', time: '2 jam lalu', level: 'peringatan', read: false },
  { id: 2, dot: 'var(--success)', text: 'Backup database berhasil diselesaikan', time: '1 hari lalu', level: 'info', read: true },
]

const STATIC_ADMINS = [
  { id: 's1', name: 'Bima Prakoso', email: 'bima@finsmart.id', status: 'Aktif', lastDays: 35, workHours: 142, todayHours: 0, lastOnline: '35 hari lalu', color: 'var(--primary)' },
  { id: 's2', name: 'Citra Lestari', email: 'citra@finsmart.id', status: 'Aktif', lastDays: 0, workHours: 218, todayHours: 6.5, lastOnline: 'Baru saja', color: 'var(--success)' },
  { id: 's3', name: 'Doni Hariadi', email: 'doni@finsmart.id', status: 'Aktif', lastDays: 42, workHours: 89, todayHours: 0, lastOnline: '42 hari lalu', color: 'var(--warning)' },
]

const MESSAGE_TEMPLATES = [
  { label: 'Reset Password', text: 'Halo {nama}, kami telah mereset password akun Anda. Silakan cek email untuk instruksi selanjutnya.' },
  { label: 'Akun Dinonaktifkan', text: 'Halo {nama}, akun Anda telah dinonaktifkan sementara. Hubungi admin untuk informasi lebih lanjut.' },
  { label: 'Selamat Datang', text: 'Halo {nama}, selamat datang di FinSmart! Akun Anda telah aktif dan siap digunakan.' },
  { label: 'Pengumuman', text: 'Halo {nama}, ada pengumuman penting dari tim admin. Silakan cek dashboard Anda untuk detail terbaru.' },
]

function useBreakpoint() {
  const [bp, setBp] = useState(() => { const w = window.innerWidth; return w >= 1024 ? 'desktop' : w >= 640 ? 'tablet' : 'mobile' })
  useEffect(() => {
    const fn = () => { const w = window.innerWidth; setBp(w >= 1024 ? 'desktop' : w >= 640 ? 'tablet' : 'mobile') }
    window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn)
  }, [])
  return bp
}

const S = `
  @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
  @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
  @keyframes fadeUp  { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
  .a-fade { animation: fadeUp .22s ease; }
  .a-card { background:white; border-radius:16px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.06); border:1px solid var(--border-light); }
  .a-btn { border:none; border-radius:12px; padding:10px 18px; font-size:13px; font-weight:700; cursor:pointer; transition:all 0.15s; display:inline-flex; align-items:center; gap:6px; font-family:inherit; }
  .a-primary { background:var(--gradient-btn); color:white; box-shadow:0 4px 14px rgba(124,58,237,0.3); }
  .a-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(124,58,237,0.4); }
  .a-ghost { background:var(--border-light); color:#374151; }
  .a-danger { background:var(--danger-light); color:#DC2626; }
  .a-success { background:var(--success-light); color:#065F46; }
  .a-warn { background:var(--warning-light); color:#92400E; }
  .a-inp { width:100%; padding:10px 14px; border:1.5px solid var(--border); border-radius:12px; font-size:14px; outline:none; box-sizing:border-box; font-family:inherit; transition:border-color 0.15s; }
  .a-inp:focus { border-color:var(--primary); }
  .a-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:600; padding:20px; animation:fadeIn 0.2s; }
  .a-modal { background:white; border-radius:24px; padding:28px; width:100%; max-width:480px; max-height:90vh; overflow-y:auto; }
  .a-nav { width:100%; display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:12px; border:none; margin-bottom:3px; font-size:14px; cursor:pointer; transition:all 0.15s; font-family:inherit; }
  .a-stat { background:white; border-radius:14px; padding:18px; box-shadow:0 1px 4px rgba(0,0,0,0.06); transition:transform 0.15s; cursor:pointer; }
  .a-stat:hover { transform:translateY(-2px); }
  .a-filter { padding:6px 14px; border-radius:20px; border:1.5px solid var(--border); background:none; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; transition:all 0.15s; color:var(--text-muted); }
  .a-filter.on { background:var(--primary); color:white; border-color:var(--primary); }
  .a-note { background:white; border:1px solid var(--border-light); border-radius:16px; padding:18px; cursor:pointer; transition:all 0.2s; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
  .a-note:hover { border-color:var(--primary); transform:translateY(-3px); box-shadow:0 8px 24px rgba(124,58,237,0.15); }
  .a-row { display:flex; gap:12px; padding:12px 20px; border-bottom:1px solid var(--border-light); cursor:pointer; transition:background 0.15s; align-items:center; }
  .a-row:hover { background:#FAFAFE; }
  table.a-tbl { width:100%; border-collapse:collapse; font-size:14px; }
  table.a-tbl th { padding:12px 16px; text-align:left; font-weight:800; font-size:11px; color:#9CA3AF; letter-spacing:0.4px; background:#F9F7FF; border-bottom:2px solid var(--border-light); }
  table.a-tbl td { padding:12px 16px; border-bottom:1px solid var(--border-light); }
  table.a-tbl tbody tr { cursor:pointer; transition:background 0.1s; }
  table.a-tbl tbody tr:hover td { background:#FAFAFE; }
  @media (max-width: 380px) {
    .a-overlay { padding:12px; }
    .a-modal { padding:20px; border-radius:18px; }
  }
`

function Toggle({ on, toggle }) {
  return (
    <div onClick={toggle} style={{ width: 38, height: 22, borderRadius: 11, background: on ? 'var(--primary)' : 'var(--border)', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  )
}
function Av({ name, size = 36, idx = 0, extra = {} }) {
  return <div style={{ width: size, height: size, borderRadius: size * 0.3, flexShrink: 0, background: AV[idx % AV.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: size * 0.33, ...extra }}>{initials(name)}</div>
}
// ── ADMIN ICON SET (SVG badge, menggantikan emoji navigasi/chrome) ────────────
const A_ICONS = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
  users:     <><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="8" r="2.6"/><path d="M15.5 14.2c2.6.5 4.5 2.7 4.5 5.8"/></>,
  articles:  <><rect x="4" y="3" width="16" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/></>,
  ratings:   <path d="M12 2.5l2.8 6.1 6.7.6-5 4.5 1.5 6.6L12 16.9 6 20.3l1.5-6.6-5-4.5 6.7-.6z"/>,
  shield:    <><path d="M12 2.5l7.5 3.2v5.2c0 5-3.2 8.9-7.5 10.6-4.3-1.7-7.5-5.6-7.5-10.6V5.7z"/><path d="M8.5 12l2.3 2.3L15.5 9.5"/></>,
  report:    <><path d="M5 20V10M11 20V4M17 20v-7"/><line x1="3" y1="21" x2="21" y2="21"/></>,
  bell:      <><path d="M6 10a6 6 0 0112 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5z"/><path d="M9.5 19a2.5 2.5 0 005 0"/></>,
  monitor:   <><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c0-4 3.5-7 7.5-7s7.5 3 7.5 7"/></>,
  logout:    <><path d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4"/><line x1="20" y1="12" x2="10" y2="12"/><polyline points="16 7 21 12 16 17"/></>,
  back:      <><line x1="20" y1="12" x2="4" y2="12"/><polyline points="10 6 4 12 10 18"/></>,
  send:      <><line x1="21" y1="3" x2="10" y2="14"/><path d="M21 3l-7 18-4-8-8-4z"/></>,
  mail:      <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 6.5l9 6.5 9-6.5"/></>,
  edit:      <><path d="M4 20h4L18.5 9.5a2.1 2.1 0 000-3L18 6a2.1 2.1 0 00-3 0L4.5 16.5z"/><line x1="14.5" y1="7.5" x2="17.5" y2="10.5"/></>,
  trash:     <><path d="M4 7h16M9 7V4.5A1.5 1.5 0 0110.5 3h3A1.5 1.5 0 0115 4.5V7m2 0l-.8 12.1A2 2 0 0114.2 21H9.8a2 2 0 01-2-1.9L7 7"/></>,
  check:     <><circle cx="12" cy="12" r="9"/><polyline points="8 12.5 11 15.5 16 9"/></>,
  close:     <><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></>,
  clock:     <><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></>,
  coins:     <><ellipse cx="9" cy="7" rx="6" ry="3.2"/><path d="M3 7v10c0 1.8 2.7 3.2 6 3.2s6-1.4 6-3.2V7"/><path d="M3 12c0 1.8 2.7 3.2 6 3.2s6-1.4 6-3.2"/><path d="M15 5.5c3 .3 5 1.6 5 3.2V17c0 1.4-1.9 2.6-4.4 3"/></>,
  lock:      <><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7.5a4 4 0 018 0V11"/></>,
  unlock:    <><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7.5A4 4 0 0115.8 6"/></>,
  wave:      <path d="M6 12c1.5-4 3-4 4.5 0s3 4 4.5 0 3-4 4.5 0M12 4v2M12 18v2"/>,
  info:      <><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="7.5" r="0.6" fill="currentColor" stroke="none"/></>,
}
function AIcon({ name, color = 'currentColor', size = 18, bg, bgSize }) {
  const svg = (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {A_ICONS[name] || A_ICONS.info}
    </svg>
  )
  if (!bg) return <span style={{ display:'inline-flex', color }}>{svg}</span>
  const wrap = bgSize || size + 14
  return (
    <span style={{ width:wrap, height:wrap, borderRadius:'50%', background:`${bg}1A`, color:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      {svg}
    </span>
  )
}

function Chip({ status }) {
  const m = { active: ['var(--success-light)', '#065F46', 'AKTIF'], inactive: ['var(--danger-light)', '#DC2626', 'NONAKTIF'], Aktif: ['var(--success-light)', '#065F46', 'AKTIF'], Nonaktif: ['var(--danger-light)', '#DC2626', 'NONAKTIF'], Pending: ['var(--warning-light)', '#92400E', 'PENDING'] }
  const [bg, col, lbl] = m[status] || ['var(--border-light)', 'var(--text-muted)', status]
  return <span style={{ background: bg, color: col, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 800 }}>{lbl}</span>
}

// ── SEND MESSAGE ──────────────────────────────────────────────────────────────
function MsgPage({ user, onBack }) {
  const bp = useBreakpoint()
  const isDesktop = bp === 'desktop'
  const [sub, setSub] = useState(''), [body, setBody] = useState(''), [type, setType] = useState('Notifikasi')
  const [email, setEmail] = useState(true), [hi, setHi] = useState(false), [sending, setSending] = useState(false), [sent, setSent] = useState(false)
  const MAX = 500
  function applyTpl(t) { setSub(t.label + ' – ' + user.name); setBody(t.text.replace('{nama}', user.name.split(' ')[0])) }
  function send() { if (!sub.trim() || !body.trim() || body.length > MAX) return; setSending(true); setTimeout(() => { setSending(false); setSent(true) }, 1400) }
  if (sent) return (
    <div className="a-overlay" onClick={onBack}><div className="a-modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: 380 }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
      <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}>Pesan Terkirim!</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Pesan berhasil dikirim ke <strong>{user.name}</strong>.{email && ' Notifikasi email juga dikirimkan.'}</div>
      <button className="a-btn a-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onBack}>Kembali</button>
    </div></div>
  )
  return (
    <div className="a-fade">
      <button onClick={onBack} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 20, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>← Kembali</button>
      <div className="a-card" style={{ padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Av name={user.name} size={52} extra={{ borderRadius: 16 }} />
        <div style={{ flex: 1 }}><div style={{ fontWeight: 900, fontSize: 16, marginBottom: 2 }}>Kirim Pesan ke {user.name}</div><div style={{ fontSize: 12, color: '#9CA3AF' }}>{user.email}</div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 280px' : '1fr', gap: 20, alignItems: 'start' }}>
        <div className="a-card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Jenis Pesan</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Notifikasi','Peringatan','Pengumuman','Pribadi'].map(t => (
                <button key={t} onClick={() => setType(t)} style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${type===t?'var(--primary)':'var(--border)'}`, background: type===t?'var(--primary)':'white', color: type===t?'white':'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Subjek</div>
            <input className="a-inp" placeholder="Tulis subjek…" value={sub} onChange={e => setSub(e.target.value)} maxLength={120} />
          </div>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Isi Pesan</div>
            <textarea className="a-inp" style={{ minHeight: 140, resize: 'vertical' }} placeholder={`Tulis pesan untuk ${user.name}…`} value={body} onChange={e => setBody(e.target.value)} />
            <div style={{ fontSize: 11, color: body.length > MAX ? 'var(--danger)' : '#9CA3AF', textAlign: 'right', marginTop: 4 }}>{body.length}/{MAX}</div>
          </div>
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>{hi && <span style={{ color: 'var(--danger)', marginRight: 8 }}>⚑ Prioritas Tinggi</span>}{email && '📧'}</span>
            <button className="a-btn a-primary" onClick={send} disabled={!sub.trim() || !body.trim() || body.length > MAX || sending} style={{ opacity: (!sub.trim() || !body.trim() || sending) ? 0.5 : 1 }}>
              {sending ? '⏳ Mengirim…' : '📨 Kirim Pesan'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="a-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Template Cepat</div>
            {MESSAGE_TEMPLATES.map((t, i) => (
              <button key={i} onClick={() => applyTpl(t)} style={{ width: '100%', background: 'var(--border-light)', border: 'none', borderRadius: 10, padding: '9px 12px', textAlign: 'left', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', color: '#374151', marginBottom: 6, transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-xlight)'; e.currentTarget.style.color = 'var(--primary)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--border-light)'; e.currentTarget.style.color = '#374151' }}>
                📋 {t.label}
              </button>
            ))}
          </div>
          <div className="a-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Opsi</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}><span style={{ fontSize: 13, fontWeight: 600 }}>Notifikasi Email</span><Toggle on={email} toggle={() => setEmail(v => !v)} /></div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: 13, fontWeight: 600 }}>Prioritas Tinggi</span><Toggle on={hi} toggle={() => setHi(v => !v)} /></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── NOTIF SISTEM ──────────────────────────────────────────────────────────────
function NotifPage({ notifs, setNotifs }) {
  const LCOLOR = { kritis:'var(--danger)', peringatan:'var(--warning)', info:'var(--success)' }
  const LBG = { kritis:'var(--danger-light)', peringatan:'var(--warning-light)', info:'var(--success-light)' }
  const LLBL = { kritis:'Kritis', peringatan:'Peringatan', info:'Info' }
  return (
    <div className="a-fade">
      <div className="a-card">
        <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--border-light)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div><div style={{ fontWeight:800,fontSize:15 }}>Notifikasi Sistem</div><div style={{ fontSize:11,color:'#9CA3AF',marginTop:2 }}>{notifs.filter(n=>!n.read).length} belum dibaca</div></div>
          <button onClick={() => setNotifs(p=>p.map(n=>({...n,read:true})))} style={{ background:'none',border:'none',color:'var(--primary)',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>Tandai semua dibaca</button>
        </div>
        {notifs.map(n => (
          <div key={n.id} className="a-row" style={{ opacity:n.read?.55:1,background:n.read?'transparent':'#F9F7FF' }} onClick={() => setNotifs(p=>p.map(x=>x.id===n.id?{...x,read:true}:x))}>
            <div style={{ width:10,height:10,borderRadius:'50%',background:n.dot,marginTop:2,flexShrink:0 }} />
            <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:n.read?500:700 }}>{n.text}</div><div style={{ fontSize:11,color:'#9CA3AF',marginTop:2 }}>{n.time}</div></div>
            <span style={{ background:LBG[n.level],color:LCOLOR[n.level],borderRadius:8,padding:'3px 10px',fontSize:11,fontWeight:800,flexShrink:0 }}>{LLBL[n.level]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── MONITOR ADMIN ─────────────────────────────────────────────────────────────
function MonitorPage({ realAdmins, myId, onRefresh, showToast }) {
  const [sadmins, setSadmins] = useState(STATIC_ADMINS)
  const [filt, setFilt] = useState('Semua')
  const [conf, setConf] = useState(null)
  const [toggling, setToggling] = useState(null)
  const realMapped = realAdmins.filter(r=>String(r.id)!==String(myId)).map((r,i)=>({
    id:`r${r.id}`, realId: r.id, name:r.name, email:r.email,
    status: r.is_active === 0 ? 'Nonaktif' : 'Aktif',
    lastDays:0, workHours:0, todayHours:0, lastOnline:'Baru saja', color:AV[(i+3)%AV.length]
  }))
  const all = [...sadmins, ...realMapped]
  const filtered = all.filter(a => filt==='Semua' || a.status===filt)
  const counts = { Semua:all.length, Aktif:all.filter(a=>a.status==='Aktif').length, Nonaktif:all.filter(a=>a.status==='Nonaktif').length }

  async function toggle(id) {
    const item = all.find(a => a.id === id)
    if (!item) return setConf(null)
    if (id.startsWith('r')) {
      // Admin real — panggil API
      setToggling(id)
      try {
        const res = await adminAuthApi.toggleAdminActive(item.realId)
        showToast(res.message || 'Status berhasil diubah.')
        onRefresh()
      } catch(e) {
        showToast(e.message || 'Gagal mengubah status.', 'error')
      }
      setToggling(null)
    } else {
      setSadmins(p=>p.map(a=>a.id===id?{...a,status:a.status==='Aktif'?'Nonaktif':'Aktif'}:a))
    }
    setConf(null)
  }
  const t = conf ? all.find(a=>a.id===conf) : null
  return (
    <div className="a-fade">
      {t && (
        <div className="a-overlay" onClick={() => setConf(null)}>
          <div className="a-modal" onClick={e=>e.stopPropagation()} style={{ textAlign:'center',maxWidth:360 }}>
            <div style={{ fontSize:48,marginBottom:12 }}>{t.status==='Aktif'?'🔒':'🔓'}</div>
            <div style={{ fontWeight:900,fontSize:18,marginBottom:8,fontFamily:'var(--font-display)' }}>{t.status==='Aktif'?'Nonaktifkan Admin?':'Aktifkan Admin?'}</div>
            <div style={{ color:'var(--text-muted)',fontSize:13,marginBottom:20 }}>{t.name}</div>
            <div style={{ display:'flex',gap:10 }}>
              <button className="a-btn a-ghost" style={{ flex:1,justifyContent:'center' }} onClick={() => setConf(null)}>Batal</button>
              <button className="a-btn" style={{ flex:1,justifyContent:'center',background:t.status==='Aktif'?'var(--warning-light)':'var(--success-light)',color:t.status==='Aktif'?'#92400E':'#065F46' }} onClick={() => toggle(t.id)}>
                {t.status==='Aktif'?'Ya, Nonaktifkan':'Ya, Aktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:12,marginBottom:20 }}>
        {[{l:'Total Admin',v:all.length,c:'var(--primary)'},{l:'Aktif',v:counts.Aktif,c:'var(--success)'},{l:'Nonaktif',v:counts.Nonaktif,c:'var(--danger)'},{l:'Offline >30h',v:all.filter(a=>a.lastDays>30&&a.status==='Aktif').length,c:'var(--warning)'}].map(s=>(
          <div key={s.l} className="a-stat" style={{ padding:16 }}><div style={{ fontSize:11,color:'#9CA3AF',fontWeight:700,textTransform:'uppercase',marginBottom:6 }}>{s.l}</div><div style={{ fontSize:24,fontWeight:900,color:s.c }}>{s.v}</div></div>
        ))}
      </div>
      <div className="a-card">
        <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--border-light)',display:'flex',gap:8,flexWrap:'wrap',alignItems:'center' }}>
          <div style={{ fontWeight:800,fontSize:15,marginRight:8 }}>Daftar Admin</div>
          {['Semua','Aktif','Nonaktif'].map(s=><button key={s} className={`a-filter${filt===s?' on':''}`} onClick={()=>setFilt(s)}>{s} ({counts[s]||0})</button>)}
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14,padding:20 }}>
          {filtered.map(a => (
            <div key={a.id} style={{ background:'#F9F7FF',border:`1px solid ${a.status==='Nonaktif'?'var(--danger-light)':'var(--primary-xlight)'}`,borderRadius:14,padding:16,opacity:a.status==='Nonaktif'?.65:1 }}>
              <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:12 }}>
                <div style={{ width:44,height:44,borderRadius:12,background:a.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,color:'#fff',flexShrink:0 }}>{initials(a.name)}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:800,fontSize:14 }}>{a.name}</div>
                  <div style={{ fontSize:11,color:'#9CA3AF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{a.email}</div>
                  <div style={{ fontSize:11,marginTop:2 }}>
                    <span style={{ display:'inline-block',width:8,height:8,borderRadius:'50%',background:a.lastDays===0?'var(--success)':'var(--danger)',marginRight:4 }} />
                    <span style={{ color:a.lastDays===0?'var(--success)':a.lastDays>30?'var(--danger)':'var(--warning)' }}>{a.lastOnline}</span>
                  </div>
                </div>
                <Chip status={a.status} />
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10 }}>
                <div style={{ background:'white',borderRadius:10,padding:'8px 10px',border:'1px solid var(--border)' }}><div style={{ fontSize:10,color:'#9CA3AF',marginBottom:2 }}>JAM KERJA</div><div style={{ fontWeight:800,color:'var(--primary)',fontFamily:'monospace' }}>{a.workHours}h</div></div>
                <div style={{ background:'white',borderRadius:10,padding:'8px 10px',border:'1px solid var(--border)' }}><div style={{ fontSize:10,color:'#9CA3AF',marginBottom:2 }}>HARI INI</div><div style={{ fontWeight:800,color:a.todayHours>0?'var(--success)':'#9CA3AF',fontFamily:'monospace' }}>{a.todayHours>0?`${a.todayHours}h`:'—'}</div></div>
              </div>
              <button className="a-btn" disabled={toggling===a.id} style={{ width:'100%',justifyContent:'center',background:a.status==='Aktif'?'var(--warning-light)':'var(--success-light)',color:a.status==='Aktif'?'#92400E':'#065F46',opacity:toggling===a.id?0.7:1,cursor:toggling===a.id?'not-allowed':'pointer' }} onClick={() => setConf(a.id)}>
                {toggling===a.id?'⏳ Memproses...':(a.status==='Aktif'?'🔒 Nonaktifkan':'🔓 Aktifkan')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── LAPORAN ───────────────────────────────────────────────────────────────────
function LaporanPage({ users, articles, ratings, ratingAvg }) {
  const totalTx = users.reduce((s,u)=>s+(u.transactions||0),0)
  const MONTHLY = [{ b:'Januari 2025',r:'Rp 26.1jt',u:389,ret:'79.2%'},{b:'Februari 2025',r:'Rp 28.4jt',u:412,ret:'78.1%'},{b:'Maret 2025',r:'Rp 29.7jt',u:447,ret:'77.9%'}]
  return (
    <div className="a-fade">
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:14,marginBottom:20 }}>
        {[{l:'Total Pengguna',v:users.length,i:'👥',c:'var(--primary)',bg:'var(--primary-xlight)'},{l:'Total Transaksi',v:totalTx.toLocaleString(),i:'💸',c:'var(--success)',bg:'var(--success-light)'},{l:'Total Artikel',v:articles.length,i:'📰',c:'var(--warning)',bg:'var(--warning-light)'},{l:'Avg Rating',v:`${ratingAvg}⭐`,i:'⭐',c:'var(--warning)',bg:'var(--warning-light)'},{l:'Rating Positif',v:ratings.filter(r=>r.score>=4).length,i:'👍',c:'var(--accent)',bg:'#ECFEFF'}].map(s=>(
          <div key={s.l} className="a-stat" style={{ border:`1.5px solid ${s.bg}` }}>
            <div style={{ fontSize:26,marginBottom:6 }}>{s.i}</div>
            <div style={{ fontSize:26,fontWeight:900,color:s.c,lineHeight:1 }}>{s.v}</div>
            <div style={{ fontSize:12,color:'#9CA3AF',fontWeight:600,marginTop:4 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div className="a-card">
        <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--border-light)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ fontWeight:800,fontSize:15 }}>Perbandingan Bulanan Q1 2025</div>
          <span style={{ background:'var(--success-light)',color:'#065F46',borderRadius:8,padding:'3px 10px',fontSize:11,fontWeight:800 }}>Jan–Mar 2025</span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className="a-tbl">
            <thead><tr><th>Bulan</th><th>Pendapatan</th><th>Pengguna Baru</th><th>Retensi</th></tr></thead>
            <tbody>{MONTHLY.map(r=><tr key={r.b}><td style={{ fontWeight:700 }}>{r.b}</td><td style={{ color:'var(--success)',fontFamily:'monospace',fontWeight:700 }}>{r.r}</td><td style={{ fontFamily:'monospace' }}>{r.u}</td><td style={{ fontFamily:'monospace' }}>{r.ret}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate()
  const bp = useBreakpoint()
  const isDesktop = bp === 'desktop', isTablet = bp === 'tablet', isMobile = bp === 'mobile'

  const [admin, setAdmin] = useState(null)
  const [users, setUsers] = useState([])
  const [admins, setAdmins] = useState([])
  const [articles, setArticles] = useState([])
  const [ratings, setRatings] = useState([])
  const [ratingAvg, setRatingAvg] = useState(0)
  const [ratingAspect, setRatingAspect] = useState({})
  const [search, setSearch] = useState('')
  const [filt, setFilt] = useState('all')
  const [sortBy, setSortBy] = useState('joinDate')
  const [tab, setTab] = useState('dashboard')
  const [drawer, setDrawer] = useState(false)
  const [logout, setLogout] = useState(false)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selUser, setSelUser] = useState(null)
  const [msgTarget, setMsgTarget] = useState(null)
  const [sysNotifs, setSysNotifs] = useState(STATIC_NOTIFS)
  const [artForm, setArtForm] = useState(EMPTY_FORM)
  const [showArtForm, setShowArtForm] = useState(false)
  const [editArt, setEditArt] = useState(null)
  const [artLoad, setArtLoad] = useState(false)
  const [delArt, setDelArt] = useState(null)

  const toast$ = useCallback((msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3500) }, [])

  const fetchAll = useCallback(async () => {
    try {
      const [uD,aD,arD,raD] = await Promise.all([adminAuthApi.getUsers(),adminAuthApi.getAdmins(),adminArticlesApi.getAll(),adminRatingsApi.getAll()])
      if (uD.users) setUsers(uD.users.map(u=>({...u,joinDate:u.created_at?.split('T')[0]||'-',lastActive:u.created_at||new Date().toISOString(),transactions:Number(u.transactions)||0,status:'active'})))
      setAdmins(aD.admins||[]); setArticles(arD.articles||[]); setRatings(raD.ratings||[]); setRatingAvg(raD.average||0); setRatingAspect(raD.aspect_averages||{})
    } catch {}
  }, [])

  useEffect(() => {
    adminAuthApi.getProfile().then(d => { if (d.user?.role!=='admin') { removeAdminToken(); navigate('/admin-login'); return }; setAdmin(d.user); fetchAll() }).catch(()=>{ removeAdminToken(); navigate('/admin-login') })
  }, [navigate, fetchAll])

  function openAdd() { setEditArt(null); setArtForm(EMPTY_FORM); setShowArtForm(true) }
  function openEdit(a) { setEditArt(a); setArtForm({title:a.title,content:a.content,category:a.category,read_time:a.read_time,image:a.image,bg_color:a.bg_color}); setShowArtForm(true) }
  async function saveArt() {
    if (!artForm.title.trim()) return toast$('Judul artikel wajib diisi.','error')
    setArtLoad(true)
    try { if (editArt) { await adminArticlesApi.update(editArt.id,artForm); toast$('Artikel diperbarui!') } else { await adminArticlesApi.create(artForm); toast$('Artikel ditambahkan!') }; setShowArtForm(false); fetchAll() }
    catch(e) { toast$(e.message,'error') }; setArtLoad(false)
  }
  async function delArticle(id) {
    setLoading(true)
    try { await adminArticlesApi.delete(id); toast$('Artikel dihapus.'); setDelArt(null); fetchAll() }
    catch(e) { toast$(e.message,'error') }; setLoading(false)
  }

  const fu = users.filter(u => { const q=search.toLowerCase(); return (!q||u.name.toLowerCase().includes(q)||u.email.toLowerCase().includes(q))&&(filt==='all'||u.status===filt) }).sort((a,b)=>{ if(sortBy==='name')return a.name.localeCompare(b.name); if(sortBy==='transactions')return b.transactions-a.transactions; return new Date(b.joinDate)-new Date(a.joinDate) })
  const totalActive = users.filter(u=>u.status==='active').length
  const totalTx = users.reduce((s,u)=>s+u.transactions,0)
  const unread = sysNotifs.filter(n=>!n.read).length

  if (!admin) return null

  const NAV = [
    {key:'dashboard',icon:'dashboard',label:'Dashboard',sec:'Utama'},
    {key:'users',icon:'users',label:'Pengguna'},
    {key:'articles',icon:'articles',label:'Artikel'},
    {key:'ratings',icon:'ratings',label:'Rating'},
    {key:'admins',icon:'shield',label:'Administrator'},
    {key:'laporan',icon:'report',label:'Laporan',sec:'Tools'},
    {key:'notif-sistem',icon:'bell',label:'Notifikasi Sistem',badge:unread,badgeRed:true},
    {key:'monitor',icon:'monitor',label:'Monitor Admin'},
  ]

  function goTab(k) { setTab(k); setSelUser(null); setMsgTarget(null); setDrawer(false) }

  const Sidebar = () => (
    <>
      {!isDesktop && drawer && <div onClick={()=>setDrawer(false)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:398 }} />}
      <aside style={{ position:'fixed',top:0,left:0,bottom:0,width:240,background:'white',borderRight:'1px solid var(--border)',boxShadow:isDesktop?'4px 0 24px rgba(124,58,237,0.07)':'12px 0 40px rgba(0,0,0,0.2)',zIndex:399,display:'flex',flexDirection:'column',transform:isDesktop?'none':drawer?'translateX(0)':'translateX(-100%)',transition:'transform 0.28s cubic-bezier(0.4,0,0.2,1)',overflowY:'auto' }}>
        <div style={{ padding:'22px 20px 18px',borderBottom:'1px solid var(--border-light)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:38,height:38,borderRadius:10,background:'var(--gradient-btn)',display:'flex',alignItems:'center',justifyContent:'center' }}><img src={logoBase64} alt="" style={{ width:22,objectFit:'contain',borderRadius:4 }} /></div>
            <div><div style={{ fontWeight:900,fontSize:16,color:'#111827',fontFamily:'var(--font-display)' }}>Fin<span style={{ color:'var(--primary)' }}>Smart</span></div><div style={{ fontSize:9,color:'#9CA3AF',fontWeight:800,letterSpacing:1 }}>ADMIN PANEL</div></div>
          </div>
          {!isDesktop && <button onClick={()=>setDrawer(false)} style={{ background:'var(--border-light)',border:'none',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:14 }}>✕</button>}
        </div>
        <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--border-light)',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:40,height:40,borderRadius:12,background:'linear-gradient(135deg,var(--primary),#EC4899)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:900,fontSize:14,flexShrink:0 }}>{initials(admin.name)}</div>
            <div style={{ minWidth:0 }}><div style={{ fontWeight:800,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{admin.name}</div><div style={{ fontSize:11,color:'#9CA3AF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{admin.email}</div></div>
          </div>
          <div style={{ marginTop:10,background:'var(--primary-xlight)',color:'var(--primary)',borderRadius:8,padding:'4px 10px',fontSize:11,fontWeight:800,display:'inline-block' }}>🛡️ Administrator</div>
        </div>
        <nav style={{ padding:'12px',flex:1 }}>
          {NAV.map(item => (
            <div key={item.key}>
              {item.sec && <div style={{ fontSize:10,color:'#9CA3AF',fontWeight:700,letterSpacing:1.2,textTransform:'uppercase',padding:'10px 14px 4px' }}>{item.sec}</div>}
              <button className="a-nav" onClick={()=>goTab(item.key)} style={{ background:tab===item.key?'var(--primary-xlight)':'transparent',color:tab===item.key?'var(--primary)':'var(--text-muted)',fontWeight:tab===item.key?800:600,borderLeft:`3px solid ${tab===item.key?'var(--primary)':'transparent'}` }}>
                <AIcon name={item.icon} size={18} />
                <span style={{ flex:1,textAlign:'left' }}>{item.label}</span>
                {item.badge>0 && <span style={{ background:item.badgeRed?'var(--danger)':'var(--primary)',color:'white',borderRadius:20,padding:'2px 7px',fontSize:10,fontWeight:800,minWidth:20,textAlign:'center' }}>{item.badge}</span>}
              </button>
            </div>
          ))}
        </nav>
        <div style={{ padding:'12px',borderTop:'1px solid var(--border-light)',flexShrink:0 }}>
          <button className="a-nav" onClick={()=>setLogout(true)} style={{ color:'var(--danger)',background:'transparent',fontWeight:700 }} onMouseEnter={e=>e.currentTarget.style.background='var(--danger-light)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <AIcon name="logout" size={18} /> Keluar
          </button>
        </div>
      </aside>
    </>
  )

  const MobileTop = () => (
    <header style={{ position:'sticky',top:0,zIndex:200,background:'var(--gradient-btn)',padding:'0 16px',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 4px 20px rgba(124,58,237,0.3)' }}>
      <button onClick={()=>setDrawer(true)} style={{ background:'rgba(255,255,255,0.15)',border:'none',borderRadius:10,width:38,height:38,cursor:'pointer',color:'white',fontSize:20,display:'flex',alignItems:'center',justifyContent:'center' }}>☰</button>
      <span style={{ fontWeight:900,fontSize:17,color:'white',fontFamily:'var(--font-display)' }}>Fin<span style={{ opacity:0.8 }}>Smart</span> <span style={{ background:'rgba(255,255,255,0.2)',borderRadius:5,padding:'2px 6px',fontSize:9,fontWeight:800 }}>ADMIN</span></span>
      <div style={{ width:36,height:36,borderRadius:10,background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:900,fontSize:13 }}>{initials(admin.name)}</div>
    </header>
  )

  const MobileTabBar = () => (
    <div style={{ display:'flex',background:'white',borderBottom:'2px solid var(--border-light)',position:'sticky',top:60,zIndex:190,overflowX:'auto' }}>
      {NAV.slice(0,5).map(item=>(
        <button key={item.key} onClick={()=>goTab(item.key)} style={{ flex:'0 0 auto',display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'8px 12px 6px',border:'none',background:'transparent',color:tab===item.key?'var(--primary)':'#9CA3AF',fontWeight:tab===item.key?800:600,fontSize:10,cursor:'pointer',borderBottom:tab===item.key?'2px solid var(--primary)':'2px solid transparent',marginBottom:-2,whiteSpace:'nowrap',fontFamily:'inherit' }}>
          <AIcon name={item.icon} size={17} />{item.label}
        </button>
      ))}
    </div>
  )

  const DesktopTop = () => {
    const cur = NAV.find(n=>n.key===tab)
    return (
      <div style={{ background:'white',borderBottom:'1px solid var(--border-light)',padding:'16px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:150,boxShadow:'0 2px 10px rgba(124,58,237,0.05)' }}>
        <div>
          <h1 style={{ fontWeight:900,fontSize:22,color:'#111827',margin:0,fontFamily:'var(--font-display)',display:'flex',alignItems:'center',gap:10 }}>
            <AIcon name={msgTarget?'send':cur?.icon} size={22} color="var(--primary)" /> {msgTarget?`Kirim Pesan ke ${msgTarget.name}`:cur?.label||'Dashboard'}
          </h1>
          <p style={{ color:'#9CA3AF',fontSize:13,margin:'4px 0 0' }}>{tab==='users'?`${users.length} pengguna · ${totalActive} aktif`:tab==='articles'?`${articles.length} artikel`:tab==='ratings'?`${ratings.length} ulasan · rata-rata ${ratingAvg}⭐`:''}</p>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:12 }}>
          <div style={{ textAlign:'right' }}><div style={{ fontWeight:800,fontSize:14 }}>{admin.name}</div><div style={{ fontSize:12,color:'#9CA3AF' }}>{admin.email}</div></div>
          <div style={{ width:42,height:42,borderRadius:13,background:'var(--gradient-main)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:900,fontSize:15 }}>{initials(admin.name)}</div>
        </div>
      </div>
    )
  }

  // ── DASHBOARD ──
  const DashTab = () => (
    <div className="a-fade">
      <div style={{ display:'grid',gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:isMobile?10:14,marginBottom:20 }}>
        {[{l:'Total User',v:users.length,i:'👥',c:'var(--primary)',bg:'var(--primary-xlight)',k:'users'},{l:'User Aktif',v:totalActive,i:'✅',c:'var(--success)',bg:'var(--success-light)',k:'users'},{l:'Total Transaksi',v:totalTx.toLocaleString(),i:'💸',c:'var(--warning)',bg:'var(--warning-light)',k:'laporan'},{l:'Total Artikel',v:articles.length,i:'📰',c:'var(--accent)',bg:'#ECFEFF',k:'articles'}].map(s=>(
          <div key={s.l} className="a-stat" style={{ border:`1.5px solid ${s.bg}` }} onClick={()=>goTab(s.k)}>
            <div style={{ fontSize:isMobile?22:26,marginBottom:6 }}>{s.i}</div>
            <div style={{ fontSize:isMobile?22:26,fontWeight:900,color:s.c,lineHeight:1 }}>{s.v}</div>
            <div style={{ fontSize:12,color:'#9CA3AF',fontWeight:600,marginTop:4 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid',gridTemplateColumns:isDesktop?'1fr 360px':'1fr',gap:20 }}>
        <div className="a-card">
          <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--border-light)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div style={{ fontWeight:800,fontSize:15 }}>Pengguna Terbaru</div>
            <button onClick={()=>goTab('users')} style={{ background:'none',border:'none',color:'var(--primary)',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>Lihat semua →</button>
          </div>
          <table className="a-tbl">
            <thead><tr><th>Nama</th><th>Bergabung</th><th>Status</th></tr></thead>
            <tbody>
              {users.slice(0,4).map((u,i)=>(
                <tr key={u.id} onClick={()=>setSelUser(u)}>
                  <td><div style={{ display:'flex',alignItems:'center',gap:8 }}><Av name={u.name} idx={i} size={28} /><span style={{ fontWeight:700 }}>{u.name}</span></div></td>
                  <td style={{ color:'#9CA3AF',fontSize:12 }}>{fmtDate(u.joinDate)}</td>
                  <td><Chip status={u.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div className="a-card" style={{ padding:16 }}>
            <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Aksi Cepat</div>
            {[{i:'📰',l:'Tambah Artikel',a:()=>{goTab('articles');openAdd()}},{i:'👤',l:'Monitor Admin',a:()=>goTab('monitor')},{i:'📊',l:'Lihat Laporan',a:()=>goTab('laporan')}].map(a=>(
              <button key={a.l} onClick={a.a} className="a-btn" style={{ width:'100%',background:'#F9F7FF',color:'#374151',justifyContent:'flex-start',border:'1px solid var(--primary-xlight)',marginBottom:8 }}
                onMouseEnter={e=>{e.currentTarget.style.background='var(--primary-xlight)';e.currentTarget.style.color='var(--primary)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='#F9F7FF';e.currentTarget.style.color='#374151'}}>
                <span>{a.i}</span>{a.l}
              </button>
            ))}
          </div>
          {unread>0 && (
            <div className="a-card" style={{ border:'1.5px solid var(--danger-light)',padding:'12px 16px',display:'flex',alignItems:'center',gap:8 }}>
              <div style={{ width:8,height:8,borderRadius:'50%',background:'var(--danger)',flexShrink:0 }} />
              <div style={{ flex:1 }}><div style={{ fontWeight:700,fontSize:13,color:'#DC2626' }}>{unread} Alert Sistem</div><div style={{ fontSize:11,color:'#9CA3AF' }}>{sysNotifs.find(n=>!n.read)?.text}</div></div>
              <button onClick={()=>goTab('notif-sistem')} style={{ background:'var(--danger-light)',border:'none',color:'#DC2626',borderRadius:8,padding:'5px 10px',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>Lihat</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // ── USERS ──
  const UsersTab = () => (
    <div className="a-fade">
      <div style={{ display:'grid',gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:isMobile?10:14,marginBottom:20 }}>
        {[{l:'Total User',v:users.length,i:'👥',c:'var(--primary)',bg:'var(--primary-xlight)'},{l:'User Aktif',v:totalActive,i:'✅',c:'var(--success)',bg:'var(--success-light)'},{l:'Transaksi',v:totalTx.toLocaleString(),i:'💸',c:'var(--warning)',bg:'var(--warning-light)'},{l:'Total Artikel',v:articles.length,i:'📰',c:'var(--accent)',bg:'#ECFEFF'}].map(s=>(
          <div key={s.l} className="a-stat" style={{ border:`1.5px solid ${s.bg}` }}>
            <div style={{ fontSize:isMobile?22:26,marginBottom:6 }}>{s.i}</div>
            <div style={{ fontSize:isMobile?22:26,fontWeight:900,color:s.c,lineHeight:1 }}>{s.v}</div>
            <div style={{ fontSize:12,color:'#9CA3AF',fontWeight:600,marginTop:4 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex',flexWrap:'wrap',gap:10,marginBottom:14,alignItems:'center' }}>
        <div style={{ position:'relative',flex:'1 1 180px',minWidth:160 }}>
          <span style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:14 }}>🔍</span>
          <input placeholder="Cari nama atau email..." value={search} onChange={e=>setSearch(e.target.value)} style={{ width:'100%',paddingLeft:36,paddingRight:12,height:40,fontSize:13,border:'1.5px solid var(--border)',borderRadius:20,outline:'none',boxSizing:'border-box',fontFamily:'inherit' }} />
        </div>
        <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
          {['all','active','inactive'].map(f=><button key={f} className={`a-filter${filt===f?' on':''}`} onClick={()=>setFilt(f)}>{f==='all'?'Semua':f==='active'?'✅ Aktif':'⭕ Nonaktif'}</button>)}
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ background:'white',border:'1.5px solid var(--border)',borderRadius:20,padding:'6px 12px',fontSize:12,color:'#111827',cursor:'pointer',fontFamily:'inherit' }}>
            <option value="joinDate">Terbaru</option><option value="name">Nama A–Z</option><option value="transactions">Transaksi</option>
          </select>
        </div>
      </div>
      {isDesktop ? (
        <div className="a-card">
          <div style={{ overflowX:'auto' }}>
          <table className="a-tbl" style={{ minWidth:760 }}>
            <thead><tr><th>Pengguna</th><th>Email</th><th>Status</th><th>Transaksi</th><th>Bergabung</th><th>Terakhir Aktif</th><th>Aksi</th></tr></thead>
            <tbody>
              {fu.length===0 && <tr><td colSpan={7} style={{ padding:48,textAlign:'center',color:'#9CA3AF' }}>Tidak ada pengguna</td></tr>}
              {fu.map((u,i)=>(
                <tr key={u.id} onClick={()=>setSelUser(u)}>
                  <td><div style={{ display:'flex',alignItems:'center',gap:10 }}><Av name={u.name} idx={i} size={36} /><span style={{ fontWeight:700 }}>{u.name}</span></div></td>
                  <td style={{ color:'var(--text-muted)',fontSize:13 }}>{u.email}</td>
                  <td><Chip status={u.status} /></td>
                  <td style={{ fontWeight:700 }}>{u.transactions}</td>
                  <td style={{ color:'var(--text-muted)',fontSize:13 }}>{fmtDate(u.joinDate)}</td>
                  <td style={{ color:'var(--text-muted)',fontSize:13 }}>{timeAgo(u.lastActive)}</td>
                  <td><button onClick={e=>{e.stopPropagation();setMsgTarget(u);setTab('__msg__')}} className="a-btn" style={{ background:'var(--primary-xlight)',color:'var(--primary)',padding:'5px 10px',fontSize:11,borderRadius:8 }}>📨 Pesan</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div style={{ display:'grid',gridTemplateColumns:isTablet?'1fr 1fr':'1fr',gap:10 }}>
          {fu.map((u,i)=>(
            <div key={u.id} className="a-card" style={{ display:'flex',alignItems:'center',gap:12,padding:14,cursor:'pointer' }} onClick={()=>setSelUser(u)}>
              <Av name={u.name} idx={i} size={44} />
              <div style={{ flex:1,minWidth:0 }}><div style={{ fontWeight:800,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{u.name}</div><div style={{ fontSize:12,color:'var(--text-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{u.email}</div><div style={{ fontSize:11,color:'#9CA3AF',marginTop:2 }}>💸 {u.transactions} tx · {timeAgo(u.lastActive)}</div></div>
              <span style={{ color:'#9CA3AF',fontSize:18 }}>›</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── ARTICLES ──
  const ArtTab = () => (
    <div className="a-fade">
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10 }}>
        <div><h3 style={{ fontWeight:900,fontSize:18,color:'#111827',margin:0,fontFamily:'var(--font-display)',display:'flex',alignItems:'center',gap:8 }}><AIcon name="articles" size={19} color="var(--primary)" /> Kelola Artikel Edukasi</h3><p style={{ color:'#9CA3AF',fontSize:13,margin:'4px 0 0' }}>{articles.length} artikel tersedia</p></div>
        <button className="a-btn a-primary" onClick={openAdd}>➕ Tambah Artikel</button>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:isDesktop?'repeat(3,1fr)':isTablet?'1fr 1fr':'1fr',gap:14 }}>
        {articles.map(a=>(
          <div key={a.id} className="a-card" style={{ transition:'transform .15s,box-shadow .15s' }} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'}} onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}>
            <div style={{ background:a.bg_color||'var(--primary-xlight)',padding:'20px',textAlign:'center' }}><span style={{ fontSize:36 }}>{a.image||'📄'}</span></div>
            <div style={{ padding:'14px 16px' }}>
              <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:6 }}><span style={{ background:'var(--primary-xlight)',color:'var(--primary)',borderRadius:6,padding:'3px 8px',fontSize:10,fontWeight:800 }}>{a.category}</span><span style={{ fontSize:11,color:'#9CA3AF' }}>⏱ {a.read_time} mnt</span></div>
              <div style={{ fontWeight:800,fontSize:14,color:'#111827',marginBottom:6,lineHeight:1.4 }}>{a.title}</div>
              <div style={{ fontSize:12,color:'var(--text-muted)',marginBottom:12,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' }}>{a.content}</div>
              <div style={{ display:'flex',gap:8 }}>
                <button onClick={()=>openEdit(a)} className="a-btn a-warn" style={{ flex:1,justifyContent:'center',borderRadius:10,padding:8 }}>✏️ Edit</button>
                <button onClick={()=>setDelArt(a)} className="a-btn a-danger" style={{ flex:1,justifyContent:'center',borderRadius:10,padding:8 }}>🗑 Hapus</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // ── RATINGS ──
  const RatTab = () => (
    <div className="a-fade">
      <div style={{ marginBottom:16 }}><h3 style={{ fontWeight:900,fontSize:18,margin:0,fontFamily:'var(--font-display)',display:'flex',alignItems:'center',gap:8 }}><AIcon name="ratings" size={19} color="var(--warning)" /> Rating & Feedback</h3><p style={{ color:'#9CA3AF',fontSize:13,margin:'4px 0 0' }}>{ratings.length} ulasan · rata-rata {ratingAvg}/5.0</p></div>
      <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)',gap:12,marginBottom:18 }}>
        <div style={{ background:'linear-gradient(135deg,var(--warning),#FBBF24)',borderRadius:16,padding:20,color:'var(--text)' }}><div style={{ fontSize:36,fontWeight:900,marginBottom:4 }}>{ratingAvg}</div><div style={{ fontSize:13,fontWeight:700,opacity:0.8 }}>Rata-rata Rating</div><div style={{ fontSize:22,marginTop:4 }}>{'⭐'.repeat(Math.round(ratingAvg))}</div></div>
        <div className="a-card" style={{ padding:20 }}><div style={{ fontSize:36,fontWeight:900,color:'var(--primary)',marginBottom:4 }}>{ratings.length}</div><div style={{ fontSize:13,color:'#9CA3AF',fontWeight:700 }}>Total Ulasan</div></div>
        <div className="a-card" style={{ padding:20 }}><div style={{ fontSize:36,fontWeight:900,color:'var(--success)',marginBottom:4 }}>{ratings.filter(r=>r.score>=4).length}</div><div style={{ fontSize:13,color:'#9CA3AF',fontWeight:700 }}>Rating Positif (≥4)</div></div>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
        {ratings.map((r,i)=>(
          <div key={r.id} className="a-card" style={{ padding:'16px 20px' }}>
            <div style={{ display:'flex',alignItems:'flex-start',gap:12,flexWrap:'wrap' }}>
              <Av name={r.name||'U'} idx={i} size={42} />
              <div style={{ flex:1,minWidth:180 }}>
                <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:4 }}><span style={{ fontWeight:800,fontSize:14 }}>{r.name||'Pengguna'}</span><span style={{ fontSize:13,color:'var(--text-muted)' }}>{r.email}</span></div>
                <div style={{ display:'flex',gap:2,marginBottom:6 }}>{[1,2,3,4,5].map(s=><span key={s} style={{ fontSize:16 }}>{s<=r.score?'⭐':'☆'}</span>)}<span style={{ marginLeft:6,fontSize:12,fontWeight:800,color:'var(--warning)' }}>{r.score}.0</span></div>
                {r.comment && <div style={{ fontSize:13,color:'#374151',background:'#F9FAFB',borderRadius:10,padding:'8px 12px',borderLeft:'3px solid var(--primary)',marginBottom:8 }}>"{r.comment}"</div>}
              </div>
              <div style={{ fontSize:12,color:'#9CA3AF',flexShrink:0 }}>{timeAgo(r.created_at)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // ── ADMINS ──
  const AdminsTab = () => (
    <div className="a-fade">
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10 }}>
        <div><h3 style={{ fontWeight:900,fontSize:18,margin:0,fontFamily:'var(--font-display)',display:'flex',alignItems:'center',gap:8 }}><AIcon name="shield" size={19} color="var(--primary)" /> Daftar Administrator</h3><p style={{ color:'#9CA3AF',fontSize:13,margin:'4px 0 0' }}>{admins.length} admin terdaftar</p></div>
        <button className="a-btn a-primary" onClick={()=>navigate('/admin-register-request')}>➕ Daftar Admin Baru</button>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:isDesktop?'repeat(3,1fr)':isTablet?'1fr 1fr':'1fr',gap:14 }}>
        {admins.map((a,i)=>(
          <div key={a.id} className="a-card" style={{ padding:18,border:a.id===admin.id?'2px solid var(--primary)':a.role==='superadmin'?'2px solid var(--warning)':'1px solid var(--border-light)',position:'relative',transition:'transform .15s' }} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e=>e.currentTarget.style.transform=''}>
            {a.id===admin.id && <div style={{ position:'absolute',top:-1,right:12,background:'var(--primary)',color:'white',fontSize:9,fontWeight:800,padding:'3px 8px',borderRadius:'0 0 8px 8px' }}>KAMU</div>}
            <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:12 }}>
              <Av name={a.name} idx={i} size={46} extra={{ borderRadius:14,background:a.role==='superadmin'?'linear-gradient(135deg,var(--warning),#FBBF24)':AV[i%AV.length] }} />
              <div style={{ minWidth:0 }}><div style={{ fontWeight:800,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{a.name}</div><div style={{ fontSize:12,color:'var(--text-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{a.email}</div></div>
            </div>
            <div style={{ background:a.role==='superadmin'?'var(--warning-light)':'var(--primary-xlight)',borderRadius:8,padding:'6px 10px',display:'flex',alignItems:'center',gap:6 }}>
              <span>{a.role==='superadmin'?'⭐':'🛡️'}</span>
              <span style={{ fontSize:11,color:a.role==='superadmin'?'#92400E':'#5B21B6',fontWeight:700 }}>{a.role==='superadmin'?'Super Admin':'Administrator'} · {fmtDate(a.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // ── MODALS ──
  const artModal = !showArtForm ? null : (
    <div className="a-overlay" onClick={e=>e.target===e.currentTarget&&setShowArtForm(false)}>
      <div className="a-modal" onClick={e=>e.stopPropagation()} style={{ maxWidth:560 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
          <h3 style={{ fontWeight:900,fontSize:18,margin:0,fontFamily:'var(--font-display)' }}>{editArt?'✏️ Edit Artikel':'➕ Tambah Artikel'}</h3>
          <button onClick={()=>setShowArtForm(false)} style={{ background:'var(--border-light)',border:'none',borderRadius:'50%',width:34,height:34,cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div><label style={{ fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:5 }}>Judul *</label><input className="a-inp" value={artForm.title} onChange={e=>setArtForm(f=>({...f,title:e.target.value}))} placeholder="Judul artikel..." /></div>
          <div><label style={{ fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:5 }}>Konten</label><textarea className="a-inp" value={artForm.content} onChange={e=>setArtForm(f=>({...f,content:e.target.value}))} rows={4} placeholder="Isi artikel..." style={{ resize:'vertical' }} /></div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div><label style={{ fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:5 }}>Kategori</label><select className="a-inp" value={artForm.category} onChange={e=>setArtForm(f=>({...f,category:e.target.value}))}>{ARTICLE_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
            <div><label style={{ fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:5 }}>Waktu Baca (mnt)</label><input className="a-inp" type="number" min={1} max={60} value={artForm.read_time} onChange={e=>setArtForm(f=>({...f,read_time:Number(e.target.value)}))} /></div>
          </div>
          <div><label style={{ fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:8 }}>Icon</label><div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>{ARTICLE_ICONS.map(ic=><button key={ic} onClick={()=>setArtForm(f=>({...f,image:ic}))} style={{ width:42,height:42,border:`2px solid ${artForm.image===ic?'var(--primary)':'var(--border)'}`,borderRadius:10,background:artForm.image===ic?'var(--primary-xlight)':'white',fontSize:22,cursor:'pointer',transition:'all .15s' }}>{ic}</button>)}</div></div>
          <div><label style={{ fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:8 }}>Warna</label><div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>{ARTICLE_COLORS.map(c=><button key={c} onClick={()=>setArtForm(f=>({...f,bg_color:c}))} style={{ width:36,height:36,borderRadius:9,background:c,border:`${artForm.bg_color===c?'3px solid var(--primary)':'2px solid var(--border)'}`,cursor:'pointer' }} />)}</div></div>
          <div style={{ background:'#F9FAFB',borderRadius:14,padding:14,display:'flex',alignItems:'center',gap:14 }}>
            <div style={{ width:56,height:56,borderRadius:14,background:artForm.bg_color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0 }}>{artForm.image}</div>
            <div><div style={{ fontSize:11,color:'#9CA3AF',fontWeight:700,textTransform:'uppercase',marginBottom:2 }}>{artForm.category} · {artForm.read_time} mnt</div><div style={{ fontWeight:800,fontSize:14,color:'#111827' }}>{artForm.title||'Judul artikel...'}</div></div>
          </div>
        </div>
        <div style={{ display:'flex',gap:10,marginTop:20 }}>
          <button onClick={()=>setShowArtForm(false)} className="a-btn a-ghost" style={{ flex:1,justifyContent:'center' }}>Batal</button>
          <button onClick={saveArt} disabled={artLoad} className="a-btn a-primary" style={{ flex:2,justifyContent:'center',opacity:artLoad?.7:1 }}>{artLoad?'⏳ Menyimpan...':editArt?'💾 Simpan':'➕ Tambah'}</button>
        </div>
      </div>
    </div>
  )

  const DelModal = () => !delArt ? null : (
    <div className="a-overlay" onClick={e=>e.target===e.currentTarget&&setDelArt(null)}>
      <div className="a-modal" style={{ textAlign:'center',maxWidth:360 }}>
        <div style={{ fontSize:48,marginBottom:12 }}>🗑️</div>
        <h3 style={{ fontWeight:900,fontSize:17,marginBottom:8,fontFamily:'var(--font-display)' }}>Hapus Artikel?</h3>
        <p style={{ color:'var(--text-muted)',fontSize:13,marginBottom:22 }}>Artikel <strong>"{delArt.title}"</strong> akan dihapus permanen.</p>
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={()=>setDelArt(null)} className="a-btn a-ghost" style={{ flex:1,justifyContent:'center' }}>Batal</button>
          <button onClick={()=>delArticle(delArt.id)} disabled={loading} className="a-btn" style={{ flex:1,justifyContent:'center',background:'var(--danger)',color:'white',opacity:loading?.7:1 }}>{loading?'⏳':'🗑 Hapus'}</button>
        </div>
      </div>
    </div>
  )

  const UserModal = () => !selUser ? null : (
    <div className="a-overlay" onClick={e=>e.target===e.currentTarget&&setSelUser(null)}>
      <div className="a-modal" style={{ maxWidth:520 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18 }}>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <Av name={selUser.name} size={52} extra={{ borderRadius:16 }} />
            <div><div style={{ fontWeight:900,fontSize:17 }}>{selUser.name}</div><div style={{ fontSize:13,color:'var(--text-muted)' }}>{selUser.email}</div></div>
          </div>
          <button onClick={()=>setSelUser(null)} style={{ background:'var(--border-light)',border:'none',borderRadius:'50%',width:34,height:34,cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16 }}>
          {[{i:'📅',l:'Bergabung',v:fmtDate(selUser.joinDate)},{i:'⏱',l:'Terakhir Aktif',v:timeAgo(selUser.lastActive)},{i:'💸',l:'Transaksi',v:selUser.transactions},{i:'✅',l:'Status',v:'Aktif'}].map(x=>(
            <div key={x.l} style={{ background:'var(--border-light)',borderRadius:12,padding:'10px 12px' }}><div style={{ fontSize:18,marginBottom:2 }}>{x.i}</div><div style={{ fontSize:17,fontWeight:900 }}>{x.v}</div><div style={{ fontSize:11,color:'#9CA3AF',fontWeight:600 }}>{x.l}</div></div>
          ))}
        </div>
        <div style={{ display:'flex',gap:10 }}>
          <button className="a-btn a-primary" style={{ flex:1,justifyContent:'center' }} onClick={()=>{setMsgTarget(selUser);setSelUser(null);setTab('__msg__')}}>📨 Kirim Pesan</button>
          <button onClick={()=>setSelUser(null)} className="a-btn a-ghost" style={{ flex:1,justifyContent:'center' }}>Tutup</button>
        </div>
      </div>
    </div>
  )

  const LogoutModal = () => !logout ? null : (
    <div className="a-overlay" onClick={e=>e.target===e.currentTarget&&setLogout(false)}>
      <div className="a-modal" style={{ textAlign:'center',maxWidth:340 }}>
        <div style={{ fontSize:48,marginBottom:12 }}>👋</div>
        <h3 style={{ fontWeight:900,fontSize:18,marginBottom:6,fontFamily:'var(--font-display)' }}>Keluar dari Admin?</h3>
        <p style={{ color:'var(--text-muted)',fontSize:13,marginBottom:22 }}>Kamu akan kembali ke halaman login admin.</p>
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={()=>setLogout(false)} className="a-btn a-ghost" style={{ flex:1,justifyContent:'center' }}>Batal</button>
          <button onClick={()=>{removeAdminToken();navigate('/admin-login')}} className="a-btn" style={{ flex:1,justifyContent:'center',background:'var(--danger)',color:'white' }}>Keluar</button>
        </div>
      </div>
    </div>
  )

  const Toast = () => !toast ? null : (
    <div style={{ position:'fixed',bottom:24,right:24,zIndex:800,background:toast.type==='error'?'var(--danger)':'var(--success)',color:'white',borderRadius:14,padding:'14px 20px',fontSize:13,fontWeight:700,boxShadow:'0 8px 24px rgba(0,0,0,0.2)',animation:'fadeIn 0.2s',maxWidth:320 }}>
      {toast.type==='error'?'❌ ':'✅ '}{toast.msg}
    </div>
  )

  return (
    <div style={{ minHeight:'100vh',width:'100%',background:'#F9FAFB',fontFamily:'var(--font-body,system-ui,sans-serif)' }}>
      <style>{S}</style>
      <Sidebar />
      <div style={{ marginLeft:isDesktop?240:0,minHeight:'100vh',display:'flex',flexDirection:'column',transition:'margin-left 0.28s' }}>
        {!isDesktop && <MobileTop />}
        {!isDesktop && <MobileTabBar />}
        {isDesktop  && <DesktopTop />}
        <main style={{ flex:1,padding:isDesktop?28:16,paddingBottom:48 }}>
          {tab==='dashboard'    && <DashTab />}
          {tab==='users'        && <UsersTab />}
          {tab==='articles'     && <ArtTab />}
          {tab==='ratings'      && <RatTab />}
          {tab==='admins'       && <AdminsTab />}
          {tab==='laporan'      && <LaporanPage users={users} articles={articles} ratings={ratings} ratingAvg={ratingAvg} />}
          {tab==='notif-sistem' && <NotifPage notifs={sysNotifs} setNotifs={setSysNotifs} />}
          {tab==='monitor'      && <MonitorPage realAdmins={admins} myId={admin.id} onRefresh={fetchAll} showToast={toast$} />}
          {tab==='__msg__'      && msgTarget && <MsgPage user={msgTarget} onBack={()=>{setMsgTarget(null);setTab('users')}} />}
        </main>
      </div>
      <UserModal /><LogoutModal />{artModal}<DelModal /><Toast />
    </div>
  )
}