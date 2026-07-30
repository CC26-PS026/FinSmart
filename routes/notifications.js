import express  from 'express'
import { pool } from '../config/db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [req.user.id])
    res.json({ notifications: rows })
  } catch (err) { res.status(500).json({ message: 'Terjadi kesalahan server.' }) }
})

router.post('/', authMiddleware, async (req, res) => {
  const { type, title, body } = req.body
  if (!title) return res.status(400).json({ message: 'title wajib diisi.' })
  try {
    const [result] = await pool.query('INSERT INTO notifications (user_id, type, title, body) VALUES (?,?,?,?)', [req.user.id, type || 'info', title, body || ''])
    res.status(201).json({ id: result.insertId, type, title, body })
  } catch (err) { res.status(500).json({ message: 'Gagal menyimpan notifikasi.' }) }
})

router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ message: 'Terjadi kesalahan server.' }) }
})

router.delete('/', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE user_id = ?', [req.user.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ message: 'Gagal menghapus notifikasi.' }) }
})

router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ message: 'Terjadi kesalahan server.' }) }
})

export default router