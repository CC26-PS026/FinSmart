import React, { useState, useEffect } from 'react'
import { transactionApi } from '../api'
import { categories } from '../api/mockData'
import { useToast } from '../hooks/useToast'
import { useNotifications } from '../hooks/useNotifications'
import BottomNav from '../components/BottomNav'
import jsPDF from 'jspdf'

const fmt = (n) => `Rp ${Math.abs(n).toLocaleString('id-ID')}`

function fmtDate(d) {
  const date = new Date(d), today = new Date(), yest = new Date()
  yest.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'HARI INI'
  if (date.toDateString() === yest.toDateString()) return 'KEMARIN'
  return date.toLocaleDateString('id-ID', { day:'numeric', month:'long' }).toUpperCase()
}

function groupByDate(txs) {
  const g = {}
  txs.forEach(t => { const k = fmtDate(t.date); (g[k] = g[k] || []).push(t) })
  return g
}

// ─── PDF Generator ────────────────────────────────────────────────────────────
function exportPDF(txs, filterLabel) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, MARGIN = 14, COL = W - MARGIN * 2
  let y = 0

  const PURPLE = [124, 58, 237]
  const GREEN  = [16, 185, 129]
  const RED    = [239, 68, 68]
  const GRAY   = [107, 114, 128]
  const DARK   = [17, 24, 39]
  const WHITE  = [255, 255, 255]
  const LIGHT  = [249, 250, 251]

  const sf = (style = 'normal', size = 10, color = DARK) => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    doc.setTextColor(...color)
  }
  const ln = (x1, y1, x2, y2, c = [229,231,235], w = 0.3) => {
    doc.setDrawColor(...c); doc.setLineWidth(w); doc.line(x1, y1, x2, y2)
  }
  const bg = (x, ry, rw, rh, c) => {
    doc.setFillColor(...c); doc.setDrawColor(...c); doc.rect(x, ry, rw, rh, 'F')
  }
  const chk = (need = 12) => {
    if (y + need > 280) {
      doc.addPage(); y = 14
      sf('bold', 8, PURPLE)
      doc.text('FinSmart — Laporan Transaksi', MARGIN, y)
      sf('normal', 8, GRAY)
      doc.text(new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }), W - MARGIN, y, { align:'right' })
      y += 5; ln(MARGIN, y, W - MARGIN, y, PURPLE, 0.5); y += 5
    }
  }

  // ── Header ─────────────────────────────────────────────────────────────────
  bg(0, 0, W, 42, PURPLE)
  sf('bold', 20, WHITE)
  doc.text('FinSmart', MARGIN, 16)
  sf('normal', 10, [196, 181, 253])
  doc.text('Laporan Transaksi', MARGIN, 25)
  sf('normal', 9, [221, 214, 253])
  const dateStr = new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' })
  doc.text(`Filter: ${filterLabel}  ·  Dicetak: ${dateStr}`, MARGIN, 33)
  y = 50

  // ── Ringkasan ──────────────────────────────────────────────────────────────
  const totalIn  = txs.filter(t => t.type === 'masuk').reduce((a, t) => a + Number(t.amount), 0)
  const totalOut = txs.filter(t => t.type === 'keluar').reduce((a, t) => a + Number(t.amount), 0)
  const saldo    = totalIn - totalOut

  const cards = [
    { label: 'Pemasukan', value: fmt(totalIn),  color: GREEN },
    { label: 'Pengeluaran', value: fmt(totalOut), color: RED },
    { label: 'Saldo', value: fmt(saldo), color: saldo >= 0 ? PURPLE : RED },
  ]
  const cw = (COL - 6) / 3
  cards.forEach(({ label, value, color }, i) => {
    const cx = MARGIN + i * (cw + 3)
    bg(cx, y, cw, 20, LIGHT)
    doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3); doc.rect(cx, y, cw, 20)
    sf('normal', 8, GRAY)
    doc.text(label, cx + cw / 2, y + 7, { align: 'center' })
    sf('bold', 9, color)
    const val = value.replace('Rp ', 'Rp ')
    doc.text(val.length > 16 ? val.replace('Rp ', '') : val, cx + cw / 2, y + 15, { align: 'center' })
  })
  y += 26

  // ── Tabel ─────────────────────────────────────────────────────────────────
  sf('bold', 12, DARK)
  doc.text(`Daftar Transaksi (${txs.length} item)`, MARGIN, y)
  y += 7

  // Header tabel
  bg(MARGIN, y, COL, 8, PURPLE)
  sf('bold', 8.5, WHITE)
  doc.text('Tanggal',    MARGIN + 3,       y + 5.5)
  doc.text('Keterangan', MARGIN + 32,      y + 5.5)
  doc.text('Kategori',   MARGIN + 100,     y + 5.5)
  doc.text('Tipe',       MARGIN + 138,     y + 5.5)
  doc.text('Jumlah',     W - MARGIN - 3,   y + 5.5, { align: 'right' })
  y += 8

  // Group by date untuk header tanggal
  const grouped = groupByDateRaw(txs)
  Object.entries(grouped).forEach(([dateLabel, list]) => {
    // Date separator
    chk(10)
    bg(MARGIN, y, COL, 6, [237, 233, 254])
    sf('bold', 8, PURPLE)
    doc.text(dateLabel, MARGIN + 3, y + 4.5)
    y += 6

    list.forEach((tx, i) => {
      chk(8)
      const rowBg = i % 2 === 0 ? WHITE : LIGHT
      bg(MARGIN, y, COL, 7.5, rowBg)

      const txDate = new Date(tx.date).toLocaleDateString('id-ID', { day:'2-digit', month:'short' })
      const isIn   = tx.type === 'masuk'
      const title  = (tx.title || '').length > 30 ? tx.title.slice(0, 28) + '…' : (tx.title || '')

      sf('normal', 8, GRAY)
      doc.text(txDate,    MARGIN + 3,   y + 5.5)
      sf('normal', 8, DARK)
      doc.text(title,     MARGIN + 32,  y + 5.5)
      sf('normal', 8, GRAY)
      doc.text(tx.category || '-', MARGIN + 100, y + 5.5)

      // Tipe badge
      const bx = MARGIN + 136, by = y + 1.5, bw = 17, bh = 4.5
      bg(bx, by, bw, bh, isIn ? [209, 250, 229] : [254, 226, 226])
      sf('bold', 7, isIn ? GREEN : RED)
      doc.text(isIn ? 'Masuk' : 'Keluar', bx + bw / 2, by + 3.3, { align: 'center' })

      sf('bold', 8, isIn ? GREEN : RED)
      doc.text(
        `${isIn ? '+' : '-'}${fmt(tx.amount)}`,
        W - MARGIN - 3, y + 5.5, { align: 'right' }
      )

      ln(MARGIN, y + 7.5, W - MARGIN, y + 7.5, [229, 231, 235])
      y += 7.5
    })
  })

  // ── Total baris ────────────────────────────────────────────────────────────
  chk(10)
  bg(MARGIN, y, COL, 9, [237, 233, 254])
  sf('bold', 9, PURPLE)
  doc.text('Total', MARGIN + 3, y + 6)
  doc.text(fmt(saldo), W - MARGIN - 3, y + 6, { align: 'right' })
  y += 14

  // ── Kategori ringkasan ─────────────────────────────────────────────────────
  const catMap = {}
  txs.filter(t => t.type === 'keluar').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount)
  })
  const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1])

  if (cats.length > 0) {
    chk(20 + cats.length * 8)
    sf('bold', 12, DARK)
    doc.text('Pengeluaran per Kategori', MARGIN, y)
    y += 7

    bg(MARGIN, y, COL, 8, PURPLE)
    sf('bold', 8.5, WHITE)
    doc.text('Kategori',  MARGIN + 3,     y + 5.5)
    doc.text('Total',     MARGIN + 95,    y + 5.5)
    doc.text('Persentase',MARGIN + 135,   y + 5.5)
    y += 8

    const totalKeluar = cats.reduce((s, [, v]) => s + v, 0)
    const BAR_COLORS = [[124,58,237],[239,68,68],[245,158,11],[16,185,129],[59,130,246],[236,72,153]]
    cats.forEach(([cat, val], i) => {
      chk(9)
      bg(MARGIN, y, COL, 8, i % 2 === 0 ? WHITE : LIGHT)
      const pct  = totalKeluar > 0 ? (val / totalKeluar * 100) : 0
      const bcol = BAR_COLORS[i % BAR_COLORS.length]
      sf('normal', 8.5, DARK)
      doc.text(cat,      MARGIN + 3,  y + 5.5)
      doc.text(fmt(val), MARGIN + 95, y + 5.5)
      sf('bold', 8.5, bcol)
      doc.text(`${pct.toFixed(1)}%`, MARGIN + 135, y + 5.5)
      // mini bar
      const barW = 35
      bg(W - MARGIN - barW - 3, y + 2, barW, 4, [229,231,235])
      bg(W - MARGIN - barW - 3, y + 2, (pct/100) * barW, 4, bcol)
      ln(MARGIN, y + 8, W - MARGIN, y + 8)
      y += 8
    })
  }

  // ── Footer tiap halaman ────────────────────────────────────────────────────
  const n = doc.getNumberOfPages()
  for (let i = 1; i <= n; i++) {
    doc.setPage(i)
    ln(MARGIN, 286, W - MARGIN, 286, [229,231,235], 0.4)
    sf('normal', 7.5, GRAY)
    doc.text(`FinSmart  ·  Laporan Transaksi  ·  ${filterLabel}  ·  Hal ${i}/${n}`, W/2, 291, { align:'center' })
  }

  const slug = filterLabel.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
  doc.save(`Transaksi_FinSmart_${slug}.pdf`)
}

