import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useSettings from '../hooks/useSettings'

export default function SettingsPanel() {
  const { t } = useTranslation()
  const { settings, refresh } = useSettings()
  const [form, setForm] = useState({ hotelName: '', currency: '$', contactPhone: '', address: '' })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (settings) {
      setForm({
        hotelName: settings.hotelName || '',
        currency: settings.currency || '$',
        contactPhone: settings.contactPhone || '',
        address: settings.address || '',
      })
      setPreview(settings.hotelLogo || '')
    }
  }, [settings])

  const save = async (e) => {
    e.preventDefault()
    setMessage('')
    const data = new FormData()
    Object.entries(form).forEach(([key, value]) => data.append(key, value))
    if (file) data.append('logo', file)

    await fetch('/api/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${localStorage.getItem('hestia_token')}` },
      body: data,
    })
    setFile(null)
    await refresh()
    setMessage(t('settingsPanel.saved'))
  }

  const imagePreview = file ? URL.createObjectURL(file) : preview || null

  return (
    <div>
      <h1 className="mb-8 text-3xl font-light text-hestia-navy">{t('settingsPanel.title')}</h1>

      <form onSubmit={save} className="card-luxe p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('settingsPanel.hotelName')}</label>
            <input value={form.hotelName} onChange={e => setForm({ ...form, hotelName: e.target.value })} className="input-luxe w-full" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('settingsPanel.currency')}</label>
            <input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="input-luxe w-full" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('settingsPanel.contactPhone')}</label>
            <input value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} className="input-luxe w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('settingsPanel.address')}</label>
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input-luxe w-full" />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('settingsPanel.logo')}</label>
            <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="w-full text-sm" />
          </div>
          {imagePreview && <img src={imagePreview} alt="logo preview" className="h-20 w-20 rounded-2xl object-cover shadow-sm" />}
        </div>
        {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
        <button className="btn-primary mt-8">{t('settingsPanel.save')}</button>
      </form>
    </div>
  )
}
