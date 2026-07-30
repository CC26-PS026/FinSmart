import express  from 'express'
import bcrypt   from 'bcryptjs'
import jwt      from 'jsonwebtoken'
import { pool } from '../config/db.js'
import { authMiddleware } from '../middleware/auth.js'
import { authLimiter }   from '../middleware/rateLimiter.js'

const router = express.Router()

// ── Validasi ────────────────────────────────────────────────────────
const EMAIL_RE   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const STRONG_PW  = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/   // min 8 char, huruf + angka

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// ─────────────────────────────────────────────────────────────────────
// POST /auth/register  (user biasa)
// ─────────────────────────────────────────────────────────────────────
router.post('/register', authLimiter, async (req, res) => {
  const { name, email, password } = req.body
  if (!name?.trim() || !email?.trim() || !password)
    return res.status(400).json({ message: 'Nama, email, dan password wajib diisi.' })
  if (!EMAIL_RE.test(email))
    return res.status(400).json({ message: 'Format email tidak valid.' })
  if (!STRONG_PW.test(password))
    return res.status(400).json({ message: 'Password minimal 8 karakter, mengandung huruf dan angka.' })

  try {
    const [exist] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()])
    if (exist.length > 0) return res.status(409).json({ message: 'Email sudah terdaftar.' })

    const hashed = await bcrypt.hash(password, 12)
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase(), hashed, 'user']
    )
    const user  = { id: result.insertId, name: name.trim(), email: email.toLowerCase(), role: 'user' }
    const token = signToken(user)

    const monthLabel = new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    const [bResult] = await pool.query(
      'INSERT INTO budgets (user_id, month, total_income) VALUES (?, ?, ?)', [user.id, monthLabel, 0]
    )
    await pool.query(
      `INSERT INTO budget_categories (budget_id, name, percentage, color) VALUES
       (?,  'Kebutuhan', 50, '#7C3AED'),
       (?,  'Keinginan', 30, '#F59E0B'),
       (?,  'Tabungan',  20, '#10B981')`,
      [bResult.insertId, bResult.insertId, bResult.insertId]
    )
    res.status(201).json({ token, user })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

