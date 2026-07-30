import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { simulationApi } from '../api'
import { useToast } from '../hooks/useToast'
import BottomNav from '../components/BottomNav'

const fmtM   = (v) => v >= 1000000 ? `${(v / 1000000).toFixed(1).replace('.', ',')} Jt` : `${(v / 1000).toFixed(0)} Rb`
const fmtPct = (v) => `${Number(v).toFixed(1)}%`

export default function Simulation() {
  const navigate  = useNavigate()
  const toast     = useToast()

  const [modal,   setModal]   = useState(1000000)
  const [monthly, setMonthly] = useState(500000)
  const [rate,    setRate]    = useState(12)
  const [years,   setYears]   = useState(5)

  const [saving,      setSaving]      = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history,     setHistory]     = useState([])
  const [histLoading, setHistLoading] = useState(false)
  const [labelInput,  setLabelInput]  = useState('')
  const [showLabel,   setShowLabel]   = useState(false)

  const result = useMemo(() => {
    const r = rate / 100 / 12, n = years * 12
    const fvModal   = modal * Math.pow(1 + r, n)
    const fvMonthly = r === 0 ? monthly * n : monthly * ((Math.pow(1 + r, n) - 1) / r)
    const total         = fvModal + fvMonthly
    const totalInvested = modal + monthly * n
    const profit        = total - totalInvested
    const pct           = ((profit / totalInvested) * 100).toFixed(1)
    const chartData     = Array.from({ length: years + 1 }, (_, y) => {
      const mn  = y * 12
      const val = modal * Math.pow(1 + r, mn) +
                  (r === 0 ? monthly * mn : monthly * ((Math.pow(1 + r, mn) - 1) / r))
      return { year: `Thn ${y}`, value: Math.round(val) }
    })
    return { total: Math.round(total), profit: Math.round(profit), pct, chartData }
  }, [modal, monthly, rate, years])

  const loadHistory = useCallback(async () => {
    setHistLoading(true)
    try {
      const data = await simulationApi.getAll()
      setHistory(data.simulations || [])
    } catch {
      toast('Gagal memuat riwayat simulasi', 'error')
    } finally {
      setHistLoading(false)
    }
  }, [toast])

  useEffect(() => { loadHistory() }, [loadHistory])

  const handleSave = async () => {
    setSaving(true)
    try {
      await simulationApi.save({
        label:         labelInput.trim() || null,
        modal, monthly, rate, years,
        result_total:  result.total,
        result_profit: result.profit,
        result_pct:    result.pct,
      })
      toast('Simulasi disimpan', 'success')
      setShowLabel(false)
      setLabelInput('')
      loadHistory()
    } catch {
      toast('Gagal menyimpan simulasi', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await simulationApi.delete(id)
      setHistory(prev => prev.filter(s => s.id !== id))
      toast('Riwayat dihapus', 'success')
    } catch {
      toast('Gagal menghapus riwayat', 'error')
    }
  }

  const handleLoad = (s) => {
    setModal(Number(s.modal))
    setMonthly(Number(s.monthly))
    setRate(Number(s.rate))
    setYears(Number(s.years))
    setShowHistory(false)
    toast('Simulasi dimuat', 'success')
  }

  return (
    <div className="app-shell">
      <div className="page">

        <div className="flex items-center gap-12" style={{ padding:'clamp(40px,8vw,52px) var(--page-padding) 16px' }}>
          <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
          <div style={{ flex:1 }}>
            <h1 className="page-title">Simulasi Investasi</h1>
            <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:2 }}>Hitung potensi pertumbuhanmu</p>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            style={{ position:'relative', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'8px 13px', fontSize:13, fontWeight:700, cursor:'pointer', color:'var(--text)', fontFamily:'var(--font-body)' }}
          >
            Riwayat
            {history.length > 0 && (
              <span style={{ position:'absolute', top:-6, right:-6, background:'var(--primary)', color:'white', borderRadius:'50%', fontSize:10, fontWeight:800, width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {history.length}
              </span>
            )}
          </button>
        </div>

        <div style={{ padding:'0 var(--page-padding)' }}>
          <div className="card animate-fadeup-1" style={{ marginBottom:14 }}>
            <SliderInput label="Modal Awal"       value={modal}   min={100000} max={10000000} step={100000} onChange={setModal}   format={fmtM}/>
            <SliderInput label="Investasi/Bulan"  value={monthly} min={50000}  max={5000000}  step={50000}  onChange={setMonthly} format={fmtM}/>
            <SliderInput label="Return/Tahun (%)" value={rate}    min={4}      max={30}       step={1}      onChange={setRate}    format={v => `${v}%`}/>
            <SliderInput label="Jangka Waktu"     value={years}   min={1}      max={30}       step={1}      onChange={setYears}   format={v => `${v} Tahun`} accent/>
          </div>

          <div className="card animate-fadeup-2" style={{ marginBottom:14 }}>
            <div className="section-title" style={{ marginBottom:12 }}>Proyeksi Pertumbuhan</div>
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={result.chartData}>
                <XAxis dataKey="year" tick={{ fontSize:11, fill:'#9CA3AF' }} axisLine={false} tickLine={false}/>
                <YAxis hide/>
                <Tooltip
                  contentStyle={{ borderRadius:10, border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.1)', fontSize:12 }}
                  formatter={v => [`Rp ${v.toLocaleString('id-ID')}`, 'Nilai']}
                />
                <Line type="monotone" dataKey="value" stroke="#7C3AED" strokeWidth={3} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="animate-fadeup-3" style={{ background:'var(--gradient-teal)', borderRadius:'var(--radius-lg)', padding:'clamp(20px,5vw,28px) var(--page-padding)', textAlign:'center', boxShadow:'0 8px 32px rgba(6,182,212,0.3)', marginBottom:14 }}>
            <div style={{ color:'rgba(255,255,255,0.8)', fontSize:'clamp(12px,3vw,14px)', marginBottom:8 }}>Estimasi Nilai Akhir</div>
            <div style={{ color:'white', fontSize:'clamp(26px,7vw,36px)', fontWeight:900, letterSpacing:'-0.02em', marginBottom:14, fontFamily:'var(--font-display)' }}>
              Rp {result.total.toLocaleString('id-ID')}
            </div>
            <div className="flex-center gap-8">
              {[`+${result.pct}%`, `+Rp ${(result.profit / 1000000).toFixed(1)}Jt`].map(t => (
                <span key={t} style={{ background:'rgba(255,255,255,0.2)', color:'white', borderRadius:50, padding:'6px 14px', fontSize:'clamp(12px,3vw,13px)', fontWeight:800 }}>{t}</span>
              ))}
            </div>
          </div>

          {showLabel ? (
            <div className="card" style={{ marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>Beri nama simulasi ini (opsional)</div>
              <input
                className="input-field"
                placeholder="cth: Target rumah 2030"
                value={labelInput}
                onChange={e => setLabelInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                style={{ marginBottom:10 }}
                autoFocus
              />
              <div className="flex gap-8">
                <button className="btn btn-primary" style={{ flex:1 }} onClick={handleSave} disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button className="btn btn-outline" style={{ flex:1 }} onClick={() => { setShowLabel(false); setLabelInput('') }}>
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-primary w-full"
              style={{ marginBottom:20, padding:14 }}
              onClick={() => setShowLabel(true)}
            >
              Simpan Simulasi Ini
            </button>
          )}
        </div>
      </div>

      <BottomNav/>

      {showHistory && (
        <div
          onClick={() => setShowHistory(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background:'white', borderRadius:'24px 24px 0 0', padding:'24px var(--page-padding) 32px', width:'100%', maxWidth:'var(--shell-width)', maxHeight:'75vh', display:'flex', flexDirection:'column' }}
          >
            <div className="flex justify-between items-center" style={{ marginBottom:18 }}>
              <h3 style={{ fontWeight:900, fontSize:18, fontFamily:'var(--font-display)', margin:0 }}>Riwayat Simulasi</h3>
              <button onClick={() => setShowHistory(false)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'var(--text-muted)' }}>x</button>
            </div>

            <div style={{ overflowY:'auto', flex:1 }}>
              {histLoading ? (
                <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Memuat...</div>
              ) : history.length === 0 ? (
                <div style={{ textAlign:'center', padding:40 }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>📂</div>
                  <div style={{ fontWeight:700, marginBottom:6 }}>Belum ada riwayat</div>
                  <div style={{ color:'var(--text-muted)', fontSize:13 }}>Simpan simulasi untuk melihatnya di sini</div>
                </div>
              ) : (
                history.map(s => (
                  <div key={s.id} style={{ background:'var(--surface)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-sm)', padding:'14px 16px', marginBottom:10 }}>
                    <div className="flex justify-between items-start" style={{ marginBottom:8 }}>
                      <div>
                        <div style={{ fontWeight:800, fontSize:14, color:'var(--text)', marginBottom:2 }}>
                          {s.label || 'Simulasi tanpa nama'}
                        </div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                          {new Date(s.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontWeight:900, fontSize:15, color:'var(--primary)' }}>{fmtM(s.result_total)}</div>
                        <div style={{ fontSize:11, color:'var(--success)', fontWeight:700 }}>+{fmtPct(s.result_pct)}</div>
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, fontSize:11, color:'var(--text-muted)', marginBottom:12 }}>
                      {[
                        { val: fmtM(s.modal),   label: 'Modal' },
                        { val: fmtM(s.monthly), label: '/Bulan' },
                        { val: `${s.rate}%`,    label: 'Return' },
                        { val: `${s.years} Thn`, label: 'Durasi' },
                      ].map(({ val, label }) => (
                        <div key={label}>
                          <span style={{ display:'block', fontWeight:700, color:'var(--text)', fontSize:12 }}>{val}</span>
                          {label}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-8">
                      <button className="btn btn-outline" style={{ flex:1, padding:'8px 0', fontSize:12 }} onClick={() => handleLoad(s)}>Muat</button>
                      <button className="btn btn-danger"  style={{ flex:1, padding:'8px 0', fontSize:12 }} onClick={() => handleDelete(s.id)}>Hapus</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SliderInput({ label, value, min, max, step, onChange, format, accent }) {
  const pct   = ((value - min) / (max - min)) * 100
  const color = accent ? 'var(--accent)' : 'var(--primary)'
  return (
    <div style={{ marginBottom:18 }}>
      <div className="flex justify-between" style={{ marginBottom:8 }}>
        <span style={{ fontSize:'clamp(12px,3vw,14px)', color:'var(--text-muted)', fontWeight:500 }}>{label}</span>
        <span style={{ fontSize:'clamp(12px,3vw,14px)', fontWeight:800, color }}>{format(value)}</span>
      </div>
      <div style={{ position:'relative', height:6, background:'var(--border)', borderRadius:3 }}>
        <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${pct}%`, background:color, borderRadius:3 }}/>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ position:'absolute', inset:0, width:'100%', opacity:0, cursor:'pointer', height:'100%' }}
        />
      </div>
    </div>
  )
}