import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi, getToken, setToken, removeToken } from '../api'

const AuthContext = createContext(null)

// ── Callback untuk notifikasi ─────────────────────────────────────
let _addNotif = null
let _refetchNotifs = null
export function setNotifCallback(fn) { _addNotif = fn }
export function setRefetchCallback(fn) { _refetchNotifs = fn }
function notify(notif) { if (_addNotif) _addNotif(notif) }

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session dari token yang tersimpan
  useEffect(() => {
    const token = getToken()
    if (token) {
      authApi.getProfile()
        .then(data => setUser(data.user))
        .catch(() => {
          // Token tidak valid / expired — hapus dan paksa login ulang
          removeToken()
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  // Fetch ulang profil lengkap (termasuk stats) dari server
  const refetchProfile = async () => {
    try {
      const data = await authApi.getProfile()
      setUser(data.user)
    } catch {
      // Gagal silent — user masih bisa pakai app
    }
  }

  const login = async (email, password) => {
    try {
      const data = await authApi.login(email, password)
      // Server minta verifikasi 2FA dulu — jangan set token
      if (data.requires2fa) {
        return { success: false, requires2fa: true, email: data.email }
      }
      setToken(data.token)
      setUser(data.user)
      if (_refetchNotifs) _refetchNotifs()
      notify({ type: 'login', title: 'Login Berhasil 👋', body: `Selamat datang, ${data.user?.name}!` })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const login2fa = async (email, otp) => {
    try {
      const data = await authApi.login2fa(email, otp)
      setToken(data.token)
      setUser(data.user)
      if (_refetchNotifs) _refetchNotifs()
      notify({ type: 'login', title: 'Login Berhasil 👋', body: `Selamat datang, ${data.user?.name}!` })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const register = async (name, email, password) => {
    try {
      const data = await authApi.register({ name, email, password })
      setToken(data.token)
      setUser(data.user)
      if (_refetchNotifs) _refetchNotifs()
      notify({ type: 'register', title: 'Akun Berhasil Dibuat! 🎉', body: `${name} bergabung dengan FinSmart` })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const logout = () => {
    authApi.logout().catch(() => {}) // fire & forget
    removeToken()
    setUser(null)
  }

  const updateUser = (data) => setUser(prev => ({ ...prev, ...data }))

  return (
    <AuthContext.Provider value={{ user, loading, login, login2fa, register, logout, updateUser, refetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)