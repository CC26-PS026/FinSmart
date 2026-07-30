import jwt from 'jsonwebtoken'

export function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Token tidak ditemukan. Silakan login.' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa.' })
  }
}

export function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin')
    return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang diizinkan.' })
  next()
}

export function superAdminMiddleware(req, res, next) {
  if (req.user?.role !== 'superadmin')
    return res.status(403).json({ message: 'Akses ditolak. Hanya Super Admin yang diizinkan.' })
  next()
}