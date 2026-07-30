import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { authApi } from '../api'
import BottomNav from '../components/BottomNav'
import { logoBase64 } from '../assets/logo'

// ── Local storage helpers ──────────────────────────────────────────
const LS_PIN     = 'fs_pin_hash'
const LS_2FA     = 'fs_2fa_enabled'
const LS_BIO     = 'fs_biometrik'
const LS_DEVICES = 'fs_devices'

function simpleHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return h.toString(16)
}

function getDevices() {
  try { return JSON.parse(localStorage.getItem(LS_DEVICES) || '[]') } catch { return [] }
}
function addCurrentDevice() {
  const ua = navigator.userAgent
  const isMobile = /Mobile|Android|iPhone/i.test(ua)
  const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Browser'
  const os = ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : ua.includes('Android') ? 'Android' : ua.includes('iPhone') ? 'iOS' : 'Unknown OS'
  const id = 'dev_' + Date.now()
  const dev = { id, browser, os, isMobile, ip: '127.0.0.1', location: 'Bogor, Indonesia', lastActive: new Date().toISOString(), current: true }
  const existing = getDevices().filter(d => !d.current)
  localStorage.setItem(LS_DEVICES, JSON.stringify([dev, ...existing]))
}

export default function Profile() {
  const { user, logout, updateUser, refetchProfile } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [showKeamanan, setShowKeamanan] = useState(false)
  const [keamananStep, setKeamananStep] = useState('menu')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = React.useRef(null)

  // Fetch stats lengkap + init device saat mount
  useEffect(() => {
    refetchProfile()
    addCurrentDevice()
  }, []) // eslint-disable-line

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast('File harus berupa gambar', 'error'); return }
    if (file.size > 2 * 1024 * 1024) { toast('Ukuran gambar maksimal 2 MB', 'error'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result)
      setAvatarFile(file)
    }
    reader.readAsDataURL(file)
  }

  const handleAvatarSave = async () => {
    if (!avatarPreview) return
    setUploadingAvatar(true)
    try {
      const data = await authApi.updateProfile({ avatar: avatarPreview })
      updateUser(data.user)
      setAvatarPreview(null)
      setAvatarFile(null)
      toast('Foto profil diperbarui ✅', 'success')
    } catch (err) {
      toast(err.message || 'Gagal mengunggah foto', 'error')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarCancel = () => {
    setAvatarPreview(null)
    setAvatarFile(null)
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  const handleLogout = () => { logout(); navigate('/'); toast('Sampai jumpa! 👋', 'success') }
  const handleSave   = async () => {
    const trimmed = name.trim()
    if (!trimmed) { toast('Nama tidak boleh kosong', 'error'); return }
    if (trimmed === user?.name) { setEditing(false); return }
    setSaving(true)
    try {
      const data = await authApi.updateProfile({ name: trimmed })
      updateUser(data.user)
      setEditing(false)
      toast('Profil diperbarui ✅', 'success')
    } catch (err) {
      toast(err.message || 'Gagal menyimpan profil', 'error')
    } finally {
      setSaving(false)
    }
  }

  const closeKeamanan = () => { setShowKeamanan(false); setKeamananStep('menu') }

  const menuItems = [
    { icon:'👤', label:'Edit Profil',          action: () => setEditing(e => !e) },
    { icon:'🔔', label:'Notifikasi',            action: () => navigate('/notifikasi') },
    { icon:'🔒', label:'Keamanan',             action: () => setShowKeamanan(true) },
    { icon:'📊', label:'Simulasi Investasi',   action: () => navigate('/simulation') },
    { icon:'📚', label:'Riwayat Edukasi',      action: () => navigate('/education') },
    { icon:'⭐', label:'Beri Rating Aplikasi', action: () => navigate('/rating') },
    { icon:'❓', label:'Bantuan & FAQ',         action: () => navigate('/bantuan') },
  ]

  return (
    <div className="app-shell">
      <div className="page">
        {/* Profile Header */}
        <div style={{ background:'var(--gradient-main)', padding:'clamp(40px,8vw,56px) var(--page-padding) clamp(24px,5vw,32px)', textAlign:'center', borderRadius:'0 0 var(--radius-xl) var(--radius-xl)', marginBottom:20, position:'relative', overflow:'hidden' }}>
          <span style={{ position:'absolute', top:-30, right:-30, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }}/>
          {/* Avatar — klik untuk ganti foto */}
          <div style={{ position:'relative', width:'clamp(70px,18vw,88px)', margin:'0 auto 12px' }}>
            <div
              onClick={() => avatarInputRef.current?.click()}
              style={{ width:'clamp(70px,18vw,88px)', height:'clamp(70px,18vw,88px)', borderRadius:'50%', background:'white', border:'4px solid rgba(255,255,255,0.6)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 24px rgba(0,0,0,0.18)', overflow:'hidden', cursor:'pointer' }}
            >
              <img
                src={avatarPreview || user?.avatar || logoBase64}
                alt="Foto Profil"
                style={{ width:'100%', height:'100%', objectFit:'cover' }}
              />
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              style={{ position:'absolute', bottom:0, right:0, width:26, height:26, borderRadius:'50%', background:'var(--primary)', border:'2px solid white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.2)' }}
              title="Ganti foto profil"
            >📷</button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display:'none' }}
              onChange={handleAvatarChange}
            />
          </div>

          {/* Tombol konfirmasi setelah pilih foto */}
          {avatarPreview && (
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:10 }}>
              <button
                onClick={handleAvatarSave}
                disabled={uploadingAvatar}
                style={{ background:'rgba(255,255,255,0.9)', border:'none', borderRadius:20, padding:'6px 16px', fontSize:13, fontWeight:700, color:'var(--primary)', cursor:'pointer' }}
              >
                {uploadingAvatar ? '⏳ Menyimpan...' : '✅ Simpan Foto'}
              </button>
              <button
                onClick={handleAvatarCancel}
                disabled={uploadingAvatar}
                style={{ background:'rgba(255,255,255,0.3)', border:'none', borderRadius:20, padding:'6px 14px', fontSize:13, fontWeight:700, color:'white', cursor:'pointer' }}
              >
                ✕ Batal
              </button>
            </div>
          )}
          <h2 style={{ color:'white', fontSize:'clamp(18px,5vw,22px)', fontWeight:900, marginBottom:4, fontFamily:'var(--font-display)' }}>{user?.name || 'Nama Pengguna'}</h2>
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'clamp(12px,3vw,14px)' }}>{user?.email || 'nama@email.com'}</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginTop:20 }}>
            {[
              { label:'Transaksi', value: user?.stats?.transactions ?? '—', color:'white' },
              { label:'Budget OK', value: user?.stats?.budgetOk != null ? `${user.stats.budgetOk}%` : '—', color:'#86EFAC' },
              { label:'Artikel',   value: user?.stats?.articles ?? '—',       color:'#FDE68A' },
            ].map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,0.15)', borderRadius:'var(--radius-sm)', padding:'clamp(10px,3vw,14px) 8px' }}>
                <div style={{ color:s.color, fontWeight:900, fontSize:'clamp(18px,5vw,24px)', fontFamily:'var(--font-display)' }}>{s.value}</div>
                <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'clamp(10px,2.5vw,12px)', marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="card animate-fadeup" style={{ margin:'0 var(--page-padding) 14px' }}>
            <div style={{ fontWeight:800, fontSize:16, marginBottom:14, fontFamily:'var(--font-display)' }}>Edit Profil</div>
            <div className="input-group">
              <label className="input-label">Nama</label>
              <input className="input-field" value={name} onChange={e => setName(e.target.value)}/>
            </div>
            <div className="flex gap-8">
              <button className="btn btn-primary" style={{ flex:1 }} onClick={handleSave} disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan ✓'}
              </button>
              <button className="btn btn-outline" style={{ flex:1 }} onClick={() => setEditing(false)} disabled={saving}>Batal</button>
            </div>
          </div>
        )}

        {/* Menu */}
        <div style={{ padding:'0 var(--page-padding)' }}>
          {menuItems.map(item => (
            <button key={item.label} onClick={item.action} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'clamp(13px,3vw,16px)', background:'white', border:'1px solid var(--border-light)', borderRadius:'var(--radius-sm)', marginBottom:8, cursor:'pointer', boxShadow:'var(--shadow-sm)', transition:'all 0.15s', textAlign:'left', fontFamily:'var(--font-body)' }}>
              <span style={{ fontSize:'clamp(18px,5vw,22px)', width:32, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
              <span style={{ flex:1, fontWeight:700, fontSize:'clamp(13px,3.5vw,15px)' }}>{item.label}</span>
              <span style={{ color:'var(--text-muted)', fontSize:18 }}>›</span>
            </button>
          ))}
          <button className="btn btn-danger w-full" style={{ marginTop:8, padding:'clamp(13px,3vw,16px)' }} onClick={handleLogout}>
            🚪 Keluar
          </button>
        </div>
        <div style={{ height:20 }}/>
      </div>
      <BottomNav/>

      {/* Modal Keamanan */}
      {showKeamanan && (
        <KeamananModal
          step={keamananStep}
          setStep={setKeamananStep}
          onClose={closeKeamanan}
          user={user}
          toast={toast}
        />
      )}

      <style>{`@keyframes slideUp { from { transform:translateY(100%) } to { transform:translateY(0) } }`}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  MODAL KEAMANAN
