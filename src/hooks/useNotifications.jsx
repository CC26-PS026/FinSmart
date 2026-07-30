import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { notifApiRemote, getToken } from '../api'

const NotifContext = createContext(null)

// ─── localStorage sebagai cache optimistik ─────────────────────────────────
const CACHE_KEY = 'fs_notifications_cache'

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]') } catch { return [] }
}
function saveCache(notifs) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(notifs.slice(0, 50))) } catch {}
}

// Normalise field dari server (is_read, created_at) ke shape internal (read, time)
function fromServer(n) {
  return {
    id:      n.id,
    type:    n.type  || 'system',
    title:   n.title || '',
    body:    n.body  || '',
    read:    Boolean(n.is_read),
    time:    n.created_at || new Date().toISOString(),
    _synced: true,
  }
}

// Interval retry (ms) saat ada item pending — berhenti sendiri kalau queue kosong
const RETRY_INTERVAL_MS = 30_000

export function NotifProvider({ children }) {
  // Mulai dari cache supaya UI langsung tampil sebelum fetch selesai
  const [notifs, setNotifs] = useState(loadCache)
  const [synced, setSynced] = useState(false)  // berhasil fetch dari server?
  const pendingQueue = useRef([])               // antrian notif yang belum tersimpan ke server
  const cancelRef    = useRef(null)
  const retryTimerRef = useRef(null)            // timer retry aktif

  // ── Flush pendingQueue ke server — dipanggil oleh refetch & retry ────────
  const flushPendingQueue = useCallback(() => {
    if (!pendingQueue.current.length) return

    const toFlush = [...pendingQueue.current]
    pendingQueue.current = []

    toFlush.forEach(item => {
      notifApiRemote.create({ type: item.type, title: item.title, body: item.body })
        .then(saved => {
          setNotifs(prev => {
            const next = prev.map(n =>
              n.id === item.id ? { ...n, id: saved.id, _synced: true, _pending: false } : n
            )
            saveCache(next)
            return next
          })
        })
        .catch(() => {
          // Masih gagal — kembalikan ke antrian
          pendingQueue.current.push(item)
        })
    })
  }, [])

  // ── Mulai / hentikan retry timer berdasarkan isi queue ───────────────────
  const scheduleRetry = useCallback(() => {
    if (retryTimerRef.current) return  // sudah berjalan
    retryTimerRef.current = setInterval(() => {
      if (!pendingQueue.current.length) {
        // Queue kosong — hentikan timer
        clearInterval(retryTimerRef.current)
        retryTimerRef.current = null
        return
      }
      if (!getToken()) return  // belum login, tunggu
      flushPendingQueue()
    }, RETRY_INTERVAL_MS)
  }, [flushPendingQueue])

  // ── Fetch dari server (bisa dipanggil ulang setelah login) ──────────────
  const refetch = useCallback(() => {
    if (!getToken()) return  // belum login, skip — hindari 401 redirect
    if (cancelRef.current) cancelRef.current()

    let cancelled = false
    cancelRef.current = () => { cancelled = true }

    notifApiRemote.getAll()
      .then(data => {
        if (cancelled) return
        const serverNotifs = (data.notifications || []).map(fromServer)
        setNotifs(serverNotifs)
        saveCache(serverNotifs)
        setSynced(true)

        // Kirim notif yang pending (dibuat offline sebelum server tersedia)
        flushPendingQueue()
      })
      .catch(() => {
        // Server tidak tersedia — tetap pakai cache, tandai belum synced
        setSynced(false)
      })
  }, [flushPendingQueue])

  // ── Jalankan fetch saat pertama mount (hanya jika sudah ada token) ──────
  useEffect(() => {
    refetch()
    return () => {
      if (cancelRef.current) cancelRef.current()
      if (retryTimerRef.current) {
        clearInterval(retryTimerRef.current)
        retryTimerRef.current = null
      }
    }
  }, [refetch])

  // ── Tambah notifikasi baru ───────────────────────────────────────────────
  const addNotif = useCallback((notif) => {
    const tempId = Date.now() + Math.random()
    const item = {
      id:      tempId,
      type:    notif.type  || 'system',
      title:   notif.title || '',
      body:    notif.body  || '',
      read:    false,
      time:    new Date().toISOString(),
      _synced: false,
    }

    // Tampilkan segera (optimistik)
    setNotifs(prev => {
      const next = [item, ...prev].slice(0, 50)
      saveCache(next)
      return next
    })

    // Simpan ke server di background
    notifApiRemote.create({ type: item.type, title: item.title, body: item.body })
      .then(saved => {
        // Ganti tempId dengan id asli dari server
        setNotifs(prev => {
          const next = prev.map(n =>
            n.id === tempId ? { ...n, id: saved.id, _synced: true } : n
          )
          saveCache(next)
          return next
        })
      })
      .catch(() => {
        // Server tidak bisa dicapai — simpan ke antrian pending & aktifkan retry
        pendingQueue.current.push(item)
        setNotifs(prev => prev.map(n =>
          n.id === tempId ? { ...n, _pending: true } : n
        ))
        scheduleRetry()   // ← retry otomatis aktif selama sesi berlangsung
      })

    return item
  }, [scheduleRetry])

  // ── Tandai satu notif sudah dibaca ──────────────────────────────────────
  const markRead = useCallback((id) => {
    // Cek apakah notif ini sudah tersinkron ke server sebelum update state
    // (notif dengan tempId float belum punya ID server yang valid)
    setNotifs(prev => {
      const target = prev.find(n => n.id === id)
      // Hanya hit API kalau belum dibaca dan sudah tersinkron — hindari call berulang
      if (target && !target.read && target._synced) {
        notifApiRemote.markRead(id).catch(() => {})
      }
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n)
      saveCache(next)
      return next
    })
  }, [])

  // ── Tandai semua sudah dibaca ────────────────────────────────────────────
  const markAllRead = useCallback(() => {
    setNotifs(prev => {
      const next = prev.map(n => ({ ...n, read: true }))
      saveCache(next)

      // Hit read-all endpoint (1 call untuk semua, server handle sisanya)
      // Hanya perlu dilakukan kalau ada yang belum dibaca dan sudah synced
      const hasSynced = prev.some(n => !n.read && n._synced)
      if (hasSynced) {
        notifApiRemote.readAll().catch(() => {})
      }

      return next
    })
  }, [])

  // ── Hapus semua (lokal + server) ────────────────────────────────────────
  const clearAll = useCallback(() => {
    pendingQueue.current = []
    if (retryTimerRef.current) {
      clearInterval(retryTimerRef.current)
      retryTimerRef.current = null
    }
    setNotifs([])
    saveCache([])
    notifApiRemote.deleteAll().catch(() => {})
  }, [])

  const unreadCount = notifs.filter(n => !n.read).length

  return (
    <NotifContext.Provider value={{ notifs, addNotif, markRead, markAllRead, clearAll, unreadCount, synced, refetch }}>
      {children}
    </NotifContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotifContext)
}