import React, { useEffect, useState } from 'react'
import { budgetApi, transactionApi } from '../api'
import BottomNav from '../components/BottomNav'

export default function Budget() {
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([budgetApi.getCurrent(), transactionApi.getAll()])
      .then(([b, t]) => {
        // Total pemasukan dihitung otomatis dari transaksi "masuk" yang sebenarnya,
        // bukan dari angka yang diketik manual — supaya nggak pernah "aneh"/beda sendiri.
        const realIncome = (t.transactions || [])
          .filter(tx => tx.type === 'masuk')
          .reduce((sum, tx) => sum + Number(tx.amount), 0)

        const categories = (b.budget.categories || []).map(cat => {
          const total = Math.round(realIncome * (cat.percentage / 100))
          const used = cat.used || 0
          const remaining = Math.max(0, total - used)
          const status = total > 0 ? Math.round((used / total) * 100) : 0
          return {
            ...cat, total, used, remaining, status,
            over: status > 100,                          // kebablasan dari alokasi
            done: status >= 95 && status <= 100,          // pas/hampir pas kena target
            warning: status >= 80 && status < 95,         // hampir habis, belum lewat
          }
        })

        setBudget({ ...b.budget, totalIncome: realIncome, categories })
      })
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

        {/* Total income — otomatis dari transaksi, tidak bisa diubah manual */}
        <div style={{ padding:'0 var(--page-padding) 16px' }}>
          <div
            style={{ width:'100%', background:'var(--gradient-main)', color:'white', borderRadius:'var(--radius)', padding:'clamp(14px,3vw,18px) 20px', textAlign:'center', fontWeight:800, fontSize:'clamp(13px,3.5vw,15px)', boxShadow:'0 6px 24px rgba(124,58,237,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
          >
            <span>💵 Total Pemasukan: Rp {(budget.totalIncome || 0).toLocaleString('id-ID')}</span>
          </div>
          <div style={{ textAlign:'center', fontSize:11, color:'var(--text-muted)', marginTop:6 }}>
            Dihitung otomatis dari transaksi pemasukanmu
          </div>
        </div>

        {/* Budget cards */}
        <div style={{ padding:'0 var(--page-padding)' }}>
          {budget.categories?.map(cat => <BudgetCard key={cat.name} cat={cat}/>)}
        </div>

        {/* Alert */}
        {budget.categories?.some(c => c.warning || c.over) && (() => {
          const overCat = budget.categories.find(c => c.over)
          const warnCat = budget.categories.find(c => c.warning)
          const target = overCat || warnCat
          return (
            <div style={{ margin:'8px var(--page-padding)', background: overCat ? '#FEF2F2' : '#FFFBEB', border:`1px solid ${overCat ? '#FECACA' : '#FDE68A'}`, borderRadius:'var(--radius-sm)', padding:'14px 16px', display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ fontSize:20, flexShrink:0 }}>⚠️</span>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color: overCat ? '#991B1B' : '#92400E' }}>
                  {overCat ? `Budget ${target.name.toLowerCase()} sudah kelebihan!` : `Budget ${target.name.toLowerCase()} hampir habis!`}
                </div>
                <div style={{ fontSize:13, color: overCat ? '#B91C1C' : '#B45309', marginTop:2 }}>
                  {overCat
                    ? `Kelebihan Rp ${((target.used||0)-(target.total||0)).toLocaleString('id-ID')}`
                    : `Sisa Rp ${(target.remaining||0).toLocaleString('id-ID')}`}
                </div>
              </div>
            </div>
          )
        })()}

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

      <BottomNav/>
    </div>
  )
}

function BudgetCard({ cat }) {
  const barPct = Math.min(cat.status || 0, 100) // bar tetap dibatasi 100% biar nggak meluber
  const colors = {
    'Kebutuhan': { bg:'#F5F3FF', border:'#DDD6FE', text:'#7C3AED', fill:'#7C3AED' },
    'Keinginan': { bg:'#FFFBEB', border:'#FDE68A', text:'#D97706', fill:'#F59E0B' },
    'Tabungan':  { bg:'#ECFDF5', border:'#A7F3D0', text:'#059669', fill:'#10B981' },
  }
  const c = cat.over
    ? { bg:'#FEF2F2', border:'#FECACA', text:'var(--danger)', fill:'var(--danger)' }
    : (colors[cat.name] || colors['Kebutuhan'])

  return (
    <div style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:'var(--radius)', padding:'clamp(14px,3vw,18px)', marginBottom:12 }}>
      <div className="flex justify-between items-center" style={{ marginBottom:12 }}>
        <div>
          <div style={{ fontWeight:800, fontSize:'clamp(14px,4vw,16px)', color:c.text }}>
            {cat.over ? '⚠ ' : cat.done ? '✓ ' : cat.warning ? '⚠ ' : '● '}{cat.name} · {cat.percentage}%
          </div>
          <div style={{ color:'var(--text-muted)', fontSize:12, marginTop:2 }}>
            Dipakai Rp {(cat.used || 0).toLocaleString('id-ID')}
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontWeight:900, fontSize:'clamp(18px,5vw,22px)', color:c.text }}>{cat.status || 0}%</div>
          {cat.over
            ? <div style={{ fontSize:11, color:'var(--danger)', fontWeight:700 }}>Melebihi budget ⚠️</div>
            : cat.done
              ? <div style={{ fontSize:11, color:'var(--success)', fontWeight:700 }}>Terpenuhi 🎉</div>
              : <div style={{ fontSize:11, color:'var(--text-muted)' }}>sisa Rp {(cat.remaining || 0).toLocaleString('id-ID')}</div>
          }
        </div>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width:`${barPct}%`, background: c.fill }}/>
      </div>
      <div className="flex justify-between" style={{ marginTop:8, fontSize:12, color:'var(--text-muted)' }}>
        <span>Rp {(cat.used || 0).toLocaleString('id-ID')}</span>
        <span>Rp {(cat.total || 0).toLocaleString('id-ID')}</span>
      </div>
      {cat.over && (
        <div style={{ marginTop:8, fontSize:11, color:'var(--danger)' }}>
          Kelebihan Rp {((cat.used || 0) - (cat.total || 0)).toLocaleString('id-ID')} dari alokasi
        </div>
      )}
    </div>
  )
}