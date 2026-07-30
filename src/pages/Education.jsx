import React, { useState, useEffect } from 'react'
import { educationApi } from '../api'
import BottomNav from '../components/BottomNav'

const filters = ['Semua', 'Investasi', 'Tabungan', 'Budgeting', 'Pay Later']

export default function Education() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('Semua')
  const [search, setSearch] = useState('')
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [articleDetail, setArticleDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    educationApi.getArticles()
      .then(d => {
        const normalized = (d.articles || []).map(a => ({
          ...a,
          readTime: a.readTime ?? a.read_time ?? 5,
          bg:       a.bg       ?? a.bg_color  ?? '#EDE9FE',
        }))
        setArticles(normalized)
      })
      .catch(err => setError(err.message || 'Gagal memuat artikel'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openArticle = (article) => {
    setSelectedArticle(article)
    setArticleDetail(null)
    setDetailError(null)
    setDetailLoading(true)

    educationApi.getArticle(article.id)
      .then(data => {
        setArticleDetail({
          ...data,
          readTime: data.readTime ?? data.read_time ?? article.readTime ?? 5,
          bg:       data.bg       ?? data.bg_color  ?? article.bg ?? '#EDE9FE',
          tags:     data.tags     ?? [],
        })
      })
      .catch(err => {
        setDetailError(err.message || 'Gagal memuat konten artikel')
      })
      .finally(() => setDetailLoading(false))
  }

  const closeArticle = () => {
    setSelectedArticle(null)
    setArticleDetail(null)
    setDetailError(null)
  }

  // ✅ FIX 1: null guard pada category & title agar tidak crash
  const filtered = articles.filter(a => {
    const mF = filter === 'Semua' || (a.category ?? '').toLowerCase().includes(filter.toLowerCase())
    const mS = !search || (a.title ?? '').toLowerCase().includes(search.toLowerCase())
    return mF && mS
  })

  const displayArticle = articleDetail ?? selectedArticle

  return (
    <div className="app-shell">
      <div className="page">

        <div style={{ padding:'clamp(40px,8vw,52px) var(--page-padding) 16px' }}>
          <h1 className="page-title">Edukasi 🧠</h1>
          <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:4 }}>Tingkatkan literasi keuanganmu</p>
        </div>

        {/* Search */}
        <div style={{ padding:'0 var(--page-padding) 12px' }}>
          <input
            className="input-field"
            placeholder="🔍 Cari artikel..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background:'white' }}
          />
        </div>

        {/* Filter */}
        <div className="chip-row" style={{ padding:'0 var(--page-padding) 16px' }}>
          {filters.map(f => (
            <button key={f} className={`chip ${filter===f?'active':''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        {/* Articles */}
        <div style={{ padding:'0 var(--page-padding)' }}>
          {loading
            ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height:88, marginBottom:12, borderRadius:'var(--radius)' }}/>)
            : error
              ? (
                <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'var(--radius)', padding:'24px 20px', textAlign:'center' }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>⚠️</div>
                  <div style={{ fontWeight:800, fontSize:15, color:'#DC2626', marginBottom:6 }}>Gagal memuat artikel</div>
                  <div style={{ fontSize:13, color:'#B91C1C', marginBottom:16 }}>{error}</div>
                  <button className="btn btn-primary" onClick={load}>Coba Lagi</button>
                </div>
              )
            : filtered.length === 0
              ? <div className="empty-state"><div className="emoji">📭</div><p style={{ fontWeight:700 }}>Artikel tidak ditemukan</p></div>
              : filtered.map(a => <ArticleCard key={a.id} article={a} onOpen={() => openArticle(a)}/>)
          }
        </div>
        <div style={{ height:20 }}/>
      </div>
      <BottomNav/>

      {/* Full Article Modal */}
      {selectedArticle && (
        <div style={{ position:'fixed', inset:0, background:'white', zIndex:1000, display:'flex', flexDirection:'column', animation:'fadeIn 0.2s ease', maxWidth:'var(--shell-width)', margin:'0 auto' }}>
          {/* Header */}
          <div style={{ padding:'20px var(--page-padding) 16px', borderBottom:'1px solid var(--border-light)', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
            <button onClick={closeArticle} style={{ background:'var(--border-light)', border:'none', borderRadius:'50%', width:40, height:40, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              ‹
            </button>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:800, color:'var(--primary)', letterSpacing:'0.06em', marginBottom:2 }}>{selectedArticle.category}</div>
              <div style={{ fontWeight:800, fontSize:14, color:'var(--text)', lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{selectedArticle.title}</div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div style={{ flex:1, overflowY:'auto', padding:'0 var(--page-padding) 40px' }}>

            {/* Hero */}
            <div style={{ margin:'20px 0', background: displayArticle.bg || 'var(--primary-xlight)', borderRadius:'var(--radius)', padding:'28px 24px', display:'flex', alignItems:'center', gap:16 }}>
              <span style={{ fontSize:52 }}>{displayArticle.image}</span>
              <div>
                <h1 style={{ fontSize:18, fontWeight:900, fontFamily:'var(--font-display)', color:'var(--text)', lineHeight:1.3, marginBottom:8 }}>{displayArticle.title}</h1>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <span style={{ background:'rgba(124,58,237,0.12)', color:'var(--primary)', fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:20 }}>
                    ⏱ {displayArticle.readTime} menit baca
                  </span>
                  <span style={{ background:'rgba(0,0,0,0.06)', color:'var(--text-muted)', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>
                    {displayArticle.daysAgo} hari lalu
                  </span>
                </div>
              </div>
            </div>

            {/* Loading skeleton */}
            {detailLoading && (
              <div style={{ marginBottom:20 }}>
                <div className="skeleton" style={{ height:16, borderRadius:8, marginBottom:10 }}/>
                <div className="skeleton" style={{ height:16, borderRadius:8, marginBottom:10, width:'85%' }}/>
                <div className="skeleton" style={{ height:16, borderRadius:8, marginBottom:10, width:'90%' }}/>
                <div className="skeleton" style={{ height:16, borderRadius:8, marginBottom:10, width:'70%' }}/>
                <div className="skeleton" style={{ height:16, borderRadius:8, marginBottom:10 }}/>
                <div className="skeleton" style={{ height:16, borderRadius:8, width:'80%' }}/>
              </div>
            )}

            {/* Error saat load detail */}
            {detailError && !detailLoading && (
              <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'var(--radius)', padding:'16px', marginBottom:16, textAlign:'center' }}>
                <div style={{ fontSize:13, color:'#B91C1C', marginBottom:10 }}>⚠️ {detailError}</div>
                <button
                  className="btn btn-primary"
                  style={{ fontSize:13, padding:'8px 16px' }}
                  onClick={() => openArticle(selectedArticle)}
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {/* Tags */}
            {!detailLoading && articleDetail?.tags?.length > 0 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
                {articleDetail.tags.map(tag => (
                  <span key={tag} style={{ background:'var(--border-light)', color:'var(--text-muted)', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20 }}>#{tag}</span>
                ))}
              </div>
            )}

            {/* Article Body */}
            {!detailLoading && !detailError && articleDetail && (
              articleDetail.content
                ? (
                  <div style={{ lineHeight:1.8, fontSize:14, color:'var(--text)' }}>
                    {articleDetail.content
                      .split('\n\n')
                      .map((paragraph, i) => {
                        // ✅ FIX 2: regex ketat agar hanya full-paragraph **teks** yang jadi heading
                        if (/^\*\*[^*]+\*\*$/.test(paragraph.trim())) {
                          const text = paragraph.trim().slice(2, -2)
                          return <h3 key={i} style={{ fontWeight:900, fontSize:16, fontFamily:'var(--font-display)', marginTop:24, marginBottom:8, color:'var(--text)' }}>{text}</h3>
                        }
                        const parts = paragraph.split(/(\*\*[^*]+\*\*)/)
                        return (
                          <p key={i} style={{ marginBottom:14 }}>
                            {parts.map((part, j) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={j}>{part.slice(2,-2)}</strong>
                              }
                              // ✅ FIX 3: tambah startsWith agar bullet di awal paragraph ikut ter-render
                              if (part.includes('\n•') || part.includes('\n-') || part.startsWith('•') || part.startsWith('-')) {
                                return part.split('\n').map((line, k) => {
                                  if (line.startsWith('•') || line.startsWith('-')) {
                                    return <div key={k} style={{ display:'flex', gap:8, marginBottom:6 }}><span style={{ color:'var(--primary)', flexShrink:0 }}>•</span><span>{line.slice(1).trim()}</span></div>
                                  }
                                  if (line.match(/^\d+\./)) {
                                    return <div key={k} style={{ display:'flex', gap:8, marginBottom:8 }}><span style={{ color:'var(--primary)', fontWeight:800, flexShrink:0 }}>{line.match(/^\d+/)[0]}.</span><span>{line.replace(/^\d+\./, '').trim()}</span></div>
                                  }
                                  return line ? <span key={k}>{line}</span> : null
                                })
                              }
                              return <span key={j}>{part}</span>
                            })}
                          </p>
                        )
                      })}
                  </div>
                )
                : (
                  <div style={{ background:'var(--border-light)', borderRadius:'var(--radius)', padding:'24px 20px', textAlign:'center', color:'var(--text-muted)' }}>
                    <div style={{ fontSize:36, marginBottom:10 }}>📄</div>
                    <div style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>Konten belum tersedia</div>
                    <div style={{ fontSize:13 }}>Admin belum menambahkan isi artikel ini.</div>
                  </div>
                )
            )}

            {/* Share / Bookmark */}
            {!detailLoading && (
              <div style={{ display:'flex', gap:10, marginTop:28 }}>
                <button
                  onClick={() => { navigator.share ? navigator.share({ title: selectedArticle.title, text: 'Baca artikel keuangan ini!' }) : navigator.clipboard?.writeText(window.location.href).then(() => alert('Link disalin!')) }}
                  style={{ flex:1, padding:14, background:'var(--border-light)', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', fontWeight:700, fontSize:14, display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}
                >
                  📤 Bagikan
                </button>
                <button
                  onClick={() => alert('Artikel disimpan! ✅')}
                  style={{ flex:1, padding:14, background:'var(--primary-xlight)', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', fontWeight:700, fontSize:14, color:'var(--primary)', display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}
                >
                  🔖 Simpan
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ArticleCard({ article, onOpen }) {
  return (
    <div
      onClick={onOpen}
      style={{ display:'flex', gap:14, padding:'clamp(12px,3vw,16px)', background:'white', borderRadius:'var(--radius)', marginBottom:12, border:'1px solid var(--border-light)', cursor:'pointer', boxShadow:'var(--shadow-sm)', transition:'box-shadow 0.2s', WebkitTapHighlightColor:'transparent' }}
    >
      <div style={{ width:'clamp(52px,14vw,64px)', height:'clamp(52px,14vw,64px)', borderRadius:12, background: article.bg || 'var(--primary-xlight)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'clamp(24px,6vw,30px)', flexShrink:0 }}>
        {article.image}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:11, fontWeight:800, color:'var(--primary)', letterSpacing:'0.06em', marginBottom:4 }}>{article.category}</div>
        <div style={{ fontWeight:700, fontSize:'clamp(13px,3.5vw,14px)', lineHeight:1.35, marginBottom:5 }}>{article.title}</div>
        <div style={{ color:'var(--text-muted)', fontSize:12, display:'flex', alignItems:'center', gap:8 }}>
          <span>⏱ {article.readTime} mnt</span>
          <span>·</span>
          <span>{article.daysAgo} hari lalu</span>
          <span style={{ marginLeft:'auto', color:'var(--primary)', fontWeight:700 }}>Baca →</span>
        </div>
      </div>
    </div>
  )
}