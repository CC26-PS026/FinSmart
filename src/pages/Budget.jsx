import React, { useEffect, useState } from 'react'
import { budgetApi } from '../api'
import BottomNav from '../components/BottomNav'

export default function Budget() {
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showIncomeSheet, setShowIncomeSheet] = useState(false)

  const load = () => {
    setLoading(true)
    budgetApi.getCurrent()
      .then(d => setBudget(d.budget))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="app-shell">
      <div className="page" style={{ padding: '52px var(--page-padding) 16px' }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:110, marginBottom:12, borderRadius:'var(--radius)' }}/>)}
      </div>
    </div>
  )

  if (error || !budget) return (
    <div className="app-shell">
      <div className="page" style={{ padding: '52px var(--page-padding) 16px' }}>
        <div style={{ background:'#FEE2E2', border:'1px solid #FECACA', borderRadius:'var(--radius)', padding:20, textAlign:'center', color:'#DC2626' }}>
          ⚠️ Gagal memuat data budget.<br/>
          <span style={{ fontSize:13 }}>{error}</span>
        </div>
      </div>
      <BottomNav/>
    </div>
  )

  return (
    <div className="app-shell">
      <div className="page">

        {/* Header */}
        <div className="flex justify-between items-center" style={{ padding:'clamp(40px,8vw,52px) var(--page-padding) 16px' }}>
          <div>
            <h1 className="page-title">Budgeting 💰</h1>
            <div style={{ color:'var(--text-muted)', fontSize:13, marginTop:3 }}>{budget.month}</div>
          </div>
          <div style={{ background:'var(--gradient-btn)', color:'white', borderRadius:'var(--radius-sm)', padding:'8px clamp(12px,3vw,16px)', fontSize:13, fontWeight:800, boxShadow:'0 4px 16px rgba(124,58,237,0.3)' }}>
            50/30/20
          </div>
        </div>

        {/* Total income — klik untuk edit */}
        <div style={{ padding:'0 var(--page-padding) 16px' }}>
          <button
            onClick={() => setShowIncomeSheet(true)}
            style={{ width:'100%', background:'var(--gradient-main)', color:'white', borderRadius:'var(--radius)', padding:'clamp(14px,3vw,18px) 20px', textAlign:'center', fontWeight:800, fontSize:'clamp(13px,3.5vw,15px)', boxShadow:'0 6px 24px rgba(124,58,237,0.3)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
          >
            <span>💵 Total Pemasukan: Rp {(budget.totalIncome || 0).toLocaleString('id-ID')}</span>
            <span style={{ opacity:0.8, fontSize:12, fontWeight:600 }}>✏️ Ubah</span>
          </button>
        </div>

        {/* Budget cards */}
        <div style={{ padding:'0 var(--page-padding)' }}>
          {budget.categories?.map(cat => <BudgetCard key={cat.name} cat={cat}/>)}
        </div>

        {/* Alert */}
        {budget.categories?.some(c => c.warning) && (
          <div style={{ margin:'8px var(--page-padding)', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'var(--radius-sm)', padding:'14px 16px', display:'flex', gap:10, alignItems:'flex-start' }}>
            <span style={{ fontSize:20, flexShrink:0 }}>⚠️</span>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:'#92400E' }}>Budget keinginan hampir habis!</div>
              <div style={{ fontSize:13, color:'#B45309', marginTop:2 }}>
                Sisa Rp {budget.categories?.find(c => c.warning)?.remaining?.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        )}

        {/* Mapping info */}
        <div style={{ margin:'8px var(--page-padding) 0', background:'#F0F9FF', borderRadius:'var(--radius-sm)', padding:'12px 16px', border:'1px solid #BAE6FD' }}>
          <div style={{ fontWeight:700, fontSize:13, color:'#0369A1', marginBottom:6 }}>📌 Kategori Transaksi → Budget</div>
          <div style={{ fontSize:12, color:'#0C4A6E', lineHeight:1.8 }}>
            <strong>Kebutuhan:</strong> Makanan, Transportasi, Tagihan, Kesehatan<br/>
            <strong>Keinginan:</strong> Hiburan, Belanja, Hobi, Lainnya<br/>
            <strong>Tabungan:</strong> Tabungan, Investasi
          </div>
        </div>

        {/* Tips */}
        <div style={{ margin:'16px var(--page-padding)', background:'var(--primary-xlight)', borderRadius:'var(--radius)', padding:'clamp(14px,3vw,18px)', border:'1px solid #DDD6FE' }}>
          <div style={{ fontWeight:800, fontSize:14, color:'var(--primary)', marginBottom:8 }}>💡 Tips Budgeting</div>
          <div style={{ fontSize:'clamp(12px,3vw,13px)', color:'#5B21B6', lineHeight:1.7 }}>
            Metode <strong>50/30/20</strong>: 50% untuk kebutuhan pokok, 30% untuk keinginan, dan 20% untuk tabungan & investasi masa depan.
          </div>
        </div>

        <div style={{ height:20 }}/>
      </div>

      {showIncomeSheet && (
        <IncomeSheet
          currentIncome={budget.totalIncome || 0}
          onClose={() => setShowIncomeSheet(false)}
          onSaved={() => { setShowIncomeSheet(false); load() }}
        />
      )}

      <BottomNav/>
    </div>
  )
}

