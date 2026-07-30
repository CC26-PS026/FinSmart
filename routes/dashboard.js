import express  from 'express'
import { pool } from '../config/db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Helper: format Date ke 'YYYY-MM-DD' di timezone WIB (UTC+7)
function toWIBDateStr(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(date)
}

// Helper: dapatkan nama hari (Min/Sen/Sel/...) dari Date di WIB
const HARI = { Sunday:'Min', Monday:'Sen', Tuesday:'Sel', Wednesday:'Rab',
               Thursday:'Kam', Friday:'Jum', Saturday:'Sab' }
function toWIBDayName(date) {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', weekday: 'long' }).format(date)
  return HARI[name] || name
}

router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT SUM(CASE WHEN type='masuk' THEN amount ELSE 0 END) AS income,
              SUM(CASE WHEN type='keluar' THEN amount ELSE 0 END) AS expense,
              COUNT(*) AS total_transactions
       FROM transactions WHERE user_id = ?`, [req.user.id]
    )
    const income = parseFloat(rows[0].income || 0), expense = parseFloat(rows[0].expense || 0)
    res.json({ income, expense, balance: income - expense, totalTransactions: rows[0].total_transactions })
  } catch (err) { res.status(500).json({ message: 'Gagal mengambil data dashboard.' }) }
})

router.get('/chart', authMiddleware, async (req, res) => {
  try {
    // DATE_FORMAT memastikan MySQL return string 'YYYY-MM-DD' bukan Date object
    // pool sudah di-set timezone '+07:00' sehingga CURDATE() = tanggal WIB
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(DATE(date), '%Y-%m-%d') AS day_date,
              SUM(CASE WHEN type='keluar' THEN amount ELSE 0 END) AS amount
       FROM transactions
       WHERE user_id = ? AND DATE(date) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY day_date ORDER BY day_date ASC`, [req.user.id]
    )

    const chartData = []
    for (let i = 6; i >= 0; i--) {
      const d       = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateStr = toWIBDateStr(d)                        // 'YYYY-MM-DD' WIB
      const found   = rows.find(r => r.day_date === dateStr) // string vs string, tidak ada ambiguitas
      chartData.push({ day: toWIBDayName(d), amount: found ? parseFloat(found.amount) : 0 })
    }

    res.json({ chartData })
  } catch (err) {
    console.error('Chart error:', err)
    res.status(500).json({ message: 'Gagal mengambil data chart.' })
  }
})

export default router