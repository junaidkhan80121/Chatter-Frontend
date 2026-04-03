import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
})

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', {
            refresh_token: refreshToken,
          })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/auth'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ── Auth ──────────────────────────────────────────
export const authApi = {
  register: (data: { username: string; email: string; password: string; display_name?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refresh_token: refreshToken }),
  requestOtp: (email: string) =>
    api.post('/auth/otp/request', { email }),
  verifyOtp: (email: string, otp: string) =>
    api.post('/auth/otp/verify', { email, otp }),
}

// ── Users ─────────────────────────────────────────
export const userApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: Record<string, unknown>) => api.put('/users/me', data),
  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  search: (q: string) => api.get(`/users/search?q=${encodeURIComponent(q)}`),
  getUser: (id: string) => api.get(`/users/${id}`),
}

// ── Friends ───────────────────────────────────────
export const friendApi = {
  getFriends: () => api.get('/friends'),
  getRequests: () => api.get('/friends/requests'),
  sendRequest: (data: { addressee_id?: string; username?: string; unique_share_id?: string }) =>
    api.post('/friends/request', data),
  accept: (id: string) => api.put(`/friends/${id}/accept`),
  reject: (id: string) => api.put(`/friends/${id}/reject`),
  block: (userId: string) => api.post(`/friends/${userId}/block`),
  unblock: (userId: string) => api.delete(`/friends/${userId}/block`),
}

// ── Conversations ─────────────────────────────────
export const convApi = {
  list: () => api.get('/conversations'),
  create: (data: { type: string; participant_ids: string[]; name?: string }) =>
    api.post('/conversations', data),
  getMessages: (convId: string, params?: { limit?: number; before_id?: string }) =>
    api.get(`/conversations/${convId}/messages`, { params }),
  sendMessage: (convId: string, data: { content?: string; message_type?: string; reply_to_id?: string }) =>
    api.post(`/conversations/${convId}/messages`, data),
  archive: (convId: string) => api.put(`/conversations/${convId}/archive`),
  pin: (convId: string) => api.put(`/conversations/${convId}/pin`),
  searchMessages: (convId: string, q: string) =>
    api.get(`/conversations/${convId}/messages/search?q=${encodeURIComponent(q)}`),
}

// ── Files ─────────────────────────────────────────
export const fileApi = {
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// ── Notifications ─────────────────────────────────
export const notifApi = {
  list: () => api.get('/notifications'),
  markAllRead: () => api.put('/notifications/read-all'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
}
