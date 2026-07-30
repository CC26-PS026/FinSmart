// src/api/index.js
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/v1'

export const getToken    = ()      => localStorage.getItem('fs_token')
export const setToken    = (token) => localStorage.setItem('fs_token', token)
export const removeToken = ()      => localStorage.removeItem('fs_token')

export const getAdminToken    = ()      => localStorage.getItem('fs_admin_token')
export const setAdminToken    = (token) => localStorage.setItem('fs_admin_token', token)
export const removeAdminToken = ()      => localStorage.removeItem('fs_admin_token')

export const getTokenRole = (token) => {
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role || null
  } catch { return null }
}

const api = axios.create({ baseURL: BASE_URL, headers: { 'Content-Type': 'application/json' }, timeout: 15000 })
api.interceptors.request.use((config) => { const t = getToken(); if (t) config.headers.Authorization = `Bearer ${t}`; return config })
api.interceptors.response.use(r => r.data, error => {
  if (error.response?.status === 401) { removeToken(); if (!window.location.pathname.includes('/login')) window.location.href = '/login' }
  return Promise.reject(new Error(error.response?.data?.message || 'Terjadi kesalahan jaringan'))
})

const adminApi = axios.create({ baseURL: BASE_URL, headers: { 'Content-Type': 'application/json' }, timeout: 15000 })
adminApi.interceptors.request.use((config) => { const t = getAdminToken(); if (t) config.headers.Authorization = `Bearer ${t}`; return config })
adminApi.interceptors.response.use(r => r.data, error => {
  if (error.response?.status === 401) { removeAdminToken(); if (!window.location.pathname.includes('/admin-login')) window.location.href = '/admin-login' }
  return Promise.reject(new Error(error.response?.data?.message || 'Terjadi kesalahan jaringan'))
})

export const authApi = {
  login:          (email, password) => api.post('/auth/login', { email, password }),
  register:       (data)            => api.post('/auth/register', data),
  logout:         ()                => api.post('/auth/logout'),
  getProfile:     ()                => api.get('/auth/me'),
  updateProfile:  (data)            => api.put('/auth/me', data),
  forgotPassword: (email)           => api.post('/auth/forgot-password', { email }),
  verifyOtp:      (email, otp)      => api.post('/auth/verify-otp', { email, otp }),
  resetPassword:  (email, otp, newPassword) => api.post('/auth/reset-password', { email, otp, newPassword }),
  send2faOtp:     ()                => api.post('/auth/send-2fa-otp'),
  verify2faOtp:   (otp, enable)     => api.post('/auth/verify-2fa-otp', { otp, enable }),
  login2fa:       (email, otp)      => api.post('/auth/login-2fa', { email, otp }),
}

export const adminAuthApi = {
  register:        (data)            => adminApi.post('/auth/admin-register', data),
  registerRequest: (data)            => adminApi.post('/auth/admin-register-request', data),
  login:           (email, password) => adminApi.post('/auth/login', { email, password }),
  getProfile:      ()                => adminApi.get('/auth/me'),
  getUsers:        ()                => adminApi.get('/auth/admin/users'),
  getAdmins:       ()                => adminApi.get('/auth/admin/admins'),
  toggleAdminActive: (id)            => adminApi.patch(`/auth/admin/admins/${id}/toggle-active`),
}

export const superAdminApi = {
  getRequests:    ()   => adminApi.get('/auth/superadmin/requests'),
  approveRequest: (id) => adminApi.post(`/auth/superadmin/requests/${id}/approve`),
  rejectRequest:  (id) => adminApi.post(`/auth/superadmin/requests/${id}/reject`),
  getAdmins:      ()   => adminApi.get('/auth/superadmin/admins'),
  deleteAdmin:    (id) => adminApi.delete(`/auth/superadmin/admins/${id}`),
}

// Khusus admin panel — pakai adminApi (bukan api user)
export const adminArticlesApi = {
  getAll:  ()         => adminApi.get('/articles'),
  create:  (data)     => adminApi.post('/articles', data),
  update:  (id, data) => adminApi.put(`/articles/${id}`, data),
  delete:  (id)       => adminApi.delete(`/articles/${id}`),
}

export const adminRatingsApi = {
  getAll: () => adminApi.get('/ratings'),
}

export const transactionApi = {
  getAll:  ()         => api.get('/transactions'),
  getById: (id)       => api.get(`/transactions/${id}`),
  create:  (data)     => api.post('/transactions', data),
  update:  (id, data) => api.put(`/transactions/${id}`, data),
  delete:  (id)       => api.delete(`/transactions/${id}`),
}

export const budgetApi = {
  getCurrent: ()     => api.get('/budgets/current'),
  getAll:     ()     => api.get('/budgets'),
  update:     (data) => api.put('/budgets', data),
}

export const educationApi = {
  getArticles: (category = '') => api.get(`/articles${category ? '?category=' + category : ''}`),
  getArticle:  (id) => api.get(`/articles/${id}`),
}

export const dashboardApi = {
  getSummary:   () => api.get('/dashboard/summary'),
  getChartData: () => api.get('/dashboard/chart'),
}

export const notifApiRemote = {
  getAll:    ()     => api.get('/notifications'),
  create:    (data) => api.post('/notifications', data),
  markRead:  (id)   => api.put(`/notifications/${id}/read`),
  readAll:   ()     => api.put('/notifications/read-all'),
  deleteAll: ()     => api.delete('/notifications'),
}

export const ratingApi = {
  submit: (score, comment, aspects) => api.post('/ratings', { score, comment, aspects }),
}

export const simulationApi = {
  getAll: ()     => api.get('/simulations'),
  save:   (data) => api.post('/simulations', data),
  delete: (id)   => api.delete(`/simulations/${id}`),
}

export default api