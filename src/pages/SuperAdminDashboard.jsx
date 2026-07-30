import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { logoBase64 } from '../assets/logo'
import { adminAuthApi, superAdminApi, adminArticlesApi, adminRatingsApi, removeAdminToken } from '../api'

function fmtDate(s) { return s ? new Date(s).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) : '-' }
function timeAgo(iso) {
  const diff = Date.now()-new Date(iso).getTime(), m=Math.floor(diff/60000)
  if (m<1) return 'Baru saja'; if (m<60) return `${m} menit lalu`
  const h=Math.floor(m/60); if (h<24) return `${h} jam lalu`
  return `${Math.floor(h/24)} hari lalu`
}
function initials(n='') { return n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase() }
const AV = ['#7C3AED','#06B6D4','#10B981','#F59E0B','#EF4444','#EC4899','#8B5CF6']

const ARTICLE_CATEGORIES = ['INVESTASI','BUDGETING','TABUNGAN','PAY LATER','LAINNYA']
const ARTICLE_ICONS = ['📈','💡','🏦','📊','⚠️','🛒','📄','💰','🎯','🔑']
const ARTICLE_COLORS = ['#EDE9FE','#D1FAE5','#FEF3C7','#ECFEFF','#FEE2E2','#EFF6FF']
const EMPTY_FORM = { title:'', content:'', category:'INVESTASI', read_time:5, image:'📈', bg_color:'#EDE9FE' }

function useBreakpoint() {
  const [bp, setBp] = useState(()=>{ const w=window.innerWidth; return w>=1024?'desktop':w>=640?'tablet':'mobile' })
  useEffect(() => {
    const fn = ()=>{ const w=window.innerWidth; setBp(w>=1024?'desktop':w>=640?'tablet':'mobile') }
    window.addEventListener('resize',fn); return ()=>window.removeEventListener('resize',fn)
  }, [])
  return bp
}

