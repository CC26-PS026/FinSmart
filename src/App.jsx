import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth, setNotifCallback, setRefetchCallback } from './hooks/useAuth'
import { ToastProvider } from './hooks/useToast'
import { NotifProvider, useNotifications } from './hooks/useNotifications'
import { logoBase64 } from './assets/logo'
import { getAdminToken, adminAuthApi, removeAdminToken, getTokenRole } from './api'

import Onboarding      from './pages/Onboarding'
import Login           from './pages/Login'
import Register        from './pages/Register'
import Dashboard       from './pages/Dashboard'
import Transactions    from './pages/Transactions'
import Budget          from './pages/Budget'
import Education       from './pages/Education'
import Profile         from './pages/Profile'
import Simulation      from './pages/Simulation'
import RatingApp       from './pages/RatingApp'
import BantuanFAQ      from './pages/BantuanFAQ'
import Notifikasi      from './pages/Notifikasi'
import SideNav         from './components/SideNav'
import AdminRegister   from './pages/AdminRegister'
import AdminLogin      from './pages/AdminLogin'
import AdminDashboard  from './pages/AdminDashboard'
import SuperAdminDashboard   from './pages/SuperAdminDashboard'
import AdminRegisterRequest  from './pages/AdminRegisterRequest'
import ForgotPassword        from './pages/ForgotPassword'

function Loader() {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--bg, #F9FAFB)', zIndex: 9999 }}>
      <img 
      src={logoBase64} 
      alt="FinSmart" 
        style={{ 
        width: 160, 
      height: 160, 
      objectFit: 'contain', 
    marginBottom: 16
  }} 
      />
      <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 16, fontFamily: 'var(--font-display)' }}>
        Memuat...
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function AdminRoute({ children }) {
  const token = getAdminToken()
  if (!token) return <Navigate to="/admin-login" replace />
  const role = getTokenRole(token)
  if (role !== 'admin' && role !== 'superadmin') return <Navigate to="/admin-login" replace />
  return children
}

function SuperAdminRoute({ children }) {
  const token = getAdminToken()
  if (!token) return <Navigate to="/admin-login" replace />
  const role = getTokenRole(token)
  if (role !== 'superadmin') return <Navigate to="/admin-login" replace />
  return children
}

function NotifBridge() {
  const { addNotif, refetch } = useNotifications()
  useEffect(() => {
    setNotifCallback(addNotif)
    setRefetchCallback(refetch)
    return () => { 
      setNotifCallback(null)
      setRefetchCallback(null) 
    }
  }, [addNotif, refetch])
  return null
}

function AppRoutes() {
  const { user } = useAuth()
  const location = useLocation() 
  const showSidebar = user && !['/login', '/register', '/', '/admin-register-request', '/admin-login', '/admin-register'].includes(location.pathname)
  return (
    <>
      <NotifBridge />
      {showSidebar && <SideNav />}
      <Routes>
        <Route path="/" element={<PublicRoute><Onboarding /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
        <Route path="/education" element={<ProtectedRoute><Education /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/simulation" element={<ProtectedRoute><Simulation /></ProtectedRoute>} />
        <Route path="/rating" element={<ProtectedRoute><RatingApp /></ProtectedRoute>} />
        <Route path="/bantuan" element={<ProtectedRoute><BantuanFAQ /></ProtectedRoute>} />
        <Route path="/notifikasi" element={<ProtectedRoute><Notifikasi /></ProtectedRoute>} />
        <Route path="/admin-register" element={<AdminRegister />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin-register-request" element={<AdminRegisterRequest />} />
        <Route path="/superadmin" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <NotifProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </NotifProvider>
    </BrowserRouter>
  )
}