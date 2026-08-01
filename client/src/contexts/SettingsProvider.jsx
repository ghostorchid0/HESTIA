import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../api'
import { socket } from '../socket'
import { SettingsContext } from './settingsContext'

function getSettingsParams(pathname) {
  const params = {}
  const match = pathname.match(/^\/room\/([^/]+)/)
  if (match) {
    params.roomUuid = match[1]
  } else {
    const hotelId = localStorage.getItem('hestia_hotel')
    if (hotelId) params.hotelId = hotelId
  }
  return params
}

export default function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)
  const location = useLocation()
  const params = useMemo(() => getSettingsParams(location.pathname), [location.pathname])
  const joinedHotel = useRef(null)

  const refresh = useCallback(async (extraParams = {}) => {
    const allParams = { ...params, ...extraParams }
    try {
      const res = await api.get('/settings', { params: allParams })
      setSettings(res.data)
      return res.data
    } catch (err) {
      console.error('Failed to load settings', err)
      return null
    }
  }, [params])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!settings?.hotelId) return
    const id = settings.hotelId.toString ? settings.hotelId.toString() : settings.hotelId
    if (joinedHotel.current === id) return
    socket.emit('join_hotel_channel', id)
    joinedHotel.current = id
  }, [settings])

  useEffect(() => {
    const handler = () => {
      refresh()
    }
    socket.on('settings_updated', handler)
    return () => socket.off('settings_updated', handler)
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
