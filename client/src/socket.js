import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ''

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  auth: (cb) => cb({ token: localStorage.getItem('hestia_token') }),
})
