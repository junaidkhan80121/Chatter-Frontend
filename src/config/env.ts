export const config = {
  apiUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000',
  isDev: import.meta.env.DEV,
}
