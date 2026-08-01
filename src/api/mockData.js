// Mock data when API is not available
export const mockUser = {
  id: '1',
  name: 'Nama Pengguna',
  email: 'nama@email.com',
  avatar: null,
  stats: {
    transactions: 128,
    budgetOk: 89,
    articles: 12,
  }
}

export const mockTransactions = [
  { id: '1', title: 'Makan Siang', category: 'Makanan & Minuman', amount: -35000, type: 'keluar', date: new Date().toISOString(), icon: '🍜' },
  { id: '2', title: 'Belanja Online', category: 'Belanja', amount: -120000, type: 'keluar', date: new Date(Date.now() - 86400000).toISOString(), icon: '🛒' },
  { id: '3', title: 'Gaji Bulanan', category: 'Pemasukan', amount: 6500000, type: 'masuk', date: new Date(Date.now() - 86400000).toISOString(), icon: '💰' },
  { id: '4', title: 'Transport', category: 'Transport', amount: -25000, type: 'keluar', date: new Date(Date.now() - 172800000).toISOString(), icon: '🚌' },
  { id: '5', title: 'Kopi', category: 'Makanan & Minuman', amount: -45000, type: 'keluar', date: new Date(Date.now() - 172800000).toISOString(), icon: '☕' },
  { id: '6', title: 'Freelance', category: 'Pemasukan', amount: 1500000, type: 'masuk', date: new Date(Date.now() - 259200000).toISOString(), icon: '💻' },
  { id: '7', title: 'Listrik', category: 'Tagihan', amount: -250000, type: 'keluar', date: new Date(Date.now() - 259200000).toISOString(), icon: '⚡' },
  { id: '8', title: 'Netflix', category: 'Hiburan', amount: -54000, type: 'keluar', date: new Date(Date.now() - 345600000).toISOString(), icon: '🎬' },
]

export const mockBudget = {
  month: 'Mar 2025',
  totalIncome: 8000000,
  categories: [
    { name: 'Kebutuhan', percentage: 50, used: 2100000, total: 4000000, remaining: 1150000, color: '#7C3AED', status: 65 },
    { name: 'Keinginan', percentage: 30, used: 1716000, total: 2400000, remaining: 234000, color: '#F59E0B', status: 88, warning: true },
    { name: 'Tabungan', percentage: 20, used: 1300000, total: 1600000, remaining: 0, color: '#10B981', status: 100, done: true },
  ]
}

export const mockArticles = [
  { id: '1', title: 'Mulai Investasi Rp 100rb/Bulan', category: 'INVESTASI', readTime: 5, daysAgo: 2, image: '📈', bg: '#EDE9FE' },
  { id: '2', title: 'Bahaya Paylater untuk Gaya Hidup', category: 'PAY LATER', readTime: 4, daysAgo: 5, image: '⚠️', bg: '#FEF3C7' },
  { id: '3', title: 'Metode 50/30/20 untuk Pemula', category: 'BUDGETING', readTime: 7, daysAgo: 7, image: '💡', bg: '#ECFDF5' },
  { id: '4', title: 'Cara Nabung Rp 1 Juta per Bulan', category: 'TABUNGAN', readTime: 6, daysAgo: 10, image: '🏦', bg: '#EFF6FF' },
  { id: '5', title: 'Reksa Dana vs Saham: Mana Lebih Baik?', category: 'INVESTASI', readTime: 8, daysAgo: 12, image: '📊', bg: '#EDE9FE' },
]

export const mockChartData = [
  { day: 'Sen', amount: 85000 },
  { day: 'Sel', amount: 120000 },
  { day: 'Rab', amount: 65000 },
  { day: 'Kam', amount: 200000 },
  { day: 'Jum', amount: 95000 },
  { day: 'Sab', amount: 145000 },
  { day: 'Min', amount: 75000 },
]

// Setiap kategori pengeluaran dikelompokkan ke salah satu dari 3 grup 50/30/20
// (dipakai untuk pengelompokan visual di form "Catat Transaksi")
export const categories = [
  { label: 'Makanan',     icon: '🍜', color:'#F97316', value: 'makanan',     group: 'kebutuhan', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80&h=80&fit=crop&auto=format' },
  { label: 'Transportasi',icon: '🚌', color:'#3B82F6', value: 'transport',   group: 'kebutuhan', img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=80&h=80&fit=crop&auto=format' },
  { label: 'Tagihan',     icon: '📄', color:'#7C3AED', value: 'tagihan',     group: 'kebutuhan', img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=80&h=80&fit=crop&auto=format' },
  { label: 'Kesehatan',   icon: '💊', color:'#EF4444', value: 'kesehatan',   group: 'kebutuhan', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=80&h=80&fit=crop&auto=format' },
  { label: 'Hiburan',     icon: '🎬', color:'#EC4899', value: 'hiburan',     group: 'keinginan', img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=80&h=80&fit=crop&auto=format' },
  { label: 'Belanja',     icon: '🛒', color:'#D97706', value: 'belanja',     group: 'keinginan', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=80&h=80&fit=crop&auto=format' },
  { label: 'Hobi',        icon: '🎮', color:'#8B5CF6', value: 'hobi',        group: 'keinginan', img: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=80&h=80&fit=crop&auto=format' },
  { label: 'Lainnya',     icon: '📦', color:'#6B7280', value: 'lainnya',     group: 'keinginan', img: 'https://images.unsplash.com/photo-1495461199391-8c39ab674f8f?w=80&h=80&fit=crop&auto=format' },
  { label: 'Tabungan',    icon: '🐷', color:'#10B981', value: 'tabungan',    group: 'tabungan',  img: 'https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=80&h=80&fit=crop&auto=format' },
  { label: 'Investasi',   icon: '📈', color:'#059669', value: 'investasi',   group: 'tabungan',  img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=80&h=80&fit=crop&auto=format' },
]

// Label & warna tiap grup — dipakai untuk render section header di form transaksi
export const categoryGroups = [
  { key: 'kebutuhan', label: 'Kebutuhan', emoji: '🧾', color: '#7C3AED' },
  { key: 'keinginan', label: 'Keinginan', emoji: '🎯', color: '#D97706' },
  { key: 'tabungan',  label: 'Tabungan',  emoji: '💰', color: '#059669' },
]

// Kategori khusus untuk transaksi Pemasukan (+)
export const incomeCategories = [
  { label: 'Gaji', icon: '💼', color:'#7C3AED', value: 'gaji',       img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=80&h=80&fit=crop&auto=format' },
  { label: 'Bonus', icon: '🎁', color:'#EC4899', value: 'bonus',      img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=80&h=80&fit=crop&auto=format' },
  { label: 'Hadiah', icon: '🎉', color:'#F59E0B', value: 'hadiah',     img: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=80&h=80&fit=crop&auto=format' },
  { label: 'Investasi', icon: '📈', color:'#059669', value: 'investasi', img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=80&h=80&fit=crop&auto=format' },
  { label: 'Freelance', icon: '💻', color:'#06B6D4', value: 'freelance', img: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=80&h=80&fit=crop&auto=format' },
  { label: 'Lainnya', icon: '📦', color:'#6B7280', value: 'lainnya',    img: 'https://images.unsplash.com/photo-1495461199391-8c39ab674f8f?w=80&h=80&fit=crop&auto=format' },
]