// ─────────────────────────────────────────────────────────────────────
// POST /auth/admin-register  (admin — butuh invite code)
// ─────────────────────────────────────────────────────────────────────
router.post('/admin-register', authLimiter, async (req, res) => {
  const { name, email, password, inviteCode } = req.body
  if (!name?.trim() || !email?.trim() || !password || !inviteCode)
    return res.status(400).json({ message: 'Semua field wajib diisi.' })
  if (!EMAIL_RE.test(email))
    return res.status(400).json({ message: 'Format email tidak valid.' })
  if (!STRONG_PW.test(password))
    return res.status(400).json({ message: 'Password minimal 8 karakter, mengandung huruf dan angka.' })

  // Validasi invite code
  const VALID_CODE = process.env.ADMIN_INVITE_CODE
  if (!VALID_CODE || inviteCode !== VALID_CODE)
    return res.status(403).json({ message: 'Kode undangan admin tidak valid.' })

  try {
    const [exist] = await pool.query('SELECT id, role FROM users WHERE email = ?', [email.toLowerCase()])
    if (exist.length > 0)
      return res.status(409).json({ message: 'Email sudah terdaftar.' })

    const hashed = await bcrypt.hash(password, 12)
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase(), hashed, 'admin']
    )
    const user  = { id: result.insertId, name: name.trim(), email: email.toLowerCase(), role: 'admin' }
    const token = signToken(user)
    res.status(201).json({ token, user })
  } catch (err) {
    console.error('Admin register error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

// ─────────────────────────────────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────────────────────────────────
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body
  if (!email?.trim() || !password)
    return res.status(400).json({ message: 'Email dan password wajib diisi.' })
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()])
    if (rows.length === 0) {
      await bcrypt.hash('dummy_to_prevent_timing_attack', 12)
      return res.status(401).json({ message: 'Email atau password salah.' })
    }
    const user  = rows[0]
    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ message: 'Email atau password salah.' })

    // Cek apakah akun dinonaktifkan (khusus admin)
    if ((user.role === 'admin') && user.is_active === 0)
      return res.status(403).json({ message: 'Akun admin Anda telah dinonaktifkan. Hubungi Super Admin.' })

    // Cek apakah 2FA aktif
    if (user.two_fa_enabled) {
      const otp     = generateOtp()
      const expires = new Date(Date.now() + 10 * 60 * 1000)
      await pool.query('DELETE FROM password_resets WHERE email = ?', [user.email])
      await pool.query(
        'INSERT INTO password_resets (email, otp, expires_at) VALUES (?, ?, ?)',
        [user.email, otp, expires]
      )
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { name: 'FinSmart', email: process.env.BREVO_SENDER_EMAIL },
          to: [{ email: user.email }],
          subject: '🛡️ Kode Login Verifikasi 2 Langkah FinSmart',
          htmlContent: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#F9FAFB;border-radius:16px">
              <div style="text-align:center;margin-bottom:24px">
                <span style="font-size:32px;font-weight:900;color:#1E1B4B">Fin<span style="color:#7C3AED">Smart</span></span>
              </div>
              <div style="background:white;border-radius:12px;padding:28px;box-shadow:0 4px 20px rgba(124,58,237,0.1)">
                <h2 style="color:#1E1B4B;margin-bottom:8px">Verifikasi Login 🛡️</h2>
                <p style="color:#6B7280;font-size:14px;margin-bottom:24px">
                  Ada percobaan login ke akun FinSmart kamu. Gunakan kode berikut untuk melanjutkan.
                  Kode berlaku selama <strong>10 menit</strong>.
                </p>
                <div style="background:#EDE9FE;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
                  <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#7C3AED">${otp}</span>
                </div>
                <p style="color:#6B7280;font-size:12px;margin:0">
                  Jika ini bukan kamu, segera amankan akun FinSmart kamu.
                </p>
              </div>
            </div>
          `,
        }),
      })
      // Kembalikan flag requires2fa — JANGAN kirim token dulu
      return res.json({ requires2fa: true, email: user.email })
    }

    const token = signToken(user)
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, role: user.role } })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

// ─────────────────────────────────────────────────────────────────────
// POST /auth/login-2fa  — verifikasi OTP lalu beri token
// ─────────────────────────────────────────────────────────────────────
router.post('/login-2fa', authLimiter, async (req, res) => {
  const { email, otp } = req.body
  if (!email?.trim() || !otp)
    return res.status(400).json({ message: 'Email dan kode OTP wajib diisi.' })
  try {
    const [otpRows] = await pool.query(
      `SELECT * FROM password_resets
       WHERE email = ? AND otp = ? AND used = 0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase(), String(otp)]
    )
    if (otpRows.length === 0)
      return res.status(400).json({ message: 'Kode OTP salah atau sudah kadaluarsa.' })

    await pool.query('UPDATE password_resets SET used = 1 WHERE id = ?', [otpRows[0].id])

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()])
    if (rows.length === 0) return res.status(404).json({ message: 'User tidak ditemukan.' })

    const user  = rows[0]
    const token = signToken(user)
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, role: user.role } })
  } catch (err) {
    console.error('Login 2FA error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

// POST /auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: 'Logout berhasil.' })
})

