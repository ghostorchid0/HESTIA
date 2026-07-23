import { useEffect, useState, useCallback } from 'react'
import api from '../api'
import { SettingsContext } from './settingsContext'

export default function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    api.get('/settings')
      .then(res => setSettings(res.data))
      .catch(() => setSettings({ hotelName: 'Hestia' }))
  }, [])

  const refresh = useCallback(async (params = {}) => {
    const res = await api.get('/settings', { params })
    setSettings(res.data)
  }, [])

  const updateSettings = useCallback((data) => {
    setSettings(data)
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, refresh, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}
