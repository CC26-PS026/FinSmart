import express  from 'express'
import { pool } from '../config/db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// GET /v1/transactions — semua transaksi milik user, terbaru dulu
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC', [req.user.id]
    )
    res.json({ transactions })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Gagal mengambil data transaksi.' })
  }
})

// GET /v1/transactions/:id — detail satu transaksi
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Transaksi tidak ditemukan.' })
    res.json({ transaction: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Gagal mengambil detail transaksi.' })
  }
})

// POST /v1/transactions — buat transaksi baru
router.post('/', authMiddleware, async (req, res) => {
  const { id, title, category, amount, type, icon, date } = req.body

  if (!title || !category || amount === undefined || !type)
    return res.status(400).json({ message: 'Data transaksi tidak lengkap.' })

  if (!['masuk', 'keluar'].includes(type))
    return res.status(400).json({ message: 'Tipe transaksi tidak valid.' })

  try {
    const txId = id || crypto.randomUUID()
    const txDate = date ? new Date(date) : new Date()
    await pool.query(
      `INSERT INTO transactions (id, user_id, title, category, amount, type, icon, date)
       VALUES (?,?,?,?,?,?,?,?)`,
      [txId, req.user.id, title, category, Math.abs(amount), type, icon || '💰', txDate]
    )
    const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [txId])
    res.status(201).json({ message: 'Transaksi berhasil dicatat.', transaction: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Gagal menyimpan transaksi.', detail: err.message })
  }
})

// PUT /v1/transactions/:id — update transaksi
router.put('/:id', authMiddleware, async (req, res) => {
  const { title, category, amount, type, icon, date } = req.body

  try {
    const [existing] = await pool.query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]
    )
    if (!existing.length) return res.status(404).json({ message: 'Transaksi tidak ditemukan.' })

    await pool.query(
      `UPDATE transactions SET
        title = COALESCE(?, title),
        category = COALESCE(?, category),
        amount = COALESCE(?, amount),
        type = COALESCE(?, type),
        icon = COALESCE(?, icon),
        date = COALESCE(?, date)
       WHERE id = ? AND user_id = ?`,
      [title, category, amount !== undefined ? Math.abs(amount) : undefined, type, icon, date ? new Date(date) : undefined, req.params.id, req.user.id]
    )
    const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [req.params.id])
    res.json({ message: 'Transaksi berhasil diperbarui.', transaction: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Gagal memperbarui transaksi.' })
  }
})

// DELETE /v1/transactions/:id — hapus transaksi
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]
    )
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Transaksi tidak ditemukan.' })
    res.json({ message: 'Transaksi berhasil dihapus.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Gagal menghapus transaksi.' })
  }
})

export default router