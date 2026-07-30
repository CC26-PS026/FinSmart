import express from 'express'
import { pool } from '../config/db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// GET /simulations — ambil riwayat milik user, terbaru duluan
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM simulations WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    )
    res.json({ simulations: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Gagal mengambil riwayat simulasi.' })
  }
})

// POST /simulations — simpan simulasi baru
router.post('/', authMiddleware, async (req, res) => {
  const { label, modal, monthly, rate, years, result_total, result_profit, result_pct } = req.body
  if (modal == null || monthly == null || rate == null || years == null)
    return res.status(400).json({ message: 'modal, monthly, rate, dan years wajib diisi.' })
  try {
    const [ins] = await pool.query(
      `INSERT INTO simulations
         (user_id, label, modal, monthly, rate, years, result_total, result_profit, result_pct)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        req.user.id,
        label || null,
        modal, monthly, rate, years,
        result_total, result_profit, result_pct,
      ]
    )
    const [rows] = await pool.query('SELECT * FROM simulations WHERE id = ?', [ins.insertId])
    res.status(201).json({ simulation: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Gagal menyimpan simulasi.' })
  }
})

// DELETE /simulations/:id — hapus satu riwayat milik user
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const [exist] = await pool.query(
      'SELECT id FROM simulations WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    )
    if (!exist.length) return res.status(404).json({ message: 'Simulasi tidak ditemukan.' })
    await pool.query('DELETE FROM simulations WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus simulasi.' })
  }
})

export default router