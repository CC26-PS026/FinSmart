import express      from 'express'
import cors         from 'cors'
import dotenv       from 'dotenv'
import helmet       from 'helmet'
import rateLimit    from 'express-rate-limit'
import path         from 'path'
import { fileURLToPath } from 'url'
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const distPath   = path.join(__dirname, 'dist')

import { initDB }        from './config/db.js'
import authRoutes         from './routes/auth.js'
import transactionRoutes  from './routes/transactions.js'
import budgetRoutes       from './routes/budgets.js'
import articleRoutes      from './routes/articles.js'
import dashboardRoutes    from './routes/dashboard.js'
import notifRoutes        from './routes/notifications.js'
import ratingRoutes       from './routes/ratings.js'
import simulationRoutes   from './routes/simulations.js'

const app  = express()
const PORT = process.env.PORT || 5000

// ── Trust proxy (Railway / Vercel sit behind a proxy) ─────────────
app.set('trust proxy', 1)

// ── Security headers ───────────────────────────────────────────────
// CSP dimatikan karena kita juga serve static build React dari server yang sama
app.use(helmet({ contentSecurityPolicy: false }))

// ── CORS ───────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(o => o.trim()) : []),
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin '${origin}' tidak diizinkan.`))
  },
  credentials: true,
}))

app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))

// ── Global rate limiter — 200 req / 15 menit per IP ──────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak permintaan, coba lagi sebentar.' },
})
app.use(globalLimiter)

// ── Routes ──────────────────────────────────────────────────────────
app.use('/v1/auth',          authRoutes)
app.use('/v1/transactions',  transactionRoutes)
app.use('/v1/budgets',       budgetRoutes)
app.use('/v1/articles',      articleRoutes)
app.use('/v1/dashboard',     dashboardRoutes)
app.use('/v1/notifications', notifRoutes)
app.use('/v1/ratings',       ratingRoutes)
app.use('/v1/simulations',   simulationRoutes)

// ── Health check API ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '🚀 Finsmart API berjalan!', version: 'v1' })
})

// ── Serve frontend (hasil `vite build` di folder dist) ───────────
app.use(express.static(distPath))

app.get('*', (req, res, next) => {
  // Route /v1/* yang tidak cocok tetap dianggap 404 API, bukan SPA fallback
  if (req.path.startsWith('/v1')) return next()
  res.sendFile(path.join(distPath, 'index.html'))
})

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} tidak ditemukan.` })
})

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ message: 'Terjadi kesalahan server.' })
})

async function start() {
  try {
    await initDB()
    app.listen(PORT, () => {
      console.log(`\n🚀 Finsmart API berjalan di http://localhost:${PORT}`)
      console.log(`📦 Database  : ${process.env.DB_NAME} @ ${process.env.DB_HOST}:${process.env.DB_PORT}`)
      console.log(`🌐 CORS      : ${process.env.CLIENT_URL}`)
    })
  } catch (err) {
    console.error('❌ Gagal menjalankan server:', err.message)
    process.exit(1)
  }
}

start()