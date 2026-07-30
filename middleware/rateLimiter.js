import rateLimit from 'express-rate-limit'

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit.' },
  skipSuccessfulRequests: true,
  // Lewati rate limit untuk localhost (development)
  skip: (req) => {
    const ip = req.ip || req.connection.remoteAddress || ''
    return ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127.')
  },
})