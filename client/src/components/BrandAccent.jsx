import { useEffect } from 'react'
import useSettings from '../hooks/useSettings'

export default function BrandAccent({ children }) {
  const { settings } = useSettings()
  const brand = settings?.accentColor || '#C9A227'

  useEffect(() => {
    document.title = settings?.hotelName ? `${settings.hotelName} — Hestia` : 'Hestia'
  }, [settings])

  return (
    <div style={{ '--brand': brand, '--brand-light': `${brand}20` }} className="min-h-screen bg-hestia-cream">
      {children}
    </div>
  )
}
