import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import BottomNav from '../components/BottomNav'

const FAQ_DATA = [
  {
    category: '🚀 Memulai',
    items: [
      {
        q: 'Bagaimana cara membuat akun FinSmart?',
        a: 'Kamu bisa daftar dengan menekan tombol "Daftar Sekarang" di halaman utama. Isi nama, email, dan password kamu. Proses registrasi hanya butuh kurang dari 1 menit!'
      },
      {
        q: 'Apakah FinSmart gratis digunakan?',
        a: 'Ya! FinSmart sepenuhnya gratis untuk semua fitur utama, termasuk pencatatan transaksi, manajemen budget, dan edukasi keuangan.'
      },
      {
        q: 'Bagaimana cara login ke akun saya?',
        a: 'Masukkan email dan password yang sudah kamu daftarkan. Kamu juga bisa mengaktifkan PIN atau biometrik di menu Keamanan untuk login lebih cepat.'
      },
    ]
  },
  {
    category: '💸 Transaksi',
    items: [
      {
        q: 'Bagaimana cara mencatat transaksi?',
        a: 'Buka menu Transaksi, lalu tekan tombol "+" di pojok kanan bawah. Isi nominal, kategori, dan catatan opsional. Transaksimu akan langsung tercatat dan mempengaruhi dashboard.'
      },
      {
        q: 'Bisakah saya menghapus atau mengedit transaksi?',
        a: 'Ya, kamu bisa menekan transaksi yang ingin diedit atau dihapus di halaman Riwayat Transaksi, lalu pilih opsi yang sesuai.'
      },
      {
        q: 'Apa itu kategori transaksi?',
        a: 'Kategori membantu kamu mengelompokkan pengeluaran seperti Makan, Transport, Hiburan, dll. Ini memudahkan analisis ke mana uangmu pergi setiap bulannya.'
      },
    ]
  },
  {
    category: '📊 Budget',
    items: [
      {
        q: 'Bagaimana cara mengatur budget bulanan?',
        a: 'Buka menu Budget, lalu tekan "Buat Budget Baru". Pilih kategori dan tentukan batas pengeluaran. FinSmart akan mengingatkanmu jika hampir melebihi batas.'
      },
      {
        q: 'Apa yang terjadi jika budget saya melebihi batas?',
        a: 'Kamu akan mendapat notifikasi peringatan. Budget yang melebihi batas akan ditandai merah di dashboard agar mudah terlihat.'
      },
    ]
  },
  {
    category: '🔒 Keamanan & Akun',
    items: [
      {
        q: 'Bagaimana cara mengubah password?',
        a: 'Buka Profil → Keamanan → Ubah Password. Masukkan password lama dan password baru minimal 6 karakter.'
      },
      {
        q: 'Apakah data saya aman di FinSmart?',
        a: 'Keamanan datamu adalah prioritas kami. Semua data dienkripsi dan disimpan secara aman. Kami tidak pernah menjual data pengguna kepada pihak ketiga.'
      },
      {
        q: 'Bagaimana cara mengaktifkan autentikasi biometrik?',
        a: 'Buka Profil → Keamanan → Biometrik. Aktifkan tombol, lalu ikuti instruksi untuk mendaftarkan sidik jari atau Face ID di perangkatmu.'
      },
    ]
  },
]

const CONTACT_OPTIONS = [
  { name: 'Yusuf Alakil', email: 'myusufalakil@gmail.com', wa: '+62 857-1159-4005', waNum: '6285711594005' },
  { name: 'Cipasari Ambar', email: 'cipasariambar10@gmail.com', wa: '+62 878-7276-1950', waNum: '6287872761950' },
  { name: 'Fadil', email: 'fadillsprmn@gmail.com', wa: '+62 857-1182-2905', waNum: '6285711822905' },
  { name: 'Rangga', email: 'ranggadanadyaksa81@gmail.com', wa: '+62 882-1279-0810', waNum: '6288212790810' },
  { name: 'Farell', email: 'treecamat@gmail.com', wa: '+62 877-8018-2422', waNum: '6287780182422' },
]