// ══════════════════════════════════════════════════════════════════
function KeamananModal({ step, setStep, onClose, user, toast }) {
  const twoFAEnabled = localStorage.getItem(LS_2FA) === 'true'

  const menuItems = [
    { emoji:'🔑', title:'Ubah Password',          desc:'Ganti password akunmu',              step:'ubahPassword' },
    { emoji:'🛡️', title:'Verifikasi 2 Langkah',   desc: twoFAEnabled ? 'Aktif – Email OTP'  : 'Nonaktif – Tambah lapisan keamanan', step:'twoFA', badge: twoFAEnabled ? 'Aktif' : null },
    { emoji:'📱', title:'Perangkat Aktif',         desc:'Lihat sesi login aktif',             step:'perangkat'    },
  ]

  const Wrapper = ({ children }) => (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'white', borderRadius:'24px 24px 0 0', padding:28, width:'100%', maxWidth:'var(--shell-width)', maxHeight:'88vh', overflowY:'auto', animation:'slideUp 0.3s ease' }}>
        {children}
      </div>
    </div>
  )

  const BackBtn = ({ label }) => (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
      <button onClick={() => setStep('menu')} style={{ background:'var(--border-light)', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
      <div>
        <h3 style={{ fontSize:18, fontWeight:900, fontFamily:'var(--font-display)', color:'var(--text)' }}>{label}</h3>
      </div>
    </div>
  )

  // ── MENU ──────────────────────────────────────────────────────────
  if (step === 'menu') return (
    <Wrapper>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h3 style={{ fontSize:20, fontWeight:900, fontFamily:'var(--font-display)', color:'var(--text)' }}>🔒 Keamanan</h3>
          <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:4 }}>Kelola keamanan akunmu</p>
        </div>
        <button onClick={onClose} style={{ background:'var(--border-light)', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
      </div>
      {menuItems.map(item => (
        <button key={item.title}
          onClick={() => setStep(item.step)}
          style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:16, background:'var(--border-light)', border:'none', borderRadius:'var(--radius-sm)', marginBottom:10, cursor:'pointer', textAlign:'left' }}>
          <span style={{ fontSize:24, width:36, textAlign:'center', flexShrink:0 }}>{item.emoji}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:15, color:'var(--text)', fontFamily:'var(--font-body)', display:'flex', alignItems:'center', gap:6 }}>
              {item.title}
              {item.badge && <span style={{ background:'#10B981', color:'white', fontSize:10, borderRadius:10, padding:'1px 7px', fontWeight:700 }}>{item.badge}</span>}
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{item.desc}</div>
          </div>
          <span style={{ color:'var(--text-muted)', fontSize:18 }}>›</span>
        </button>
      ))}
    </Wrapper>
  )

  // ── UBAH PASSWORD ─────────────────────────────────────────────────
  if (step === 'ubahPassword') return (
    <Wrapper>
      <StepUbahPassword setStep={setStep} toast={toast} user={user}/>
    </Wrapper>
  )

  // ── 2FA ───────────────────────────────────────────────────────────
  if (step === 'twoFA') return (
    <Wrapper>
      <Step2FA setStep={setStep} toast={toast} user={user}/>
    </Wrapper>
  )

  // ── PERANGKAT AKTIF ───────────────────────────────────────────────
  if (step === 'perangkat') return (
    <Wrapper>
      <StepPerangkat setStep={setStep} toast={toast}/>
    </Wrapper>
  )

  return null
}

