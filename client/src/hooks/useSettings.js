import { useContext } from 'react'
import { SettingsContext } from '../contexts/settingsContext'

export default function useSettings() {
  return useContext(SettingsContext)
}