// raw group by date (pakai date string asli, bukan "HARI INI")
function groupByDateRaw(txs) {
  const g = {}
  txs.forEach(t => {
    const d = new Date(t.date)
    const k = d.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).toUpperCase()
    ;(g[k] = g[k] || []).push(t)
  })
  return g
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Transactions() {
  const [txs, setTxs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('semua')
  const [showSheet, setShowSheet] = useState(false)
  const [exporting, setExporting] = useState(false)
  const toast = useToast()
  const { addNotif } = useNotifications()

  const load = async () => {
    try {
      const d = await transactionApi.getAll()
      setTxs(d.transactions || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'semua' ? txs : txs.filter(t => t.type === filter)
  const totalIn  = txs.filter(t => t.type === 'masuk').reduce((a, t) => a + Number(t.amount), 0)
  const totalOut = Math.abs(txs.filter(t => t.type === 'keluar').reduce((a, t) => a + Number(t.amount), 0))
  const groups   = groupByDate(filtered)

  const handleExport = () => {
    if (filtered.length === 0) { toast('Tidak ada transaksi untuk diekspor', 'error'); return }
    setExporting(true)
    try {
      const label = filter === 'semua' ? 'Semua Transaksi' : filter === 'masuk' ? 'Pemasukan' : 'Pengeluaran'
      exportPDF(filtered, label)
      toast('PDF berhasil diunduh! 📄', 'success')
    } catch (e) {
      toast('Gagal membuat PDF', 'error')
    } finally {
      setTimeout(() => setExporting(false), 800)
    }
  }

  return (
    <div className="app-shell">
      <div className="page">

        {/* Header */}
        <div className="flex justify-between items-center" style={{ padding:'clamp(40px,8vw,52px) var(--page-padding) 14px' }}>
          <h1 className="page-title">Transaksi</h1>

          {/* ── Tombol PDF + Tambah ── */}
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {/* Tombol Ekspor PDF */}
            <button
              onClick={handleExport}
              disabled={exporting || loading}
              title="Ekspor ke PDF"
              style={{
                width: 44, height: 44, padding: 0,
                borderRadius: '50%', flexShrink: 0,
                border: '1.5px solid var(--primary)',
                background: 'var(--primary-xlight, #EDE9FE)',
                color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: exporting ? 'not-allowed' : 'pointer',
                opacity: exporting ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              {exporting ? (
                <span style={{ fontSize: 18, animation: 'spin 1s linear infinite', display:'inline-block' }}>⏳</span>
              ) : (
                // PDF icon
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              )}
            </button>

            {/* Tombol Tambah */}
            <button
              className="btn btn-primary"
              style={{ width:44, height:44, padding:0, borderRadius:'50%', fontSize:22, flexShrink:0 }}
              onClick={() => setShowSheet(true)}
            >+</button>
          </div>
        </div>

        {/* Summary */}
        <div style={{ padding:'0 var(--page-padding) 14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div style={{ background:'var(--success-light)', borderRadius:'var(--radius-sm)', padding:'clamp(12px,3vw,16px)' }}>
            <div style={{ color:'var(--success)', fontSize:12, fontWeight:700 }}>Pemasukan</div>
            <div style={{ color:'var(--success)', fontSize:'clamp(16px,4vw,20px)', fontWeight:900, marginTop:4 }}>+Rp {totalIn.toLocaleString('id-ID')}</div>
          </div>
          <div style={{ background:'var(--danger-light)', borderRadius:'var(--radius-sm)', padding:'clamp(12px,3vw,16px)' }}>
            <div style={{ color:'var(--danger)', fontSize:12, fontWeight:700 }}>Pengeluaran</div>
            <div style={{ color:'var(--danger)', fontSize:'clamp(16px,4vw,20px)', fontWeight:900, marginTop:4 }}>-Rp {totalOut.toLocaleString('id-ID')}</div>
          </div>
        </div>

        {/* Filter + hint PDF */}
        <div style={{ padding:'0 var(--page-padding) 14px' }}>
          <div className="chip-row" style={{ marginBottom: 6 }}>
            {[['semua','Semua'],['keluar','Keluar'],['masuk','Masuk']].map(([v,l]) => (
              <button key={v} className={`chip ${filter===v?'active':''}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
          <div style={{ fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Tekan ikon PDF di kanan atas untuk mengunduh laporan transaksi ini
          </div>
        </div>

        {/* List */}
        <div style={{ padding:'0 var(--page-padding)' }}>
          {loading
            ? [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:60, marginBottom:8, borderRadius:12 }}/>)
            : filtered.length === 0
              ? <div className="empty-state"><div className="emoji">📭</div><p style={{ fontWeight:700 }}>Belum ada transaksi</p><p style={{ fontSize:13, marginTop:4 }}>Yuk mulai catat!</p></div>
              : Object.entries(groups).map(([date, list]) => (
                  <div key={date}>
                    <div style={{ fontSize:11, fontWeight:800, color:'var(--text-muted)', letterSpacing:'0.08em', padding:'12px 0 8px' }}>{date}</div>
                    {list.map(tx => (
                      <TxRow key={tx.id} tx={tx} onDelete={() => {
                        transactionApi.delete(tx.id)
                        setTxs(prev => prev.filter(t => t.id !== tx.id))
                        toast('Transaksi dihapus', 'success')
                      }}/>
                    ))}
                  </div>
                ))
          }
        </div>
        <div style={{ height:20 }}/>
      </div>

      {showSheet && (
        <AddSheet
          onClose={() => setShowSheet(false)}
          onSave={(t) => { setTxs(prev => [t, ...prev]); setShowSheet(false); toast('Transaksi dicatat! ✅', 'success') }}
          onNotify={addNotif}
        />
      )}
      <BottomNav/>
    </div>
  )
}

function TxRow({ tx, onDelete }) {
  const isOut = tx.type === 'keluar'
  const [menu, setMenu] = useState(false)

  return (
    <div className="flex items-center gap-12" style={{ padding:'11px 0', borderBottom:'1px solid var(--border-light)', position:'relative' }}>
      <div style={{ width:42, height:42, borderRadius:12, background: isOut ? '#FEF2F2' : '#ECFDF5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
        {tx.icon || (isOut ? '📤' : '📥')}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:'clamp(13px,3.5vw,14px)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.title}</div>
        <div style={{ color:'var(--text-muted)', fontSize:12 }}>{tx.category}</div>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{ fontWeight:800, fontSize:'clamp(13px,3.5vw,14px)', color: isOut ? 'var(--danger)' : 'var(--success)' }}>
          {isOut ? '-' : '+'}Rp {Math.abs(tx.amount).toLocaleString('id-ID')}
        </div>
      </div>
      <button onClick={() => setMenu(m => !m)} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:18, cursor:'pointer', padding:'0 4px', flexShrink:0 }}>⋮</button>
      {menu && (
        <div style={{ position:'absolute', right:0, top:'100%', background:'white', borderRadius:12, boxShadow:'0 8px 30px rgba(0,0,0,0.12)', border:'1px solid var(--border)', zIndex:10, overflow:'hidden', minWidth:120 }}>
          <button onClick={() => { onDelete(); setMenu(false) }} style={{ display:'block', width:'100%', padding:'12px 16px', border:'none', background:'none', color:'var(--danger)', fontWeight:700, fontSize:14, cursor:'pointer', textAlign:'left', fontFamily:'var(--font-body)' }}>
            🗑️ Hapus
          </button>
        </div>
      )}
    </div>
  )
}

function AddSheet({ onClose, onSave, onNotify }) {
  const [type, setType] = useState('keluar')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleSave = async () => {
    if (!amount || !title) { toast('Isi jumlah dan nama transaksi!', 'error'); return }
    setLoading(true)
    const newTx = {
      id: Date.now().toString(),
      title, category: category || 'Lainnya',
      amount: type === 'keluar' ? -Number(amount) : Number(amount),
      type, date: new Date().toISOString(),
      icon: categories.find(c => c.value === category)?.icon || '📦',
    }
    try {
      await transactionApi.create(newTx)
    } catch (err) {
      setLoading(false)
      toast(err?.message || 'Gagal menyimpan transaksi ke server.', 'error')
      return
    }
    setLoading(false)

    if (onNotify) {
      const isIn = type === 'masuk'
      onNotify({
        type: isIn ? 'income' : 'expense',
        title: isIn ? `Pemasukan Baru 💰` : `Pengeluaran Dicatat 🛒`,
        body: `${title} — Rp ${Number(amount).toLocaleString('id-ID')}`,
      })
    }
    onSave(newTx)
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <h3 style={{ fontSize:'clamp(16px,4vw,18px)', fontWeight:800, marginBottom:20, textAlign:'center', fontFamily:'var(--font-display)' }}>📝 Catat Transaksi</h3>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:20, background:'var(--bg)', borderRadius:12, padding:4 }}>
          {[['keluar','- Pengeluaran'],['masuk','+ Pemasukan']].map(([t,l]) => (
            <button key={t} onClick={() => setType(t)} style={{
              padding:'12px', borderRadius:10, fontWeight:800, fontSize:'clamp(13px,3.5vw,14px)', border:'none', fontFamily:'var(--font-body)',
              background: type===t ? (t==='keluar' ? 'var(--danger)' : 'var(--success)') : 'transparent',
              color: type===t ? 'white' : 'var(--text-muted)', cursor:'pointer', transition:'all 0.2s'
            }}>{l}</button>
          ))}
        </div>

        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ color:'var(--text-muted)', fontSize:13, marginBottom:6 }}>IDR</div>
          <input
            type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)}
            style={{ fontSize:'clamp(28px,8vw,40px)', fontWeight:900, textAlign:'center', border:'none', outline:'none',
              color: type==='keluar' ? 'var(--danger)' : 'var(--success)', background:'none', width:'100%', fontFamily:'var(--font-display)' }}
          />
        </div>

        <div style={{ marginBottom:14 }}>
          <div className="input-label" style={{ marginBottom:10 }}>Kategori</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
            {categories.map(cat => (
              <button key={cat.value} onClick={() => setCategory(cat.value)} style={{
                padding:'8px 4px', borderRadius:12, border:`2px solid ${category===cat.value ? 'var(--primary)' : 'var(--border)'}`,
                background: category===cat.value ? 'var(--primary-xlight)' : 'white',
                cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                transition:'all 0.15s', overflow:'hidden'
              }}>
                <div style={{ width:44, height:44, borderRadius:10, overflow:'hidden', flexShrink:0, border: category===cat.value ? '2px solid var(--primary)' : '2px solid transparent' }}>
                  <img
                    src={cat.img}
                    alt={cat.label}
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}
                    onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
                  />
                  <div style={{ display:'none', width:'100%', height:'100%', alignItems:'center', justifyContent:'center', fontSize:22, background:'#f3f4f6' }}>{cat.icon}</div>
                </div>
                <span style={{ fontSize:'clamp(9px,2.5vw,10px)', fontWeight:700, color: category===cat.value ? 'var(--primary)' : 'var(--text-muted)', textAlign:'center', lineHeight:1.2 }}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Nama Transaksi</label>
          <input className="input-field" placeholder="Contoh: Makan Siang" value={title} onChange={e => setTitle(e.target.value)}/>
        </div>

        <button className="btn btn-success w-full" style={{ padding:'clamp(13px,3vw,16px)', fontSize:'clamp(14px,4vw,16px)', marginTop:4 }} onClick={handleSave} disabled={loading}>
          {loading ? <div className="spinner"/> : 'Simpan ✓'}
        </button>
      </div>
    </div>
  )
}