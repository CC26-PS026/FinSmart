import express  from 'express'
import { pool } from '../config/db.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authMiddleware, async (req, res) => {
  const { category } = req.query
  try {
    const params = [], query = category
      ? 'SELECT * FROM articles WHERE category = ? ORDER BY created_at DESC'
      : 'SELECT * FROM articles ORDER BY created_at DESC'
    if (category) params.push(category.toUpperCase())
    const [rows] = await pool.query(query, params)
    const now = Date.now()
    res.json({ articles: rows.map(a => ({ ...a, daysAgo: Math.floor((now - new Date(a.created_at)) / 86400000) })) })
  } catch (err) { res.status(500).json({ message: 'Gagal mengambil artikel.' }) }
})

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM articles WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ message: 'Artikel tidak ditemukan.' })
    const article = rows[0]
    const daysAgo = Math.floor((Date.now() - new Date(article.created_at)) / 86400000)
    res.json({ ...article, daysAgo })
  } catch (err) { res.status(500).json({ message: 'Terjadi kesalahan server.' }) }
})

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  const { title, content, category, read_time, image, bg_color } = req.body
  if (!title || !category) return res.status(400).json({ message: 'title dan category wajib diisi.' })
  try {
    const [result] = await pool.query(
      'INSERT INTO articles (title, content, category, read_time, image, bg_color) VALUES (?,?,?,?,?,?)',
      [title, content || '', category.toUpperCase(), read_time || 5, image || '📄', bg_color || '#EDE9FE']
    )
    const [rows] = await pool.query('SELECT * FROM articles WHERE id = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ message: 'Gagal menyimpan artikel.' }) }
})

// ✅ FIX 4: validasi wajib + fallback ke nilai lama agar field tidak jadi NULL di DB
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { title, content, category, read_time, image, bg_color } = req.body
  if (!title || !category) return res.status(400).json({ message: 'title dan category wajib diisi.' })
  try {
    const [existing] = await pool.query('SELECT * FROM articles WHERE id = ?', [req.params.id])
    if (!existing.length) return res.status(404).json({ message: 'Artikel tidak ditemukan.' })
    const cur = existing[0]
    await pool.query(
      'UPDATE articles SET title=?, content=?, category=?, read_time=?, image=?, bg_color=? WHERE id=?',
      [
        title,
        content   ?? cur.content,
        category.toUpperCase(),
        read_time ?? cur.read_time,
        image     ?? cur.image,
        bg_color  ?? cur.bg_color,
        req.params.id,
      ]
    )
    const [rows] = await pool.query('SELECT * FROM articles WHERE id = ?', [req.params.id])
    res.json(rows[0])
  } catch (err) { res.status(500).json({ message: 'Gagal mengupdate artikel.' }) }
})

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM articles WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ message: 'Gagal menghapus artikel.' }) }
})

export default router