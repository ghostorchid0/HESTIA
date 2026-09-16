import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ''

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 50,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  pingTimeout: 120000,
  pingInterval: 30000,
  auth: (cb) => cb({ token: localStorage.getItem('hestia_token') }),
})

socket.on('connect', () => {
  console.log('[socket] connected', socket.id)
  // Re-join staff channel on reconnect
  const token = localStorage.getItem('hestia_token')
  if (token) {
    socket.emit('join_staff')
  }
})
socket.on('disconnect', (reason) => console.log('[socket] disconnected', reason))
socket.on('connect_error', (err) => console.error('[socket] connect_error', err.message))
