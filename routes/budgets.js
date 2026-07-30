import express  from 'express'
import { pool } from '../config/db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Mapping kategori transaksi → budget category
function mapToBudgetCategory(txCategory) {
  const cat = (txCategory || '').toLowerCase()
  if (['tagihan','kesehatan','transportasi','transport','makanan','kebutuhan'].some(k => cat.includes(k)))
    return 'Kebutuhan'
  if (['belanja','hiburan','keinginan','kopi','restoran','hobi','lainnya'].some(k => cat.includes(k)))
    return 'Keinginan'
  if (['tabungan','investasi','nabung'].some(k => cat.includes(k)))
    return 'Tabungan'
  return 'Keinginan' // default — pengeluaran tak terduga lebih tepat masuk Keinginan
}

router.get('/current', authMiddleware, async (req, res) => {
  try {
    const month = new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })

    // Buat budget bulan ini jika belum ada
    let [budgets] = await pool.query(
      'SELECT * FROM budgets WHERE user_id = ? AND month = ?', [req.user.id, month]
    )
    if (!budgets.length) {
      const [r] = await pool.query(
        'INSERT INTO budgets (user_id, month, total_income) VALUES (?,?,?)', [req.user.id, month, 0]
      )
      await pool.query(
        `INSERT INTO budget_categories (budget_id, name, percentage, color) VALUES
         (?,'Kebutuhan',50,'#7C3AED'),(?,'Keinginan',30,'#F59E0B'),(?,'Tabungan',20,'#10B981')`,
        [r.insertId, r.insertId, r.insertId]
      );
      [budgets] = await pool.query('SELECT * FROM budgets WHERE id = ?', [r.insertId])
    }
    const b = budgets[0]

    // Ambil semua transaksi bulan ini
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const [transactions] = await pool.query(
      `SELECT category, amount, type FROM transactions
       WHERE user_id = ? AND DATE(date) BETWEEN ? AND ?`,
      [req.user.id, firstDay, lastDay]
    )

    // Hitung total pemasukan bulan ini jika total_income = 0
    let totalIncome = parseFloat(b.total_income) || 0
    if (totalIncome === 0) {
      totalIncome = transactions
        .filter(t => t.type === 'masuk')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    }

    // Hitung pengeluaran per budget category dari transaksi nyata
    const usedMap = { Kebutuhan: 0, Keinginan: 0, Tabungan: 0 }
    transactions
      .filter(t => t.type === 'keluar')
      .forEach(t => {
        const budgetCat = mapToBudgetCategory(t.category)
        usedMap[budgetCat] += parseFloat(t.amount)
      })

    // Ambil kategori budget
    const [cats] = await pool.query(
      'SELECT * FROM budget_categories WHERE budget_id = ?', [b.id]
    )

    const categories = cats.map(c => {
      const totalBudget = totalIncome > 0 ? (totalIncome * c.percentage) / 100 : 0
      const used        = usedMap[c.name] || 0
      const remaining   = Math.max(0, totalBudget - used)
      const status      = totalBudget > 0 ? Math.min(100, Math.round((used / totalBudget) * 100)) : 0
      return {
        id: c.id,
        name: c.name,
        percentage: c.percentage,
        used,
        total: totalBudget,
        remaining,
        color: c.color,
        status,
        warning: status >= 80 && status < 100,
        done: status >= 100,
      }
    })

    res.json({
      budget: {
        id: b.id,
        month: b.month,
        totalIncome,
        categories,
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Gagal mengambil data budget.' })
  }
})

router.get('/', authMiddleware, async (req, res) => {
  try {
    const [budgets] = await pool.query(
      'SELECT * FROM budgets WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]
    )
    res.json({ budgets })
  } catch (err) {
    res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

router.put('/', authMiddleware, async (req, res) => {
  const { totalIncome, categories } = req.body
  try {
    const month = new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    const [budgets] = await pool.query(
      'SELECT * FROM budgets WHERE user_id = ? AND month = ?', [req.user.id, month]
    )
    if (!budgets.length)
      return res.status(404).json({ message: 'Budget bulan ini tidak ditemukan.' })
    const b = budgets[0]

    if (totalIncome !== undefined)
      await pool.query('UPDATE budgets SET total_income = ? WHERE id = ?', [totalIncome, b.id])

    if (categories?.length) {
      for (const cat of categories) {
        if (cat.id) await pool.query(
          'UPDATE budget_categories SET percentage=?, color=? WHERE id=? AND budget_id=?',
          [cat.percentage ?? 0, cat.color ?? '#7C3AED', cat.id, b.id]
        )
      }
    }
    res.json({ message: 'Budget berhasil diperbarui.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Gagal mengupdate budget.' })
  }
})

export default router