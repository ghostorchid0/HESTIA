import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ''

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  auth: (cb) => cb({ token: localStorage.getItem('hestia_token') }),
})

socket.on('connect', () => console.log('[socket] connected', socket.id))
socket.on('disconnect', (reason) => console.log('[socket] disconnected', reason))
socket.on('connect_error', (err) => console.error('[socket] connect_error', err.message))
