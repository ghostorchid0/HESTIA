import { useContext } from 'react'
import { SettingsContext } from '../contexts/settingsContext'

export default function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) return { settings: null, refresh: () => {}, updateSettings: () => {} }
  return ctx
}