// ══════════════════════════════════════════════════════════════════
//  STEP: UBAH PASSWORD
// ══════════════════════════════════════════════════════════════════
function StepUbahPassword({ setStep, toast }) {
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confPass, setConfPass] = useState('')
  const [shows, setShows] = useState([false, false, false])
  const [loading, setLoading] = useState(false)

  const toggle = (i) => setShows(s => s.map((v, j) => j === i ? !v : v))

  const strength = newPass.length === 0 ? 0 : newPass.length < 6 ? 1 : newPass.length < 10 ? 2 : 3
  const strengthLabel = ['', 'Lemah', 'Sedang', 'Kuat']
  const strengthColor = ['', '#EF4444', '#F59E0B', '#10B981']

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!oldPass)          { toast('Masukkan password lama', 'error'); return }
    if (newPass.length < 6){ toast('Password baru minimal 6 karakter', 'error'); return }
    if (newPass !== confPass){ toast('Konfirmasi password tidak sama', 'error'); return }
    setLoading(true)
    try {
      await authApi.updateProfile({ password: oldPass, newPassword: newPass })
      toast('Password berhasil diubah! 🔒', 'success')
      setStep('menu')
    } catch (err) {
      toast(err.message || 'Gagal mengubah password', 'error')
    } finally { setLoading(false) }
  }

  const fields = [
    { label:'Password Lama', val:oldPass, set:setOldPass, i:0 },
    { label:'Password Baru', val:newPass, set:setNewPass, i:1 },
    { label:'Konfirmasi Password Baru', val:confPass, set:setConfPass, i:2 },
  ]

  return (
    <>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={() => setStep('menu')} style={{ background:'var(--border-light)', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
        <h3 style={{ fontSize:18, fontWeight:900, fontFamily:'var(--font-display)', color:'var(--text)' }}>🔑 Ubah Password</h3>
      </div>
      <form onSubmit={handleSubmit}>
        {fields.map(f => (
          <div key={f.label} className="input-group">
            <label className="input-label">{f.label}</label>
            <div style={{ position:'relative' }}>
              <input className="input-field" type={shows[f.i] ? 'text' : 'password'} placeholder="••••••••" value={f.val} onChange={e => f.set(e.target.value)} style={{ paddingRight:48 }}/>
              <button type="button" onClick={() => toggle(f.i)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', fontSize:16, cursor:'pointer' }}>
                {shows[f.i] ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        ))}
        {newPass && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:6 }}>Kekuatan password:</div>
            <div style={{ height:6, borderRadius:3, background:'var(--border)', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:3, background:strengthColor[strength], width:`${[0,33,66,100][strength]}%`, transition:'all 0.3s' }}/>
            </div>
            <div style={{ fontSize:11, marginTop:4, color:strengthColor[strength] }}>{strengthLabel[strength]} ({newPass.length} karakter)</div>
          </div>
        )}
        <button type="submit" className="btn btn-primary w-full" style={{ padding:16 }} disabled={loading}>
          {loading ? <span style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}><div className="spinner"/>Menyimpan...</span> : 'Simpan Password Baru 🔒'}
        </button>
      </form>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════
//  STEP: PERANGKAT AKTIF
// ══════════════════════════════════════════════════════════════════
function StepPerangkat({ setStep, toast }) {
  const [devices, setDevices] = useState(getDevices())

  const handleLogoutDevice = (id) => {
    const updated = devices.filter(d => d.id !== id)
    localStorage.setItem(LS_DEVICES, JSON.stringify(updated))
    setDevices(updated)
    toast('Sesi diakhiri', 'success')
  }

  const handleLogoutAll = () => {
    const updated = devices.filter(d => d.current)
    localStorage.setItem(LS_DEVICES, JSON.stringify(updated))
    setDevices(updated)
    toast('Semua sesi lain diakhiri', 'success')
  }

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'Baru saja'
    if (m < 60) return `${m} menit lalu`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} jam lalu`
    return `${Math.floor(h/24)} hari lalu`
  }

  const otherDevices = devices.filter(d => !d.current)

  return (
    <>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={() => setStep('menu')} style={{ background:'var(--border-light)', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
        <h3 style={{ fontSize:18, fontWeight:900, fontFamily:'var(--font-display)', color:'var(--text)' }}>📱 Perangkat Aktif</h3>
      </div>

      <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>
        {devices.length} perangkat terdaftar • {otherDevices.length} sesi lain aktif
      </p>

      {devices.map(d => (
        <div key={d.id} style={{ background: d.current ? '#F5F3FF' : 'var(--border-light)', border:`1px solid ${d.current ? '#DDD6FE' : 'var(--border-light)'}`, borderRadius:'var(--radius-sm)', padding:16, marginBottom:10, display:'flex', gap:14, alignItems:'center' }}>
          <div style={{ fontSize:32, flexShrink:0 }}>{d.isMobile ? '📱' : '💻'}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:14, color:'var(--text)', display:'flex', alignItems:'center', gap:6 }}>
              {d.browser} · {d.os}
              {d.current && <span style={{ background:'var(--primary)', color:'white', fontSize:10, borderRadius:10, padding:'1px 7px', fontWeight:700 }}>Ini</span>}
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{d.location} • {timeAgo(d.lastActive)}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>IP: {d.ip}</div>
          </div>
          {!d.current && (
            <button onClick={() => handleLogoutDevice(d.id)} style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'6px 12px', color:'var(--danger)', fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0 }}>
              Keluarkan
            </button>
          )}
        </div>
      ))}

      {otherDevices.length > 0 && (
        <button className="btn btn-danger w-full" style={{ padding:14, marginTop:8 }} onClick={handleLogoutAll}>
          🚪 Akhiri Semua Sesi Lain
        </button>
      )}
      {devices.length === 0 && (
        <div className="empty-state"><div className="emoji">📱</div><p>Belum ada perangkat terdaftar</p></div>
      )}
    </>
  )
}

// ══════════════════════════════════════════════════════════════════
//  STEP: VERIFIKASI 2 LANGKAH (2FA)
// ══════════════════════════════════════════════════════════════════
function Step2FA({ setStep, toast, user }) {
  const isEnabled = localStorage.getItem(LS_2FA) === 'true'
  const [phase, setPhase]         = useState('info')
  const [otp, setOtp]             = useState(['','','','','',''])
  const [loading, setLoading]     = useState(false)
  const [countdown, setCountdown] = useState(0)
  const inputRefs = Array.from({ length: 6 }, () => React.useRef(null))

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleSendOtp = async () => {
    setLoading(true)
    try {
      await authApi.send2faOtp()
      setPhase('verify')
      setCountdown(60)
      toast(`📧 Kode OTP dikirim ke ${user?.email}`, 'success')
    } catch (err) {
      toast(err.message || 'Gagal mengirim OTP', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) inputRefs[i + 1].current?.focus()
    if (!val && i > 0) inputRefs[i - 1].current?.focus()
  }

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs[i - 1].current?.focus()
  }

  const handleVerify = async () => {
    const entered = otp.join('')
    if (entered.length < 6) { toast('Masukkan 6 digit kode OTP', 'error'); return }
    setLoading(true)
    try {
      await authApi.verify2faOtp(entered, !isEnabled)
      localStorage.setItem(LS_2FA, (!isEnabled).toString())
      setPhase('success')
    } catch (err) {
      toast(err.message || 'Kode OTP salah', 'error')
      setOtp(['','','','','',''])
      inputRefs[0].current?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setOtp(['','','','','',''])
    setCountdown(60)
    try {
      await authApi.send2faOtp()
      toast(`📧 Kode baru dikirim ke ${user?.email}`, 'success')
    } catch (err) {
      toast(err.message || 'Gagal mengirim ulang', 'error')
    }
  }

  const handleDisable = () => handleSendOtp()

  return (
    <>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={() => setStep('menu')} style={{ background:'var(--border-light)', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
        <h3 style={{ fontSize:18, fontWeight:900, fontFamily:'var(--font-display)', color:'var(--text)' }}>🛡️ Verifikasi 2 Langkah</h3>
      </div>

      {/* STATUS BADGE */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background: isEnabled ? '#F0FDF4' : '#FFF7ED', border:`1px solid ${isEnabled ? '#86EFAC' : '#FED7AA'}`, borderRadius:'var(--radius-sm)', padding:'12px 16px', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22 }}>{isEnabled ? '✅' : '🔓'}</span>
          <div>
            <div style={{ fontWeight:800, fontSize:14, color: isEnabled ? '#166534' : '#92400E' }}>
              {isEnabled ? 'Aktif' : 'Tidak Aktif'}
            </div>
            <div style={{ fontSize:12, color: isEnabled ? '#4ADE80' : '#F59E0B', marginTop:2 }}>
              {isEnabled ? 'Akun kamu lebih aman' : 'Aktifkan untuk keamanan ekstra'}
            </div>
          </div>
        </div>
        <div style={{ width:44, height:26, borderRadius:13, background: isEnabled ? 'var(--primary)' : '#D1D5DB', display:'flex', alignItems:'center', padding:'0 3px', cursor:'pointer', transition:'background 0.2s' }}
          onClick={isEnabled ? handleDisable : handleSendOtp}>
          <div style={{ width:20, height:20, borderRadius:'50%', background:'white', boxShadow:'0 1px 4px rgba(0,0,0,0.2)', transition:'transform 0.2s', transform: isEnabled ? 'translateX(18px)' : 'translateX(0)' }}/>
        </div>
      </div>

      {/* PHASE: INFO */}
      {phase === 'info' && !isEnabled && (
        <div>
          <div style={{ background:'#F8FAFC', borderRadius:'var(--radius-sm)', padding:16, marginBottom:20 }}>
            <div style={{ fontWeight:800, fontSize:14, marginBottom:10 }}>Bagaimana cara kerjanya?</div>
            {[
              { n:'1', text:'Saat login, kamu memasukkan email & password seperti biasa.' },
              { n:'2', text:'Kami mengirim kode 6 digit ke email kamu.' },
              { n:'3', text:'Masukkan kode tersebut untuk menyelesaikan login.' },
            ].map(s => (
              <div key={s.n} style={{ display:'flex', gap:12, marginBottom:10, alignItems:'flex-start' }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--primary)', color:'white', fontWeight:900, fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{s.n}</div>
                <p style={{ fontSize:13, color:'var(--text-muted)', margin:0, lineHeight:1.5 }}>{s.text}</p>
              </div>
            ))}
          </div>
          <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'var(--radius-sm)', padding:12, marginBottom:20, fontSize:12, color:'#92400E', display:'flex', gap:8 }}>
            <span>⚠️</span>
            <span>Pastikan kamu masih memiliki akses ke email <strong>{user?.email || 'kamu'}</strong> sebelum mengaktifkan fitur ini.</span>
          </div>
          <button className="btn btn-primary w-full" style={{ padding:16 }} onClick={handleSendOtp} disabled={loading}>
            {loading
              ? <span style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}><div className="spinner"/>Mengirim kode OTP...</span>
              : '📧 Kirim Kode Verifikasi'}
          </button>
        </div>
      )}

      {/* PHASE: VERIFY */}
      {phase === 'verify' && (
        <div>
          <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:6 }}>
            Kode OTP telah dikirim ke
          </p>
          <p style={{ fontSize:14, fontWeight:800, color:'var(--text)', marginBottom:20 }}>
            📧 {user?.email || 'email kamu'}
          </p>

          {/* OTP Boxes */}
          <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:20 }}>
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
                  width:44, height:52, textAlign:'center', fontSize:22, fontWeight:900,
                  border:`2px solid ${digit ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius:10, background: digit ? '#F5F3FF' : 'white',
                  color:'var(--text)', outline:'none', fontFamily:'var(--font-display)',
                  transition:'all 0.15s'
                }}
              />
            ))}
          </div>

          <button className="btn btn-primary w-full" style={{ padding:16, marginBottom:12 }} onClick={handleVerify}>
            ✅ Verifikasi & Aktifkan
          </button>

          <div style={{ textAlign:'center', fontSize:13, color:'var(--text-muted)' }}>
            {countdown > 0
              ? <span>Kirim ulang kode dalam <strong>{countdown}s</strong></span>
              : <button onClick={handleResend} style={{ background:'none', border:'none', color:'var(--primary)', fontWeight:700, cursor:'pointer', fontSize:13 }}>🔄 Kirim Ulang Kode</button>
            }
          </div>
        </div>
      )}

      {/* PHASE: SUCCESS */}
      {phase === 'success' && (
        <div style={{ textAlign:'center', padding:'20px 0' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
          <h4 style={{ fontSize:20, fontWeight:900, color:'var(--text)', marginBottom:8, fontFamily:'var(--font-display)' }}>
            {isEnabled ? 'Berhasil Dinonaktifkan' : 'Berhasil Diaktifkan!'}
          </h4>
          <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:24, lineHeight:1.6 }}>
            Verifikasi 2 langkah kini <strong>{localStorage.getItem(LS_2FA) === 'true' ? 'aktif' : 'nonaktif'}</strong>.<br/>
            {localStorage.getItem(LS_2FA) === 'true' ? 'Akunmu sekarang lebih aman 🔒' : 'Kamu bisa mengaktifkannya kembali kapan saja.'}
          </p>
          <button className="btn btn-primary w-full" style={{ padding:16 }} onClick={() => setStep('menu')}>
            Kembali ke Menu Keamanan
          </button>
        </div>
      )}
    </>
  )
}