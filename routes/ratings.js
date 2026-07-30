import express  from 'express'
import { pool } from '../config/db.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.post('/', authMiddleware, async (req, res) => {
  const { score, comment, aspects } = req.body
  if (!score || score < 1 || score > 5) return res.status(400).json({ message: 'Score harus antara 1-5.' })

  // Validasi aspek jika dikirim
  const ASPECT_KEYS = ['design', 'ease', 'feature', 'performance']
  const aspectValues = {}
  if (aspects && typeof aspects === 'object') {
    for (const key of ASPECT_KEYS) {
      const val = aspects[key]
      if (val !== undefined && val !== null && val !== 0) {
        if (!Number.isInteger(val) || val < 1 || val > 5)
          return res.status(400).json({ message: `Nilai aspek '${key}' harus antara 1-5.` })
        aspectValues[key] = val
      } else {
        aspectValues[key] = null
      }
    }
  } else {
    ASPECT_KEYS.forEach(k => { aspectValues[k] = null })
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO ratings (user_id, score, comment, aspect_design, aspect_ease, aspect_feature, aspect_performance)
       VALUES (?,?,?,?,?,?,?)`,
      [
        req.user.id,
        score,
        comment || '',
        aspectValues.design,
        aspectValues.ease,
        aspectValues.feature,
        aspectValues.performance,
      ]
    )
    res.status(201).json({
      id: result.insertId,
      score,
      comment,
      aspects: aspectValues,
    })
  } catch (err) {
    console.error('Rating submit error:', err)
    res.status(500).json({ message: 'Gagal menyimpan rating.' })
  }
})

router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT r.*, u.name, u.email FROM ratings r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC`)
    const [avg]  = await pool.query('SELECT AVG(score) as average FROM ratings')

    // Hitung rata-rata per aspek
    const [aspectAvg] = await pool.query(`
      SELECT
        ROUND(AVG(aspect_design), 1)      AS avg_design,
        ROUND(AVG(aspect_ease), 1)        AS avg_ease,
        ROUND(AVG(aspect_feature), 1)     AS avg_feature,
        ROUND(AVG(aspect_performance), 1) AS avg_performance
      FROM ratings
    `)

    res.json({
      ratings: rows,
      average: parseFloat(avg[0].average || 0).toFixed(1),
      aspect_averages: aspectAvg[0],
    })
  } catch (err) {
    console.error('Rating get error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

export default router