function BudgetCard({ cat }) {
  const pct = Math.min(cat.status || 0, 100)
  const isOver = pct >= 90
  const colors = {
    'Kebutuhan': { bg:'#F5F3FF', border:'#DDD6FE', text:'#7C3AED', fill:'#7C3AED' },
    'Keinginan': { bg:'#FFFBEB', border:'#FDE68A', text:'#D97706', fill:'#F59E0B' },
    'Tabungan':  { bg:'#ECFDF5', border:'#A7F3D0', text:'#059669', fill:'#10B981' },
  }
  const c = colors[cat.name] || colors['Kebutuhan']

  return (
    <div style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:'var(--radius)', padding:'clamp(14px,3vw,18px)', marginBottom:12 }}>
      <div className="flex justify-between items-center" style={{ marginBottom:12 }}>
        <div>
          <div style={{ fontWeight:800, fontSize:'clamp(14px,4vw,16px)', color:c.text }}>
            {cat.done ? '✓ ' : cat.warning ? '⚠ ' : '● '}{cat.name} · {cat.percentage}%
          </div>
          <div style={{ color:'var(--text-muted)', fontSize:12, marginTop:2 }}>
            Dipakai Rp {(cat.used || 0).toLocaleString('id-ID')}
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontWeight:900, fontSize:'clamp(18px,5vw,22px)', color:c.text }}>{pct}%</div>
          {cat.done
            ? <div style={{ fontSize:11, color:'var(--success)', fontWeight:700 }}>Terpenuhi 🎉</div>
            : <div style={{ fontSize:11, color:'var(--text-muted)' }}>sisa Rp {(cat.remaining || 0).toLocaleString('id-ID')}</div>
          }
        </div>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width:`${pct}%`, background: isOver ? 'var(--danger)' : c.fill }}/>
      </div>
      <div className="flex justify-between" style={{ marginTop:8, fontSize:12, color:'var(--text-muted)' }}>
        <span>Rp {(cat.used || 0).toLocaleString('id-ID')}</span>
        <span>Rp {(cat.total || 0).toLocaleString('id-ID')}</span>
      </div>
    </div>
  )
}

function IncomeSheet({ currentIncome, onClose, onSaved }) {
  const [income, setIncome] = useState(currentIncome > 0 ? String(currentIncome) : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    const val = Number(income)
    if (!val || val <= 0) { setError('Masukkan jumlah pemasukan yang valid'); return }
    setLoading(true)
    try {
      await budgetApi.update({ totalIncome: val })
      onSaved()
    } catch (e) {
      setError(e.message || 'Gagal menyimpan')
      setLoading(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <h3 style={{ fontSize:'clamp(16px,4vw,18px)', fontWeight:800, marginBottom:8, textAlign:'center', fontFamily:'var(--font-display)' }}>
          💵 Atur Total Pemasukan
        </h3>
        <p style={{ textAlign:'center', fontSize:13, color:'var(--text-muted)', marginBottom:20 }}>
          Budget 50/30/20 dihitung otomatis dari pemasukan ini
        </p>

        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ color:'var(--text-muted)', fontSize:13, marginBottom:6 }}>IDR</div>
          <input
            type="number"
            placeholder="0"
            value={income}
            onChange={e => { setIncome(e.target.value); setError('') }}
            style={{ fontSize:'clamp(28px,8vw,40px)', fontWeight:900, textAlign:'center', border:'none', outline:'none',
              color:'var(--primary)', background:'none', width:'100%', fontFamily:'var(--font-display)' }}
            autoFocus
          />
          {income && Number(income) > 0 && (
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:8, lineHeight:1.8 }}>
              Kebutuhan (50%): Rp {Math.round(Number(income)*0.5).toLocaleString('id-ID')}<br/>
              Keinginan (30%): Rp {Math.round(Number(income)*0.3).toLocaleString('id-ID')}<br/>
              Tabungan (20%): Rp {Math.round(Number(income)*0.2).toLocaleString('id-ID')}
            </div>
          )}
        </div>

        {error && <div style={{ color:'var(--danger)', fontSize:13, textAlign:'center', marginBottom:12 }}>{error}</div>}

        <button
          className="btn btn-primary w-full"
          style={{ padding:'clamp(13px,3vw,16px)', fontSize:'clamp(14px,4vw,16px)' }}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? <div className="spinner"/> : 'Simpan Pemasukan ✓'}
        </button>
      </div>
    </div>
  )
}
