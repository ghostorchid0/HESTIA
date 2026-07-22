import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hestia_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const hotelId = localStorage.getItem('hestia_hotel')
  if (hotelId) {
    config.headers['X-Hotel-Id'] = hotelId
  }
  return config
})

export default api
