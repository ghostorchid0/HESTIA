import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'
import useSettings from '../hooks/useSettings'
import useSubscription from '../hooks/useSubscription'
import ImageWithFallback from './ImageWithFallback'

export default function BrandingPanel() {
  const { t } = useTranslation()
  const { settings, refresh } = useSettings()
  const { canAccessFeature } = useSubscription()
  const [logoUrl, setLogoUrl] = useState(settings?.logoUrl || '')
  const [accentColor, setAccentColor] = useState(settings?.accentColor || '#C9A227')
  const [welcomeMessage, setWelcomeMessage] = useState(settings?.welcomeMessage || '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (ev) => setLogoUrl(ev.target.result)
    reader.readAsDataURL(f)
  }

  const save = async (e) => {
    e.preventDefault()
    setError(''); setMessage('')
    try {
      await api.put('/settings/branding', { logoUrl, accentColor, welcomeMessage })
      await refresh()
      setMessage(t('branding.saved'))
    } catch (err) {
      setError(err.response?.data?.message || t('branding.error'))
    }
  }

  if (!canAccessFeature('CUSTOM_BRANDING')) {
    return (
      <div className="card-luxe p-8 text-center text-gray-500">
        <span className="text-2xl">🔒</span>
        <p className="mt-2 font-medium">{t('branding.locked')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={save} className="card-luxe p-8">
      <h2 className="mb-6 text-xl font-light text-hestia-navy">{t('branding.title')}</h2>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('branding.logo')}</label>
          <input type="file" accept="image/*" onChange={handleFile} className="w-full text-sm" />
          {logoUrl && <ImageWithFallback src={logoUrl} alt="logo" className="mt-3 h-20 w-20 rounded-2xl bg-hestia-cream object-contain p-2" />}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('branding.accentColor')}</label>
          <div className="flex items-center gap-3">
            <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="h-10 w-16 rounded border border-hestia-linen" />
            <input value={accentColor} onChange={e => setAccentColor(e.target.value)} className="input-luxe w-full uppercase" maxLength={7} />
          </div>
        </div>
      </div>
      <div className="mt-5">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('branding.welcomeMessage')}</label>
        <textarea value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} className="input-luxe w-full" rows={3} />
      </div>
      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      <button className="btn-primary mt-8">{t('settingsPanel.save')}</button>
    </form>
  )
}