// GET /auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, avatar, role, created_at FROM users WHERE id = ?', [req.user.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'User tidak ditemukan.' })

    const [[{ count: txCount }], [{ count: artCount }], [budgetCats]] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM transactions WHERE user_id = ?', [req.user.id]),
      pool.query('SELECT COUNT(*) as count FROM articles'),
      pool.query(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN used <= total AND total > 0 THEN 1 ELSE 0 END) AS ok
         FROM budget_categories bc
         JOIN budgets b ON bc.budget_id = b.id
         WHERE b.user_id = ?`,
        [req.user.id]
      ),
    ])

    // budgetOk = persentase kategori yang masih dalam batas; 100 jika belum ada budget
    const budgetOk = budgetCats.total > 0
      ? Math.round((budgetCats.ok / budgetCats.total) * 100)
      : 100

    const user = rows[0]
    user.stats = { transactions: txCount, articles: artCount, budgetOk }
    res.json({ user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

// PUT /auth/me
router.put('/me', authMiddleware, async (req, res) => {
  const { name, avatar, password, newPassword } = req.body
  try {
    if (password && newPassword) {
      if (!STRONG_PW.test(newPassword))
        return res.status(400).json({ message: 'Password baru minimal 8 karakter, mengandung huruf dan angka.' })
      const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id])
      const match  = await bcrypt.compare(password, rows[0].password)
      if (!match) return res.status(401).json({ message: 'Password lama salah.' })
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [await bcrypt.hash(newPassword, 12), req.user.id])
      return res.json({ message: 'Password berhasil diperbarui.' })
    }
    const updates = [], values = []
    if (name?.trim())   { updates.push('name = ?');   values.push(name.trim()) }
    if (avatar) { updates.push('avatar = ?'); values.push(avatar) }
    if (!updates.length) return res.status(400).json({ message: 'Tidak ada data yang diubah.' })
    values.push(req.user.id)
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values)
    const [rows] = await pool.query('SELECT id, name, email, avatar, role FROM users WHERE id = ?', [req.user.id])
    res.json({ user: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

// GET /auth/admin/admins  — daftar admin (admin & superadmin, read-only)
router.get('/admin/admins', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin')
    return res.status(403).json({ message: 'Akses ditolak.' })
  try {
    const [admins] = await pool.query(
      `SELECT id, name, email, role, is_active, created_at FROM users
       WHERE role IN ('admin','superadmin')
       ORDER BY role DESC, created_at DESC`
    )
    res.json({ admins })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

// GET /auth/admin/users  (admin & superadmin)
router.get('/admin/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin')
    return res.status(403).json({ message: 'Akses ditolak.' })
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              COUNT(t.id) AS transactions
       FROM users u
       LEFT JOIN transactions t ON t.user_id = u.id
       WHERE u.role = 'user'
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    )
    res.json({ users })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

// ─────────────────────────────────────────────────────────────────────
// POST /auth/admin-register-request  (daftar sebagai calon admin, tunggu acc superadmin)
// ─────────────────────────────────────────────────────────────────────
router.post('/admin-register-request', authLimiter, async (req, res) => {
  const { name, email, password, reason } = req.body
  if (!name?.trim() || !email?.trim() || !password)
    return res.status(400).json({ message: 'Nama, email, dan password wajib diisi.' })
  if (!EMAIL_RE.test(email))
    return res.status(400).json({ message: 'Format email tidak valid.' })
  if (!STRONG_PW.test(password))
    return res.status(400).json({ message: 'Password minimal 8 karakter, mengandung huruf dan angka.' })

  try {
    const [existUser] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()])
    if (existUser.length > 0)
      return res.status(409).json({ message: 'Email sudah terdaftar sebagai pengguna.' })

    const [existReq] = await pool.query(
      "SELECT id FROM admin_requests WHERE email = ? AND status = 'pending'",
      [email.toLowerCase()]
    )
    if (existReq.length > 0)
      return res.status(409).json({ message: 'Permintaan dengan email ini sudah dalam antrian.' })

    const hashed = await bcrypt.hash(password, 12)
    await pool.query(
      'INSERT INTO admin_requests (name, email, password, reason) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase(), hashed, reason?.trim() || null]
    )
    res.status(201).json({ message: 'Permintaan berhasil dikirim. Tunggu persetujuan Super Admin.' })
  } catch (err) {
    console.error('Admin request error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

// ─────────────────────────────────────────────────────────────────────
// GET /auth/superadmin/requests  — daftar semua request (superadmin only)
// ─────────────────────────────────────────────────────────────────────
router.get('/superadmin/requests', authMiddleware, async (req, res) => {
  if (req.user.role !== 'superadmin')
    return res.status(403).json({ message: 'Akses ditolak. Hanya Super Admin.' })
  try {
    const [requests] = await pool.query(
      `SELECT ar.id, ar.name, ar.email, ar.reason, ar.status,
              ar.created_at, ar.reviewed_at,
              u.name AS reviewed_by_name
       FROM admin_requests ar
       LEFT JOIN users u ON u.id = ar.reviewed_by
       ORDER BY ar.created_at DESC`
    )
    res.json({ requests })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

// ─────────────────────────────────────────────────────────────────────
// POST /auth/superadmin/requests/:id/approve  — approve request
// ─────────────────────────────────────────────────────────────────────
router.post('/superadmin/requests/:id/approve', authMiddleware, async (req, res) => {
  if (req.user.role !== 'superadmin')
    return res.status(403).json({ message: 'Akses ditolak. Hanya Super Admin.' })
  const { id } = req.params
  try {
    const [rows] = await pool.query("SELECT * FROM admin_requests WHERE id = ? AND status = 'pending'", [id])
    if (rows.length === 0)
      return res.status(404).json({ message: 'Request tidak ditemukan atau sudah diproses.' })

    const req_data = rows[0]
    const [existUser] = await pool.query('SELECT id FROM users WHERE email = ?', [req_data.email])
    if (existUser.length > 0)
      return res.status(409).json({ message: 'Email sudah terdaftar. Tolak request ini.' })

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [req_data.name, req_data.email, req_data.password, 'admin']
    )
    await pool.query(
      "UPDATE admin_requests SET status = 'approved', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
      [req.user.id, id]
    )
    res.json({ message: `Admin ${req_data.name} berhasil disetujui dan akun telah dibuat.`, userId: result.insertId })
  } catch (err) {
    console.error('Approve request error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

// ─────────────────────────────────────────────────────────────────────
// POST /auth/superadmin/requests/:id/reject  — reject request
// ─────────────────────────────────────────────────────────────────────
router.post('/superadmin/requests/:id/reject', authMiddleware, async (req, res) => {
  if (req.user.role !== 'superadmin')
    return res.status(403).json({ message: 'Akses ditolak. Hanya Super Admin.' })
  const { id } = req.params
  try {
    const [rows] = await pool.query("SELECT * FROM admin_requests WHERE id = ? AND status = 'pending'", [id])
    if (rows.length === 0)
      return res.status(404).json({ message: 'Request tidak ditemukan atau sudah diproses.' })
    await pool.query(
      "UPDATE admin_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
      [req.user.id, id]
    )
    res.json({ message: `Request dari ${rows[0].name} berhasil ditolak.` })
  } catch (err) {
    console.error('Reject request error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

// ─────────────────────────────────────────────────────────────────────
// GET /auth/superadmin/admins  — daftar semua admin (superadmin only)
// ─────────────────────────────────────────────────────────────────────
router.get('/superadmin/admins', authMiddleware, async (req, res) => {
  if (req.user.role !== 'superadmin')
    return res.status(403).json({ message: 'Akses ditolak. Hanya Super Admin.' })
  try {
    const [admins] = await pool.query(
      `SELECT id, name, email, role, created_at FROM users
       WHERE role IN ('admin','superadmin')
       ORDER BY role DESC, created_at DESC`
    )
    res.json({ admins })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

// ─────────────────────────────────────────────────────────────────────
// DELETE /auth/superadmin/admins/:id  — hapus admin (superadmin only)
// ─────────────────────────────────────────────────────────────────────
router.delete('/superadmin/admins/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'superadmin')
    return res.status(403).json({ message: 'Akses ditolak. Hanya Super Admin.' })
  const { id } = req.params
  if (Number(id) === req.user.id)
    return res.status(400).json({ message: 'Tidak bisa menghapus akun sendiri.' })
  try {
    const [rows] = await pool.query("SELECT id, role FROM users WHERE id = ? AND role = 'admin'", [id])
    if (rows.length === 0)
      return res.status(404).json({ message: 'Admin tidak ditemukan.' })
    await pool.query('DELETE FROM users WHERE id = ?', [id])
    res.json({ message: 'Admin berhasil dihapus.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

// ─────────────────────────────────────────────────────────────────────
// POST /auth/send-2fa-otp  — kirim OTP untuk aktifkan/nonaktifkan 2FA
// ─────────────────────────────────────────────────────────────────────
router.post('/send-2fa-otp', authMiddleware, authLimiter, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT email FROM users WHERE id = ?', [req.user.id])
    if (rows.length === 0) return res.status(404).json({ message: 'User tidak ditemukan.' })

    const email   = rows[0].email
    const otp     = generateOtp()
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 menit

    await pool.query('DELETE FROM password_resets WHERE email = ?', [email])
    await pool.query(
      'INSERT INTO password_resets (email, otp, expires_at) VALUES (?, ?, ?)',
      [email, otp, expires]
    )

    // Kirim email OTP via Brevo
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'FinSmart', email: process.env.BREVO_SENDER_EMAIL },
        to: [{ email }],
        subject: '🛡️ Kode Verifikasi 2 Langkah FinSmart',
        htmlContent: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#F9FAFB;border-radius:16px">
            <div style="text-align:center;margin-bottom:24px">
              <span style="font-size:32px;font-weight:900;color:#1E1B4B">Fin<span style="color:#7C3AED">Smart</span></span>
            </div>
            <div style="background:white;border-radius:12px;padding:28px;box-shadow:0 4px 20px rgba(124,58,237,0.1)">
              <h2 style="color:#1E1B4B;margin-bottom:8px">Verifikasi 2 Langkah 🛡️</h2>
              <p style="color:#6B7280;font-size:14px;margin-bottom:24px">
                Gunakan kode berikut untuk mengaktifkan Verifikasi 2 Langkah di akun FinSmart kamu.
                Kode berlaku selama <strong>10 menit</strong>.
              </p>
              <div style="background:#EDE9FE;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
                <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#7C3AED">${otp}</span>
              </div>
              <p style="color:#6B7280;font-size:12px;margin:0">
                Jika kamu tidak meminta ini, abaikan email ini.
              </p>
            </div>
          </div>
        `,
      }),
    })
    if (!brevoRes.ok) {
      const err = await brevoRes.json()
      throw new Error(`Brevo error: ${JSON.stringify(err)}`)
    }

    res.json({ message: 'Kode OTP berhasil dikirim ke emailmu.' })
  } catch (err) {
    console.error('Send 2FA OTP error:', err)
    res.status(500).json({ message: 'Gagal mengirim email. Coba lagi nanti.' })
  }
})