export default function BantuanFAQ() {
  const navigate = useNavigate()
  const toast = useToast()
  const [openItem, setOpenItem] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('faq') // faq | contact

  const toggle = (key) => setOpenItem(prev => prev === key ? null : key)

  const filteredFAQ = FAQ_DATA.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !searchQuery || item.q.toLowerCase().includes(searchQuery.toLowerCase()) || item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0 && (!activeCategory || cat.category === activeCategory))

  const handleContact = (action) => {
    const fn = action
    if (fn) fn()
  }

  return (
    <div className="app-shell">
      <div className="page">
        {/* Header */}
        <div style={{ background: 'var(--gradient-main)', padding: 'clamp(40px,8vw,56px) var(--page-padding) clamp(24px,5vw,32px)', borderRadius: '0 0 var(--radius-xl) var(--radius-xl)', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <span style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <button onClick={() => navigate('/profile')} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 38, height: 38, cursor: 'pointer', fontSize: 20, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>❓</div>
            <h2 style={{ color: 'white', fontSize: 'clamp(18px,5vw,22px)', fontWeight: 900, fontFamily: 'var(--font-display)', marginBottom: 6 }}>Bantuan & FAQ</h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>Temukan jawaban atas pertanyaanmu</p>
          </div>

          {/* Search */}
          <div style={{ marginTop: 18, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari pertanyaan..."
              style={{
                width: '100%', padding: '12px 14px 12px 40px', border: 'none',
                borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: 14,
                background: 'rgba(255,255,255,0.92)', color: 'var(--text)', outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ padding: '0 var(--page-padding)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'white', borderRadius: 'var(--radius-sm)', padding: 4, marginBottom: 16, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
            {[{ id: 'faq', label: '❓ FAQ' }, { id: 'contact', label: '📞 Hubungi Kami' }].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, padding: '10px 8px', border: 'none', borderRadius: 'calc(var(--radius-sm) - 4px)',
                  cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
                  background: activeTab === tab.id ? 'var(--gradient-btn)' : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                  boxShadow: activeTab === tab.id ? '0 2px 8px rgba(124,58,237,0.25)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'faq' && (
            <>
              {/* Category Filter */}
              {!searchQuery && (
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 14, scrollbarWidth: 'none' }}>
                  <button
                    onClick={() => setActiveCategory(null)}
                    style={{
                      flexShrink: 0, padding: '7px 14px', border: '1.5px solid', borderRadius: 20,
                      cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
                      borderColor: activeCategory === null ? 'var(--primary)' : 'var(--border)',
                      background: activeCategory === null ? 'var(--primary-xlight)' : 'white',
                      color: activeCategory === null ? 'var(--primary)' : 'var(--text-muted)'
                    }}
                  >
                    Semua
                  </button>
                  {FAQ_DATA.map(cat => (
                    <button
                      key={cat.category}
                      onClick={() => setActiveCategory(activeCategory === cat.category ? null : cat.category)}
                      style={{
                        flexShrink: 0, padding: '7px 14px', border: '1.5px solid', borderRadius: 20,
                        cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
                        borderColor: activeCategory === cat.category ? 'var(--primary)' : 'var(--border)',
                        background: activeCategory === cat.category ? 'var(--primary-xlight)' : 'white',
                        color: activeCategory === cat.category ? 'var(--primary)' : 'var(--text-muted)'
                      }}
                    >
                      {cat.category}
                    </button>
                  ))}
                </div>
              )}

              {/* FAQ Accordion */}
              {filteredFAQ.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Tidak ditemukan</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Coba kata kunci lain atau hubungi tim kami</p>
                </div>
              ) : (
                filteredFAQ.map(cat => (
                  <div key={cat.category} style={{ marginBottom: 18 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {cat.category}
                    </div>
                    {cat.items.map((item, idx) => {
                      const key = `${cat.category}-${idx}`
                      const isOpen = openItem === key
                      return (
                        <div key={key} style={{ background: 'white', borderRadius: 'var(--radius-sm)', marginBottom: 8, border: isOpen ? '1.5px solid var(--primary-light)' : '1px solid var(--border-light)', boxShadow: isOpen ? 'var(--shadow-sm)' : 'none', overflow: 'hidden', transition: 'all 0.2s' }}>
                          <button
                            onClick={() => toggle(key)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}
                          >
                            <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: 'var(--text)', lineHeight: 1.4 }}>{item.q}</span>
                            <span style={{ fontSize: 18, color: 'var(--primary)', transition: 'transform 0.25s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', flexShrink: 0 }}>⌄</span>
                          </button>
                          {isOpen && (
                            <div style={{ padding: '0 16px 16px', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, animation: 'fadeIn 0.2s ease', borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
                              {item.a}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'contact' && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <div className="card" style={{ marginBottom: 14, padding: 'clamp(16px,4vw,22px)', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>👋</div>
                <div style={{ fontWeight: 800, fontSize: 16, fontFamily: 'var(--font-display)', marginBottom: 6 }}>Ada yang bisa kami bantu?</div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>Tim support FinSmart siap membantu kamu setiap hari pukul 08.00–22.00 WIB</p>
              </div>

              {CONTACT_OPTIONS.map(opt => (
                <div key={opt.name} style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', marginBottom: 8, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', fontWeight: 800, fontSize: 15, color: 'var(--text)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>👤</span> {opt.name}
                  </div>
                  <button
                    onClick={() => window.location.href = `mailto:${opt.email}?subject=Bantuan%20FinSmart`}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}
                  >
                    <span style={{ fontSize: 20 }}>📧</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{opt.email}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 18 }}>›</span>
                  </button>
                  <button
                    onClick={() => window.open(`https://wa.me/${opt.waNum}?text=Halo%20FinSmart%2C%20saya%20butuh%20bantuan`, '_blank', 'noopener')}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}
                  >
                    <span style={{ fontSize: 20 }}>📱</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{opt.wa}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 18 }}>›</span>
                  </button>
                </div>
              ))}

              {/* Response time info */}
              <div style={{ background: 'var(--success-light)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginTop: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>⏱️</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#065F46', marginBottom: 2 }}>Waktu Respons</div>
                  <div style={{ fontSize: 13, color: '#065F46', opacity: 0.85 }}>Email: 1×24 jam • WhatsApp: &lt; 1 jam</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ height: 20 }} />
        </div>
      </div>
      <BottomNav />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}