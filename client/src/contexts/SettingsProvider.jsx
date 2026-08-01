import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../api'
import { socket } from '../socket'
import { SettingsContext } from './settingsContext'

function getSettingsParams() {
  const params = {}
  const match = window.location.pathname.match(/^\/room\/([^/]+)/)
  if (match) {
    params.roomUuid = match[1]
  }
  const hotelId = localStorage.getItem('hestia_hotel')
  if (hotelId) params.hotelId = hotelId
  return { params, hotelId }
}

export default function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)
  const location = useLocation()
  const joinedHotel = useRef(null)

  const refresh = useCallback(async (extraParams = {}) => {
    const { params } = getSettingsParams()
    const allParams = { ...params, ...extraParams }
    // When explicit hotelId passed, prefer it (admin header selection)
    if (extraParams.hotelId) allParams.hotelId = extraParams.hotelId
    try {
      const res = await api.get('/settings', { params: allParams })
      setSettings(res.data)
      if (res.data?.hotelId) {
        const id = res.data.hotelId.toString ? res.data.hotelId.toString() : res.data.hotelId
        if (joinedHotel.current !== id) {
          socket.emit('join_hotel_channel', id)
          joinedHotel.current = id
        }
      }
      return res.data
    } catch (err) {
      console.error('Failed to load settings', err)
      return null
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh, location.pathname])

  useEffect(() => {
    const onUpdate = () => refresh()
    socket.on('settings_updated', onUpdate)
    return () => socket.off('settings_updated', onUpdate)
  }, [refresh])

  // Fallback polling every 3s for environments where socket is unstable
  useEffect(() => {
    const interval = setInterval(refresh, 3000)
    return () => clearInterval(interval)
  }, [refresh])

  const updateSettings = useCallback((data) => {
    setSettings(data)
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, refresh, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}