// ─────────────────────────────────────────────────────────────────────
// POST /auth/verify-2fa-otp  — verifikasi OTP lalu simpan status 2FA
// ─────────────────────────────────────────────────────────────────────
router.post('/verify-2fa-otp', authMiddleware, authLimiter, async (req, res) => {
  const { otp, enable } = req.body   // enable: true = aktifkan, false = nonaktifkan
  if (!otp) return res.status(400).json({ message: 'Kode OTP wajib diisi.' })
  try {
    const [rows] = await pool.query('SELECT email FROM users WHERE id = ?', [req.user.id])
    if (rows.length === 0) return res.status(404).json({ message: 'User tidak ditemukan.' })

    const email = rows[0].email
    const [otpRows] = await pool.query(
      `SELECT * FROM password_resets
       WHERE email = ? AND otp = ? AND used = 0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, String(otp)]
    )
    if (otpRows.length === 0)
      return res.status(400).json({ message: 'Kode OTP salah atau sudah kadaluarsa.' })

    // Tandai OTP sudah terpakai
    await pool.query('UPDATE password_resets SET used = 1 WHERE id = ?', [otpRows[0].id])

    // Simpan status 2FA ke tabel users (kolom two_fa_enabled)
    await pool.query('UPDATE users SET two_fa_enabled = ? WHERE id = ?', [enable ? 1 : 0, req.user.id])

    res.json({
      message: enable ? 'Verifikasi 2 Langkah berhasil diaktifkan! 🛡️' : 'Verifikasi 2 Langkah dinonaktifkan.',
      twoFaEnabled: !!enable,
    })
  } catch (err) {
    console.error('Verify 2FA OTP error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

// ─────────────────────────────────────────────────────────────────────
// PATCH /auth/admin/admins/:id/toggle-active  — aktifkan/nonaktifkan admin
// ─────────────────────────────────────────────────────────────────────
router.patch('/admin/admins/:id/toggle-active', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin')
    return res.status(403).json({ message: 'Akses ditolak.' })
  const { id } = req.params
  if (Number(id) === req.user.id)
    return res.status(400).json({ message: 'Tidak bisa mengubah status akun sendiri.' })
  try {
    const [rows] = await pool.query(
      "SELECT id, name, is_active FROM users WHERE id = ? AND role = 'admin'", [id]
    )
    if (rows.length === 0)
      return res.status(404).json({ message: 'Admin tidak ditemukan.' })
    const newStatus = rows[0].is_active ? 0 : 1
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id])
    res.json({
      message: newStatus ? `Admin ${rows[0].name} berhasil diaktifkan.` : `Admin ${rows[0].name} berhasil dinonaktifkan.`,
      is_active: newStatus
    })
  } catch (err) {
    console.error('Toggle active error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

export default router
// ─────────────────────────────────────────────────────────────────────
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function sendOtpEmail(toEmail, otp) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'FinSmart', email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: toEmail }],
      subject: '🔑 Kode OTP Reset Password FinSmart',
      htmlContent: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#F9FAFB;border-radius:16px">
          <div style="text-align:center;margin-bottom:24px">
            <span style="font-size:32px;font-weight:900;color:#1E1B4B">Fin<span style="color:#7C3AED">Smart</span></span>
          </div>
          <div style="background:white;border-radius:12px;padding:28px;box-shadow:0 4px 20px rgba(124,58,237,0.1)">
            <h2 style="color:#1E1B4B;margin-bottom:8px">Reset Password Kamu 🔐</h2>
            <p style="color:#6B7280;font-size:14px;margin-bottom:24px">
              Gunakan kode OTP berikut untuk mereset password akun FinSmart kamu.
              Kode berlaku selama <strong>15 menit</strong>.
            </p>
            <div style="background:#EDE9FE;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
              <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#7C3AED">${otp}</span>
            </div>
            <p style="color:#6B7280;font-size:12px;margin:0">
              Jika kamu tidak meminta reset password, abaikan email ini.
            </p>
          </div>
        </div>
      `,
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Brevo error: ${JSON.stringify(err)}`)
  }
}

// ─────────────────────────────────────────────────────────────────────
// POST /auth/forgot-password
// ─────────────────────────────────────────────────────────────────────
router.post('/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body
  if (!email?.trim() || !EMAIL_RE.test(email))
    return res.status(400).json({ message: 'Masukkan email yang valid.' })
  try {
    const [rows] = await pool.query(
      "SELECT id FROM users WHERE email = ? AND role = 'user'",
      [email.toLowerCase()]
    )
    if (rows.length === 0)
      return res.status(404).json({ message: 'Email tidak terdaftar.' })

    const otp     = generateOtp()
    const expires = new Date(Date.now() + 15 * 60 * 1000)

    await pool.query('DELETE FROM password_resets WHERE email = ?', [email.toLowerCase()])
    await pool.query(
      'INSERT INTO password_resets (email, otp, expires_at) VALUES (?, ?, ?)',
      [email.toLowerCase(), otp, expires]
    )
    await sendOtpEmail(email.toLowerCase(), otp)
    res.json({ message: 'Kode OTP berhasil dikirim ke emailmu.' })
  } catch (err) {
    console.error('Forgot password error:', err)
    res.status(500).json({ message: 'Gagal mengirim email. Coba lagi nanti.' })
  }
})

// ─────────────────────────────────────────────────────────────────────
// POST /auth/verify-otp
// ─────────────────────────────────────────────────────────────────────
router.post('/verify-otp', authLimiter, async (req, res) => {
  const { email, otp } = req.body
  if (!email?.trim() || !otp)
    return res.status(400).json({ message: 'Email dan kode OTP wajib diisi.' })
  try {
    const [rows] = await pool.query(
      `SELECT * FROM password_resets
       WHERE email = ? AND otp = ? AND used = 0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase(), String(otp)]
    )
    if (rows.length === 0)
      return res.status(400).json({ message: 'Kode OTP salah atau sudah kadaluarsa.' })
    res.json({ message: 'Kode OTP valid.' })
  } catch (err) {
    console.error('Verify OTP error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

// ─────────────────────────────────────────────────────────────────────
// POST /auth/reset-password
// ─────────────────────────────────────────────────────────────────────
router.post('/reset-password', authLimiter, async (req, res) => {
  const { email, otp, newPassword } = req.body
  if (!email?.trim() || !otp || !newPassword)
    return res.status(400).json({ message: 'Email, OTP, dan password baru wajib diisi.' })
  if (!STRONG_PW.test(newPassword))
    return res.status(400).json({ message: 'Password minimal 8 karakter, mengandung huruf dan angka.' })
  try {
    const [rows] = await pool.query(
      `SELECT * FROM password_resets
       WHERE email = ? AND otp = ? AND used = 0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase(), String(otp)]
    )
    if (rows.length === 0)
      return res.status(400).json({ message: 'Kode OTP tidak valid atau sudah kadaluarsa.' })

    const hashed = await bcrypt.hash(newPassword, 12)
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashed, email.toLowerCase()])
    await pool.query('UPDATE password_resets SET used = 1 WHERE id = ?', [rows[0].id])
    res.json({ message: 'Password berhasil diubah! Silakan login dengan password baru.' })
  } catch (err) {
    console.error('Reset password error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})