export default function SuperAdminDashboard() {
  const navigate  = useNavigate()
  const bp        = useBreakpoint()
  const isDesktop = bp === 'desktop'

  const [admin,        setAdmin]        = useState(null)
  const [requests,     setRequests]     = useState([])
  const [admins,       setAdmins]       = useState([])
  const [users,        setUsers]        = useState([])
  const [articles,     setArticles]     = useState([])
  const [ratings,      setRatings]      = useState([])
  const [ratingAvg,    setRatingAvg]    = useState(0)
  const [ratingAspect, setRatingAspect] = useState({})
  const [activeTab,    setActiveTab]    = useState('requests')
  const [showLogout,   setShowLogout]   = useState(false)
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [toast,        setToast]        = useState(null)
  const [loading,      setLoading]      = useState({})
  const [confirmModal, setConfirmModal] = useState(null)
  const [filterStatus, setFilterStatus] = useState('pending')

  // Artikel form
  const [showArticleForm, setShowArticleForm] = useState(false)
  const [editingArticle,  setEditingArticle]  = useState(null)
  const [articleForm,     setArticleForm]     = useState(EMPTY_FORM)
  const [artLoading,      setArtLoading]      = useState(false)

  const showToast = useCallback((msg, type='success') => {
    setToast({msg,type}); setTimeout(()=>setToast(null),3500)
  }, [])

  const fetchAll = useCallback(async () => {
    try {
      const [reqData,admData,usrData,artData,ratData] = await Promise.all([
        superAdminApi.getRequests(),
        superAdminApi.getAdmins(),
        adminAuthApi.getUsers(),
        adminArticlesApi.getAll(),
        adminRatingsApi.getAll(),
      ])
      setRequests(reqData.requests||[])
      setAdmins(admData.admins||[])
      setUsers((usrData.users||[]).map(u=>({ ...u, joinDate:u.created_at?.split('T')[0]||'-', transactions:Number(u.transactions)||0 })))
      setArticles(artData.articles||[])
      setRatings(ratData.ratings||[])
      setRatingAvg(ratData.average||0)
      setRatingAspect(ratData.aspect_averages||{})
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    adminAuthApi.getProfile()
      .then(data => {
        if (data.user?.role !== 'superadmin') { removeAdminToken(); navigate('/admin-login'); return }
        setAdmin(data.user); fetchAll()
      })
      .catch(() => { removeAdminToken(); navigate('/admin-login') })
  }, [navigate, fetchAll])

  // ── Approve / Reject / Delete admin ──
  const handleApprove = async (id) => {
    setLoading(l=>({...l,[id]:'approve'}))
    try { const res = await superAdminApi.approveRequest(id); showToast(res.message||'Request disetujui!'); fetchAll() }
    catch(e) { showToast(e.message,'error') }
    setLoading(l=>({...l,[id]:null})); setConfirmModal(null)
  }
  const handleReject = async (id) => {
    setLoading(l=>({...l,[id]:'reject'}))
    try { const res = await superAdminApi.rejectRequest(id); showToast(res.message||'Request ditolak.','info'); fetchAll() }
    catch(e) { showToast(e.message,'error') }
    setLoading(l=>({...l,[id]:null})); setConfirmModal(null)
  }
  const handleDeleteAdmin = async (id) => {
    setLoading(l=>({...l,['del_'+id]:true}))
    try { const res = await superAdminApi.deleteAdmin(id); showToast(res.message||'Admin dihapus.'); fetchAll() }
    catch(e) { showToast(e.message,'error') }
    setLoading(l=>({...l,['del_'+id]:false})); setConfirmModal(null)
  }

  // ── Artikel handlers ──
  const openAddArticle  = () => { setEditingArticle(null); setArticleForm(EMPTY_FORM); setShowArticleForm(true) }
  const openEditArticle = (a) => { setEditingArticle(a); setArticleForm({ title:a.title,content:a.content,category:a.category,read_time:a.read_time,image:a.image,bg_color:a.bg_color }); setShowArticleForm(true) }
  const handleSaveArticle = async () => {
    if (!articleForm.title.trim()) return showToast('Judul artikel wajib diisi.','error')
    setArtLoading(true)
    try {
      if (editingArticle) { await adminArticlesApi.update(editingArticle.id,articleForm); showToast('Artikel berhasil diperbarui!') }
      else { await adminArticlesApi.create(articleForm); showToast('Artikel berhasil ditambahkan!') }
      setShowArticleForm(false); fetchAll()
    } catch(e) { showToast(e.message,'error') }
    setArtLoading(false)
  }
  const handleDeleteArticle = async (id) => {
    setLoading(l=>({...l,['art_'+id]:true}))
    try { await adminArticlesApi.delete(id); showToast('Artikel berhasil dihapus.'); fetchAll(); setConfirmModal(null) }
    catch(e) { showToast(e.message,'error') }
    setLoading(l=>({...l,['art_'+id]:false}))
  }

  const pendingCount = requests.filter(r=>r.status==='pending').length
  const filteredReqs = requests.filter(r=>filterStatus==='all'||r.status===filterStatus)
  const totalTx = users.reduce((s,u)=>s+u.transactions,0)

  if (!admin) return null

  const NAV = [
    { key:'requests',  icon:'📋', label:'Request Admin', badge:pendingCount },
    { key:'admins',    icon:'🛡️', label:'Kelola Admin' },
    { key:'users',     icon:'👥', label:'Pengguna' },
    { key:'articles',  icon:'📰', label:'Artikel' },
    { key:'ratings',   icon:'⭐', label:'Rating' },
    { key:'stats',     icon:'📊', label:'Statistik' },
  ]

  /* ── Sidebar ── */
  const Sidebar = () => (
    <>
      {!isDesktop && drawerOpen && <div onClick={()=>setDrawerOpen(false)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:49 }}/>}
      <aside style={{ position:'fixed',top:0,left:0,bottom:0,width:250,background:'linear-gradient(160deg,#0F0A2E 0%,#1E1B4B 60%,#312E81 100%)',color:'white',display:'flex',flexDirection:'column',zIndex:50,transform:isDesktop?'none':drawerOpen?'translateX(0)':'translateX(-100%)',transition:'transform 0.28s cubic-bezier(.4,0,.2,1)',boxShadow:'4px 0 24px rgba(0,0,0,0.25)' }}>
        <div style={{ padding:'22px 20px 16px',display:'flex',alignItems:'center',gap:10,borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <img src={logoBase64} alt="FinSmart" style={{ width:36,height:36,borderRadius:10,objectFit:'cover' }}/>
          <div>
            <div style={{ fontWeight:900,fontSize:15 }}>FinSmart</div>
            <div style={{ fontSize:10,fontWeight:700,letterSpacing:1,background:'linear-gradient(90deg,#F59E0B,#FBBF24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>⭐ SUPER ADMIN</div>
          </div>
        </div>
        <div style={{ padding:'14px 16px',display:'flex',alignItems:'center',gap:10,borderBottom:'1px solid rgba(255,255,255,0.08)',margin:'0 8px 8px' }}>
          <div style={{ width:36,height:36,borderRadius:10,flexShrink:0,background:'linear-gradient(135deg,#F59E0B,#FBBF24)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:13,color:'#1E1B4B' }}>{initials(admin.name)}</div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:800,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{admin.name}</div>
            <div style={{ fontSize:10,opacity:0.6,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{admin.email}</div>
          </div>
        </div>
        <nav style={{ flex:1,padding:'8px 10px',display:'flex',flexDirection:'column',gap:3,overflowY:'auto' }}>
          {NAV.map(n=>(
            <button key={n.key} onClick={()=>{ setActiveTab(n.key); setDrawerOpen(false) }}
              style={{ width:'100%',background:activeTab===n.key?'rgba(255,255,255,0.12)':'transparent',border:activeTab===n.key?'1px solid rgba(255,255,255,0.15)':'1px solid transparent',borderRadius:12,padding:'11px 14px',display:'flex',alignItems:'center',gap:10,cursor:'pointer',color:'white',textAlign:'left',transition:'all 0.15s' }}
              onMouseEnter={e=>{ if(activeTab!==n.key) e.currentTarget.style.background='rgba(255,255,255,0.07)' }}
              onMouseLeave={e=>{ if(activeTab!==n.key) e.currentTarget.style.background='transparent' }}>
              <span style={{ fontSize:17,width:22,textAlign:'center' }}>{n.icon}</span>
              <span style={{ fontWeight:700,fontSize:13,flex:1 }}>{n.label}</span>
              {n.badge>0 && <span style={{ background:'#EF4444',color:'white',borderRadius:20,fontSize:10,fontWeight:800,padding:'2px 7px' }}>{n.badge}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding:'10px 10px 20px' }}>
          <button onClick={()=>setShowLogout(true)} style={{ width:'100%',background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:12,padding:'11px 14px',display:'flex',alignItems:'center',gap:10,cursor:'pointer',color:'#FCA5A5',fontSize:13,fontWeight:700 }}>
            <span>🚪</span> Keluar
          </button>
        </div>
      </aside>
    </>
  )

  const MobileTopBar = () => (
    <header style={{ position:'sticky',top:0,zIndex:40,background:'white',borderBottom:'1px solid #E5E7EB',padding:'12px 16px',display:'flex',alignItems:'center',gap:10,boxShadow:'0 1px 8px rgba(0,0,0,0.06)' }}>
      <button onClick={()=>setDrawerOpen(true)} style={{ background:'#EDE9FE',border:'none',borderRadius:10,width:36,height:36,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center' }}>☰</button>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:900,fontSize:15 }}>⭐ Super Admin</div>
        <div style={{ fontSize:11,color:'#6B7280' }}>FinSmart Panel</div>
      </div>
      {pendingCount>0 && <div style={{ background:'#EF4444',color:'white',borderRadius:20,fontSize:11,fontWeight:800,padding:'4px 10px' }}>{pendingCount} pending</div>}
    </header>
  )

  /* ── Requests Tab ── */
  const RequestsTab = () => {
    const sc = { pending:{label:'Menunggu',color:'#F59E0B',bg:'#FEF3C7',icon:'⏳'}, approved:{label:'Disetujui',color:'#10B981',bg:'#D1FAE5',icon:'✅'}, rejected:{label:'Ditolak',color:'#EF4444',bg:'#FEE2E2',icon:'❌'} }
    return (
      <>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10 }}>
          <div>
            <h2 style={{ fontWeight:900,fontSize:20,color:'#111827',margin:0 }}>📋 Request Pendaftaran Admin</h2>
            <p style={{ color:'#6B7280',fontSize:13,margin:'4px 0 0' }}>{pendingCount} permintaan menunggu persetujuan</p>
          </div>
          <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
            {['all','pending','approved','rejected'].map(s=>(
              <button key={s} onClick={()=>setFilterStatus(s)}
                style={{ padding:'6px 14px',borderRadius:20,border:'none',fontSize:12,fontWeight:700,cursor:'pointer',background:filterStatus===s?'#1E1B4B':'#F3F4F6',color:filterStatus===s?'white':'#6B7280',transition:'all 0.15s' }}>
                {s==='all'?'Semua':sc[s].icon+' '+sc[s].label}
                {s==='pending'&&pendingCount>0&&<span style={{ marginLeft:5,background:'#EF4444',color:'white',borderRadius:10,padding:'1px 6px',fontSize:10 }}>{pendingCount}</span>}
              </button>
            ))}
          </div>
        </div>
        {filteredReqs.length===0 && (
          <div style={{ textAlign:'center',padding:'60px 20px',background:'white',borderRadius:18,boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:48,marginBottom:10 }}>📭</div>
            <div style={{ fontWeight:700,fontSize:15 }}>Tidak ada request</div>
            <div style={{ fontSize:13,color:'#6B7280',marginTop:4 }}>Belum ada permintaan pendaftaran admin</div>
          </div>
        )}
        <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
          {filteredReqs.map((r,i) => {
            const s=sc[r.status], isLd=loading[r.id]
            return (
              <div key={r.id} style={{ background:'white',borderRadius:18,padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:r.status==='pending'?'2px solid #FEF3C7':'1px solid #E5E7EB',animation:`rowIn 0.25s ease ${i*0.04}s both` }}>
                <div style={{ display:'flex',alignItems:'flex-start',gap:14,flexWrap:'wrap' }}>
                  <div style={{ width:46,height:46,borderRadius:14,flexShrink:0,background:`linear-gradient(135deg,${AV[i%AV.length]},${AV[(i+2)%AV.length]})`,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:900,fontSize:16 }}>{initials(r.name)}</div>
                  <div style={{ flex:1,minWidth:180 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:3 }}>
                      <span style={{ fontWeight:800,fontSize:15 }}>{r.name}</span>
                      <span style={{ background:s.bg,color:s.color,borderRadius:20,padding:'2px 10px',fontSize:11,fontWeight:800 }}>{s.icon} {s.label}</span>
                    </div>
                    <div style={{ fontSize:13,color:'#6B7280',marginBottom:2 }}>📧 {r.email}</div>
                    <div style={{ fontSize:12,color:'#6B7280' }}>🕐 {timeAgo(r.created_at)} · {fmtDate(r.created_at)}</div>
                    {r.reason && <div style={{ marginTop:10,background:'#F9FAFB',borderRadius:10,padding:'8px 12px',fontSize:13,borderLeft:'3px solid #7C3AED' }}><span style={{ fontWeight:700,color:'#7C3AED',marginRight:6 }}>Alasan:</span>{r.reason}</div>}
                    {r.status!=='pending'&&r.reviewed_by_name&&<div style={{ fontSize:12,color:'#6B7280',marginTop:8 }}>Diproses oleh: <strong>{r.reviewed_by_name}</strong> · {fmtDate(r.reviewed_at)}</div>}
                  </div>
                  {r.status==='pending' && (
                    <div style={{ display:'flex',gap:8,flexShrink:0,flexWrap:'wrap' }}>
                      <button onClick={()=>setConfirmModal({type:'approve',id:r.id,name:r.name})} disabled={!!isLd}
                        style={{ background:isLd==='approve'?'#D1FAE5':'linear-gradient(135deg,#10B981,#059669)',color:isLd==='approve'?'#065F46':'white',border:'none',borderRadius:12,padding:'10px 18px',fontSize:13,fontWeight:800,cursor:isLd?'not-allowed':'pointer',opacity:isLd?0.7:1 }}>
                        {isLd==='approve'?'⏳ Proses...':'✅ Setujui'}
                      </button>
                      <button onClick={()=>setConfirmModal({type:'reject',id:r.id,name:r.name})} disabled={!!isLd}
                        style={{ background:'#FFF1F1',color:'#EF4444',border:'1.5px solid #FCA5A5',borderRadius:12,padding:'10px 18px',fontSize:13,fontWeight:800,cursor:isLd?'not-allowed':'pointer',opacity:isLd?0.7:1 }}>
                        {isLd==='reject'?'⏳ Proses...':'❌ Tolak'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </>
    )
  }

  /* ── Admins Tab ── */
  const AdminsTab = () => (
    <>
      <div style={{ marginBottom:16 }}>
        <h2 style={{ fontWeight:900,fontSize:20,color:'#111827',margin:0 }}>🛡️ Kelola Administrator</h2>
        <p style={{ color:'#6B7280',fontSize:13,margin:'4px 0 0' }}>{admins.filter(a=>a.role==='admin').length} admin · {admins.filter(a=>a.role==='superadmin').length} super admin</p>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:isDesktop?'repeat(3,1fr)':bp==='tablet'?'1fr 1fr':'1fr',gap:14 }}>
        {admins.map((a,i) => {
          const isSelf=a.id===admin.id, isSuperA=a.role==='superadmin', isDelLd=loading['del_'+a.id]
          return (
            <div key={a.id} style={{ background:'white',borderRadius:18,padding:18,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:isSelf?'2px solid #7C3AED':isSuperA?'2px solid #F59E0B':'1px solid #E5E7EB',position:'relative',animation:`rowIn 0.25s ease ${i*0.05}s both`,transition:'transform 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e=>e.currentTarget.style.transform=''}>
              {isSelf && <div style={{ position:'absolute',top:-1,right:14,background:'#7C3AED',color:'white',fontSize:9,fontWeight:800,padding:'3px 8px',borderRadius:'0 0 8px 8px' }}>KAMU</div>}
              {isSuperA&&!isSelf && <div style={{ position:'absolute',top:-1,right:14,background:'#F59E0B',color:'white',fontSize:9,fontWeight:800,padding:'3px 8px',borderRadius:'0 0 8px 8px' }}>SUPER ADMIN</div>}
              {!isSelf&&!isSuperA && (
                <button onClick={()=>setConfirmModal({type:'deleteAdmin',id:a.id,name:a.name})} disabled={isDelLd}
                  style={{ position:'absolute',top:12,right:12,background:'#FEE2E2',border:'none',borderRadius:8,width:30,height:30,cursor:isDelLd?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#DC2626' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#EF4444';e.currentTarget.style.color='white'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#FEE2E2';e.currentTarget.style.color='#DC2626'}}>
                  {isDelLd?'⏳':'🗑'}
                </button>
              )}
              <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:12,paddingRight:!isSelf&&!isSuperA?36:0 }}>
                <div style={{ width:46,height:46,borderRadius:14,flexShrink:0,background:isSuperA?'linear-gradient(135deg,#F59E0B,#FBBF24)':'linear-gradient(135deg,#7C3AED,#9333EA)',display:'flex',alignItems:'center',justifyContent:'center',color:isSuperA?'#1E1B4B':'white',fontWeight:900,fontSize:16 }}>{initials(a.name)}</div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:800,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{a.name}</div>
                  <div style={{ fontSize:12,color:'#6B7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{a.email}</div>
                </div>
              </div>
              <div style={{ background:isSuperA?'#FEF3C7':'#EDE9FE',borderRadius:8,padding:'6px 10px',display:'flex',alignItems:'center',gap:6 }}>
                <span style={{ fontSize:12 }}>{isSuperA?'⭐':'🛡️'}</span>
                <span style={{ fontSize:11,color:isSuperA?'#92400E':'#5B21B6',fontWeight:700 }}>{isSuperA?'Super Admin':'Administrator'} · {fmtDate(a.created_at)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )

  /* ── Users Tab ── */
  const UsersTab = () => (
    <>
      <div style={{ marginBottom:16 }}>
        <h2 style={{ fontWeight:900,fontSize:20,color:'#111827',margin:0 }}>👥 Daftar Pengguna</h2>
        <p style={{ color:'#6B7280',fontSize:13,margin:'4px 0 0' }}>{users.length} pengguna terdaftar · {totalTx.toLocaleString('id-ID')} total transaksi</p>
      </div>
      <div style={{ background:'white',borderRadius:18,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:'1px solid #E5E7EB' }}>
        {users.length===0 && <div style={{ textAlign:'center',padding:40,color:'#6B7280' }}><div style={{ fontSize:40,marginBottom:8 }}>👥</div><p>Belum ada pengguna</p></div>}
        {users.map((u,i)=>(
          <div key={u.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'14px 18px',borderBottom:i<users.length-1?'1px solid #F3F4F6':'none',animation:`rowIn 0.2s ease ${i*0.03}s both` }}>
            <div style={{ width:40,height:40,borderRadius:12,flexShrink:0,background:AV[i%AV.length],display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:900,fontSize:14 }}>{initials(u.name)}</div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontWeight:700,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{u.name}</div>
              <div style={{ fontSize:12,color:'#6B7280' }}>{u.email}</div>
            </div>
            <div style={{ textAlign:'right',flexShrink:0 }}>
              <div style={{ fontSize:13,fontWeight:700,color:'#7C3AED' }}>{u.transactions} tx</div>
              <div style={{ fontSize:11,color:'#6B7280' }}>{fmtDate(u.joinDate)}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  )

  /* ── Articles Tab ── */
  const ArticlesTab = () => (
    <>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10 }}>
        <div>
          <h2 style={{ fontWeight:900,fontSize:20,color:'#111827',margin:0 }}>📰 Kelola Artikel Edukasi</h2>
          <p style={{ color:'#6B7280',fontSize:13,margin:'4px 0 0' }}>{articles.length} artikel tersedia untuk pengguna</p>
        </div>
        <button onClick={openAddArticle} style={{ background:'linear-gradient(135deg,#F59E0B,#FBBF24)',color:'#1E1B4B',border:'none',borderRadius:12,padding:'10px 18px',fontSize:13,fontWeight:800,cursor:'pointer',display:'flex',alignItems:'center',gap:6,boxShadow:'0 4px 14px rgba(245,158,11,0.4)' }}>
          ➕ Tambah Artikel
        </button>
      </div>
      {articles.length===0 && (
        <div style={{ textAlign:'center',padding:60,background:'white',borderRadius:18,boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:48,marginBottom:10 }}>📰</div>
          <div style={{ fontWeight:700 }}>Belum ada artikel</div>
        </div>
      )}
      <div style={{ display:'grid',gridTemplateColumns:isDesktop?'repeat(3,1fr)':bp==='tablet'?'1fr 1fr':'1fr',gap:14 }}>
        {articles.map((a,i)=>(
          <div key={a.id} style={{ background:'white',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:'1px solid #E5E7EB',transition:'transform 0.15s,box-shadow 0.15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)' }}
            onMouseLeave={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ background:a.bg_color||'#EDE9FE',padding:'20px',textAlign:'center' }}>
              <span style={{ fontSize:36 }}>{a.image||'📄'}</span>
            </div>
            <div style={{ padding:'14px 16px' }}>
              <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:6 }}>
                <span style={{ background:'#FEF3C7',color:'#92400E',borderRadius:6,padding:'3px 8px',fontSize:10,fontWeight:800 }}>{a.category}</span>
                <span style={{ fontSize:11,color:'#9CA3AF' }}>⏱ {a.read_time} mnt</span>
              </div>
              <div style={{ fontWeight:800,fontSize:14,color:'#111827',marginBottom:6,lineHeight:1.4 }}>{a.title}</div>
              <div style={{ fontSize:12,color:'#6B7280',marginBottom:12,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' }}>{a.content||'Tidak ada konten'}</div>
              <div style={{ fontSize:11,color:'#9CA3AF',marginBottom:12 }}>📅 {fmtDate(a.created_at)}</div>
              <div style={{ display:'flex',gap:8 }}>
                <button onClick={()=>openEditArticle(a)} style={{ flex:1,background:'#EDE9FE',color:'#7C3AED',border:'none',borderRadius:10,padding:'8px',fontSize:12,fontWeight:700,cursor:'pointer' }}>✏️ Edit</button>
                <button onClick={()=>setConfirmModal({type:'deleteArticle',id:a.id,name:a.title})} style={{ flex:1,background:'#FEE2E2',color:'#DC2626',border:'none',borderRadius:10,padding:'8px',fontSize:12,fontWeight:700,cursor:'pointer' }}>🗑 Hapus</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )

  /* ── Ratings Tab ── */
  const RatingsTab = () => (
    <>
      <div style={{ marginBottom:16 }}>
        <h2 style={{ fontWeight:900,fontSize:20,color:'#111827',margin:0 }}>⭐ Rating & Feedback Pengguna</h2>
        <p style={{ color:'#6B7280',fontSize:13,margin:'4px 0 0' }}>{ratings.length} ulasan · rata-rata {ratingAvg} dari 5.0</p>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:isDesktop?'repeat(3,1fr)':'1fr 1fr',gap:12,marginBottom:18 }}>
        <div style={{ background:'linear-gradient(135deg,#F59E0B,#FBBF24)',borderRadius:16,padding:'20px',color:'#1E1B4B',gridColumn:isDesktop?'auto':'1/-1' }}>
          <div style={{ fontSize:36,fontWeight:900,marginBottom:4 }}>{ratingAvg}</div>
          <div style={{ fontSize:13,fontWeight:700,opacity:0.8 }}>Rata-rata Rating</div>
          <div style={{ fontSize:22,marginTop:4 }}>{'⭐'.repeat(Math.round(ratingAvg))}</div>
        </div>
        <div style={{ background:'white',borderRadius:16,padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:32,fontWeight:900,color:'#7C3AED',marginBottom:4 }}>{ratings.length}</div>
          <div style={{ fontSize:13,color:'#9CA3AF',fontWeight:700 }}>Total Ulasan</div>
        </div>
        <div style={{ background:'white',borderRadius:16,padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:32,fontWeight:900,color:'#10B981',marginBottom:4 }}>{ratings.filter(r=>r.score>=4).length}</div>
          <div style={{ fontSize:13,color:'#9CA3AF',fontWeight:700 }}>Rating Positif (≥4⭐)</div>
        </div>
      </div>
      {/* Aspek averages */}
      {Object.keys(ratingAspect).length>0 && (
        <div style={{ background:'white',borderRadius:18,padding:'20px 22px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',marginBottom:18 }}>
          <div style={{ fontWeight:800,fontSize:15,color:'#111827',marginBottom:14 }}>📊 Rata-rata Per Aspek</div>
          <div style={{ display:'grid',gridTemplateColumns:isDesktop?'repeat(4,1fr)':'1fr 1fr',gap:12 }}>
            {[{key:'avg_design',label:'Desain',icon:'🎨'},{key:'avg_ease',label:'Kemudahan',icon:'✌️'},{key:'avg_feature',label:'Fitur',icon:'⚡'},{key:'avg_performance',label:'Performa',icon:'🚀'}].map(asp=>{
              const val=parseFloat(ratingAspect[asp.key]||0)
              return (
                <div key={asp.key} style={{ background:'#F9FAFB',borderRadius:12,padding:'14px',textAlign:'center' }}>
                  <div style={{ fontSize:24,marginBottom:4 }}>{asp.icon}</div>
                  <div style={{ fontSize:22,fontWeight:900,color:'#F59E0B' }}>{val||'-'}</div>
                  <div style={{ fontSize:12,color:'#9CA3AF',fontWeight:600,marginTop:2 }}>{asp.label}</div>
                  <div style={{ background:'#E5E7EB',borderRadius:6,height:6,marginTop:8,overflow:'hidden' }}>
                    <div style={{ height:'100%',borderRadius:6,background:'linear-gradient(90deg,#F59E0B,#FBBF24)',width:`${(val/5)*100}%` }}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {ratings.length===0 && (
        <div style={{ textAlign:'center',padding:60,background:'white',borderRadius:18,boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:48,marginBottom:10 }}>⭐</div>
          <div style={{ fontWeight:700 }}>Belum ada rating</div>
        </div>
      )}
      <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
        {ratings.map((r,i)=>(
          <div key={r.id} style={{ background:'white',borderRadius:16,padding:'16px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:'1px solid #E5E7EB' }}>
            <div style={{ display:'flex',alignItems:'flex-start',gap:12,flexWrap:'wrap' }}>
              <div style={{ width:42,height:42,borderRadius:12,flexShrink:0,background:AV[i%AV.length],display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:900,fontSize:15 }}>{initials(r.name||'U')}</div>
              <div style={{ flex:1,minWidth:180 }}>
                <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:4 }}>
                  <span style={{ fontWeight:800,fontSize:14 }}>{r.name||'Pengguna'}</span>
                  <span style={{ fontSize:13,color:'#6B7280' }}>{r.email}</span>
                </div>
                <div style={{ display:'flex',gap:2,marginBottom:6 }}>
                  {[1,2,3,4,5].map(s=><span key={s} style={{ fontSize:16 }}>{s<=r.score?'⭐':'☆'}</span>)}
                  <span style={{ marginLeft:6,fontSize:12,fontWeight:800,color:'#F59E0B' }}>{r.score}.0</span>
                </div>
                {r.comment && <div style={{ fontSize:13,color:'#374151',background:'#F9FAFB',borderRadius:10,padding:'8px 12px',borderLeft:'3px solid #F59E0B',marginBottom:8 }}>"{r.comment}"</div>}
                <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                  {r.aspect_design && <span style={{ fontSize:11,background:'#EDE9FE',color:'#7C3AED',borderRadius:6,padding:'2px 8px',fontWeight:700 }}>Desain: {r.aspect_design}</span>}
                  {r.aspect_ease && <span style={{ fontSize:11,background:'#D1FAE5',color:'#065F46',borderRadius:6,padding:'2px 8px',fontWeight:700 }}>Kemudahan: {r.aspect_ease}</span>}
                  {r.aspect_feature && <span style={{ fontSize:11,background:'#FEF3C7',color:'#92400E',borderRadius:6,padding:'2px 8px',fontWeight:700 }}>Fitur: {r.aspect_feature}</span>}
                  {r.aspect_performance && <span style={{ fontSize:11,background:'#ECFEFF',color:'#0E7490',borderRadius:6,padding:'2px 8px',fontWeight:700 }}>Performa: {r.aspect_performance}</span>}
                </div>
              </div>
              <div style={{ fontSize:12,color:'#9CA3AF',flexShrink:0 }}>{timeAgo(r.created_at)}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  )

  /* ── Stats Tab ── */
  const StatsTab = () => {
    const statItems = [
      { label:'Total Pengguna',   value:users.length,                       icon:'👥', color:'#7C3AED', bg:'#EDE9FE', sub:`${users.length} akun aktif` },
      { label:'Total Admin',      value:admins.filter(a=>a.role==='admin').length, icon:'🛡️', color:'#10B981', bg:'#D1FAE5', sub:`${admins.filter(a=>a.role==='superadmin').length} super admin` },
      { label:'Total Transaksi',  value:totalTx.toLocaleString('id-ID'),    icon:'💸', color:'#F59E0B', bg:'#FEF3C7', sub:'oleh semua pengguna' },
      { label:'Total Artikel',    value:articles.length,                    icon:'📰', color:'#06B6D4', bg:'#ECFEFF', sub:'artikel edukasi' },
      { label:'Total Ulasan',     value:ratings.length,                     icon:'⭐', color:'#F59E0B', bg:'#FEF3C7', sub:`rata-rata ${ratingAvg}⭐` },
      { label:'Request Pending',  value:pendingCount,                       icon:'📋', color:'#EF4444', bg:'#FEE2E2', sub:'menunggu persetujuan' },
    ]
    return (
      <>
        <div style={{ marginBottom:16 }}>
          <h2 style={{ fontWeight:900,fontSize:20,color:'#111827',margin:0 }}>📊 Statistik Platform</h2>
          <p style={{ color:'#6B7280',fontSize:13,margin:'4px 0 0' }}>Ringkasan keseluruhan platform FinSmart</p>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:isDesktop?'repeat(3,1fr)':bp==='tablet'?'1fr 1fr':'1fr 1fr',gap:14,marginBottom:20 }}>
          {statItems.map(s=>(
            <div key={s.label} style={{ background:'white',borderRadius:16,padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:`1.5px solid ${s.bg}`,transition:'transform 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'}
              onMouseLeave={e=>e.currentTarget.style.transform=''}>
              <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10 }}>
                <span style={{ fontSize:11,color:'#9CA3AF',fontWeight:700,textTransform:'uppercase',letterSpacing:0.5 }}>{s.label}</span>
                <span style={{ fontSize:22 }}>{s.icon}</span>
              </div>
              <div style={{ fontSize:30,fontWeight:900,color:s.color,lineHeight:1,marginBottom:4 }}>{s.value}</div>
              <div style={{ fontSize:12,color:'#9CA3AF',fontWeight:600 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Top users */}
        <div style={{ display:'grid',gridTemplateColumns:isDesktop?'1fr 1fr':'1fr',gap:16 }}>
          <div style={{ background:'white',borderRadius:18,padding:'20px 22px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight:800,fontSize:15,color:'#111827',marginBottom:16 }}>🏆 Top Pengguna (Transaksi)</div>
            {[...users].sort((a,b)=>b.transactions-a.transactions).slice(0,5).map((u,i)=>(
              <div key={u.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<4?'1px solid #F3F4F6':'none' }}>
                <span style={{ fontSize:14,width:24,textAlign:'center' }}>{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
                <div style={{ width:34,height:34,borderRadius:10,background:AV[i%AV.length],display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:900,fontSize:12,flexShrink:0 }}>{initials(u.name)}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{u.name}</div>
                  <div style={{ fontSize:11,color:'#9CA3AF' }}>{u.email}</div>
                </div>
                <span style={{ fontSize:13,fontWeight:800,color:'#7C3AED',flexShrink:0 }}>{u.transactions} tx</span>
              </div>
            ))}
          </div>

          {/* Request status summary */}
          <div style={{ background:'white',borderRadius:18,padding:'20px 22px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight:800,fontSize:15,color:'#111827',marginBottom:16 }}>📋 Status Request Admin</div>
            {[
              { label:'Menunggu',  val:requests.filter(r=>r.status==='pending').length,   color:'#F59E0B', bg:'#FEF3C7', icon:'⏳' },
              { label:'Disetujui', val:requests.filter(r=>r.status==='approved').length,  color:'#10B981', bg:'#D1FAE5', icon:'✅' },
              { label:'Ditolak',   val:requests.filter(r=>r.status==='rejected').length,  color:'#EF4444', bg:'#FEE2E2', icon:'❌' },
            ].map(item=>(
              <div key={item.label} style={{ display:'flex',alignItems:'center',gap:12,marginBottom:12 }}>
                <div style={{ width:40,height:40,borderRadius:12,background:item.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>{item.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:700,marginBottom:4 }}>
                    <span>{item.label}</span><span style={{ color:item.color }}>{item.val}</span>
                  </div>
                  <div style={{ background:'#F3F4F6',borderRadius:6,height:8,overflow:'hidden' }}>
                    <div style={{ height:'100%',borderRadius:6,background:item.color,width:requests.length?`${(item.val/requests.length)*100}%`:'0%',transition:'width 0.8s ease' }}/>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={()=>setActiveTab('requests')} style={{ width:'100%',marginTop:12,background:'linear-gradient(135deg,#1E1B4B,#312E81)',color:'white',border:'none',borderRadius:12,padding:'11px',fontSize:12,fontWeight:800,cursor:'pointer' }}>
              📋 Lihat Semua Request
            </button>
          </div>
        </div>
      </>
    )
  }

  /* ── Article Form Modal ── */
  const ArticleFormModal = () => !showArticleForm ? null : (
    <div onClick={e=>e.target===e.currentTarget&&setShowArticleForm(false)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:isDesktop?'center':'flex-end',justifyContent:'center',zIndex:600,padding:isDesktop?20:0 }}>
      <div style={{ background:'white',borderRadius:isDesktop?24:'24px 24px 0 0',padding:24,width:'100%',maxWidth:isDesktop?560:'100%',maxHeight:'90vh',overflowY:'auto',animation:isDesktop?'fadeIn 0.2s':'slideUp 0.3s' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
          <h3 style={{ fontWeight:900,fontSize:18,color:'#111827',margin:0 }}>{editingArticle?'✏️ Edit Artikel':'➕ Tambah Artikel Baru'}</h3>
          <button onClick={()=>setShowArticleForm(false)} style={{ background:'#F3F4F6',border:'none',borderRadius:'50%',width:34,height:34,cursor:'pointer',fontSize:14 }}>✕</button>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div>
            <label style={{ fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:5 }}>Judul Artikel *</label>
            <input value={articleForm.title} onChange={e=>setArticleForm(f=>({...f,title:e.target.value}))} placeholder="Masukkan judul artikel..."
              style={{ width:'100%',padding:'10px 14px',border:'1.5px solid #E5E7EB',borderRadius:12,fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'inherit' }}/>
          </div>
          <div>
            <label style={{ fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:5 }}>Konten / Isi Artikel</label>
            <textarea value={articleForm.content} onChange={e=>setArticleForm(f=>({...f,content:e.target.value}))} rows={4} placeholder="Tulis konten artikel..."
              style={{ width:'100%',padding:'10px 14px',border:'1.5px solid #E5E7EB',borderRadius:12,fontSize:14,outline:'none',resize:'vertical',boxSizing:'border-box',fontFamily:'inherit' }}/>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div>
              <label style={{ fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:5 }}>Kategori</label>
              <select value={articleForm.category} onChange={e=>setArticleForm(f=>({...f,category:e.target.value}))}
                style={{ width:'100%',padding:'10px 14px',border:'1.5px solid #E5E7EB',borderRadius:12,fontSize:14,outline:'none',cursor:'pointer',fontFamily:'inherit',background:'white' }}>
                {ARTICLE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:5 }}>Waktu Baca (menit)</label>
              <input type="number" min={1} max={60} value={articleForm.read_time} onChange={e=>setArticleForm(f=>({...f,read_time:Number(e.target.value)}))}
                style={{ width:'100%',padding:'10px 14px',border:'1.5px solid #E5E7EB',borderRadius:12,fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'inherit' }}/>
            </div>
          </div>
          <div>
            <label style={{ fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:8 }}>Icon</label>
            <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
              {ARTICLE_ICONS.map(ic=>(
                <button key={ic} onClick={()=>setArticleForm(f=>({...f,image:ic}))}
                  style={{ width:42,height:42,border:articleForm.image===ic?'2px solid #F59E0B':'2px solid #E5E7EB',borderRadius:10,background:articleForm.image===ic?'#FEF3C7':'white',fontSize:22,cursor:'pointer' }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:8 }}>Warna Background</label>
            <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
              {ARTICLE_COLORS.map(c=>(
                <button key={c} onClick={()=>setArticleForm(f=>({...f,bg_color:c}))}
                  style={{ width:36,height:36,borderRadius:9,background:c,border:articleForm.bg_color===c?'3px solid #F59E0B':'2px solid #E5E7EB',cursor:'pointer' }}/>
              ))}
            </div>
          </div>
          <div style={{ background:'#F9FAFB',borderRadius:14,padding:14,display:'flex',alignItems:'center',gap:14 }}>
            <div style={{ width:56,height:56,borderRadius:14,background:articleForm.bg_color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0 }}>{articleForm.image}</div>
            <div>
              <div style={{ fontSize:11,color:'#9CA3AF',fontWeight:700,textTransform:'uppercase',marginBottom:2 }}>{articleForm.category} · {articleForm.read_time} mnt</div>
              <div style={{ fontWeight:800,fontSize:14 }}>{articleForm.title||'Judul artikel...'}</div>
            </div>
          </div>
        </div>
        <div style={{ display:'flex',gap:10,marginTop:20 }}>
          <button onClick={()=>setShowArticleForm(false)} style={{ flex:1,background:'#F3F4F6',border:'none',borderRadius:14,padding:14,fontWeight:700,cursor:'pointer' }}>Batal</button>
          <button onClick={handleSaveArticle} disabled={artLoading} style={{ flex:2,background:'linear-gradient(135deg,#F59E0B,#FBBF24)',color:'#1E1B4B',border:'none',borderRadius:14,padding:14,fontWeight:800,cursor:artLoading?'not-allowed':'pointer',opacity:artLoading?0.7:1 }}>
            {artLoading?'⏳ Menyimpan...':(editingArticle?'💾 Simpan Perubahan':'➕ Tambah Artikel')}
          </button>
        </div>
      </div>
    </div>
  )

  /* ── Confirm Modal ── */
  const ConfirmModal = () => !confirmModal ? null : (
    <div onClick={e=>e.target===e.currentTarget&&setConfirmModal(null)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:700,padding:20 }}>
      <div style={{ background:'white',borderRadius:24,padding:28,width:'100%',maxWidth:360,textAlign:'center',animation:'fadeIn 0.2s' }}>
        {confirmModal.type==='approve' && <>
          <div style={{ fontSize:48,marginBottom:12 }}>✅</div>
          <h3 style={{ fontWeight:900,fontSize:17,marginBottom:8 }}>Setujui Request?</h3>
          <p style={{ color:'#6B7280',fontSize:13,marginBottom:22 }}>Akun admin untuk <strong>{confirmModal.name}</strong> akan dibuat.</p>
          <div style={{ display:'flex',gap:10 }}>
            <button onClick={()=>setConfirmModal(null)} style={{ flex:1,background:'#F3F4F6',border:'none',borderRadius:14,padding:13,fontWeight:700,cursor:'pointer' }}>Batal</button>
            <button onClick={()=>handleApprove(confirmModal.id)} style={{ flex:1,background:'linear-gradient(135deg,#10B981,#059669)',color:'white',border:'none',borderRadius:14,padding:13,fontWeight:800,cursor:'pointer' }}>✅ Setujui</button>
          </div>
        </>}
        {confirmModal.type==='reject' && <>
          <div style={{ fontSize:48,marginBottom:12 }}>❌</div>
          <h3 style={{ fontWeight:900,fontSize:17,marginBottom:8 }}>Tolak Request?</h3>
          <p style={{ color:'#6B7280',fontSize:13,marginBottom:22 }}>Request dari <strong>{confirmModal.name}</strong> akan ditolak.</p>
          <div style={{ display:'flex',gap:10 }}>
            <button onClick={()=>setConfirmModal(null)} style={{ flex:1,background:'#F3F4F6',border:'none',borderRadius:14,padding:13,fontWeight:700,cursor:'pointer' }}>Batal</button>
            <button onClick={()=>handleReject(confirmModal.id)} style={{ flex:1,background:'#EF4444',color:'white',border:'none',borderRadius:14,padding:13,fontWeight:800,cursor:'pointer' }}>Tolak</button>
          </div>
        </>}
        {confirmModal.type==='deleteAdmin' && <>
          <div style={{ fontSize:48,marginBottom:12 }}>🗑️</div>
          <h3 style={{ fontWeight:900,fontSize:17,marginBottom:8 }}>Hapus Admin?</h3>
          <p style={{ color:'#6B7280',fontSize:13,marginBottom:22 }}>Admin <strong>{confirmModal.name}</strong> akan dihapus permanen.</p>
          <div style={{ display:'flex',gap:10 }}>
            <button onClick={()=>setConfirmModal(null)} style={{ flex:1,background:'#F3F4F6',border:'none',borderRadius:14,padding:13,fontWeight:700,cursor:'pointer' }}>Batal</button>
            <button onClick={()=>handleDeleteAdmin(confirmModal.id)} style={{ flex:1,background:'#EF4444',color:'white',border:'none',borderRadius:14,padding:13,fontWeight:800,cursor:'pointer' }}>Hapus</button>
          </div>
        </>}
        {confirmModal.type==='deleteArticle' && <>
          <div style={{ fontSize:48,marginBottom:12 }}>🗑️</div>
          <h3 style={{ fontWeight:900,fontSize:17,marginBottom:8 }}>Hapus Artikel?</h3>
          <p style={{ color:'#6B7280',fontSize:13,marginBottom:22 }}>Artikel <strong>"{confirmModal.name}"</strong> akan dihapus permanen.</p>
          <div style={{ display:'flex',gap:10 }}>
            <button onClick={()=>setConfirmModal(null)} style={{ flex:1,background:'#F3F4F6',border:'none',borderRadius:14,padding:13,fontWeight:700,cursor:'pointer' }}>Batal</button>
            <button onClick={()=>handleDeleteArticle(confirmModal.id)} disabled={loading['art_'+confirmModal.id]}
              style={{ flex:1,background:'#EF4444',color:'white',border:'none',borderRadius:14,padding:13,fontWeight:800,cursor:'pointer' }}>
              {loading['art_'+confirmModal.id]?'⏳':'🗑 Hapus'}
            </button>
          </div>
        </>}
      </div>
    </div>
  )

  const LogoutModal = () => !showLogout ? null : (
    <div onClick={e=>e.target===e.currentTarget&&setShowLogout(false)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:600,padding:20 }}>
      <div style={{ background:'white',borderRadius:24,padding:28,width:'100%',maxWidth:340,textAlign:'center' }}>
        <div style={{ fontSize:48,marginBottom:12 }}>👋</div>
        <h3 style={{ fontWeight:900,fontSize:17,marginBottom:6 }}>Keluar dari Super Admin?</h3>
        <p style={{ color:'#6B7280',fontSize:13,marginBottom:22 }}>Kamu akan diarahkan ke halaman login</p>
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={()=>setShowLogout(false)} style={{ flex:1,background:'#F3F4F6',border:'none',borderRadius:14,padding:13,fontWeight:700,cursor:'pointer' }}>Batal</button>
          <button onClick={()=>{ removeAdminToken(); navigate('/admin-login') }} style={{ flex:1,background:'#EF4444',color:'white',border:'none',borderRadius:14,padding:13,fontWeight:800,cursor:'pointer' }}>Keluar</button>
        </div>
      </div>
    </div>
  )

  const Toast = () => !toast ? null : (
    <div style={{ position:'fixed',bottom:24,right:24,zIndex:800,background:toast.type==='error'?'#EF4444':toast.type==='info'?'#3B82F6':'#10B981',color:'white',borderRadius:14,padding:'14px 20px',fontSize:13,fontWeight:700,boxShadow:'0 8px 24px rgba(0,0,0,0.2)',animation:'fadeIn 0.2s',maxWidth:320 }}>
      {toast.type==='error'?'❌ ':toast.type==='info'?'ℹ️ ':'✅ '}{toast.msg}
    </div>
  )

  return (
    <div style={{ minHeight:'100vh',background:'#F9FAFB',fontFamily:'var(--font-body,system-ui,sans-serif)' }}>
      <Sidebar/>
      <div style={{ marginLeft:isDesktop?250:0,minHeight:'100vh',display:'flex',flexDirection:'column',transition:'margin-left 0.28s' }}>
        {!isDesktop && <MobileTopBar/>}
        <main style={{ flex:1,padding:isDesktop?28:16,paddingBottom:48 }}>
          {activeTab==='requests' && <RequestsTab/>}
          {activeTab==='admins'   && <AdminsTab/>}
          {activeTab==='users'    && <UsersTab/>}
          {activeTab==='articles' && <ArticlesTab/>}
          {activeTab==='ratings'  && <RatingsTab/>}
          {activeTab==='stats'    && <StatsTab/>}
        </main>
      </div>
      <ConfirmModal/><LogoutModal/><ArticleFormModal/><Toast/>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes rowIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  )
}