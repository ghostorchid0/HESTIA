import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'

export default function HotelsPanel() {
  const { t } = useTranslation()
  const [hotels, setHotels] = useState([])
  const [form, setForm] = useState({ name: '', slug: '', currency: 'XOF', contactPhone: '', address: '', adminUsername: '', adminPassword: '' })
  const [message, setMessage] = useState('')
  const [createdAdmin, setCreatedAdmin] = useState(null)

  const load = () => api.get('/admin/hotels').then(res => setHotels(res.data))

  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    setMessage('')
    setCreatedAdmin(null)
    try {
      const adminPasswordPlain = form.adminPassword
      const res = await api.post('/admin/hotels', form)
      setForm({ name: '', slug: '', currency: 'XOF', contactPhone: '', address: '', adminUsername: '', adminPassword: '' })
      setHotels(prev => [res.data.hotel, ...prev])
      if (res.data.admin) setCreatedAdmin({ ...res.data.admin, password: adminPasswordPlain })
      else setMessage(t('hotelsPanel.saved'))
      load()
    } catch (err) {
      setMessage(err.response?.data?.message || t('hotelsPanel.error'))
    }
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-light text-hestia-navy">{t('hotelsPanel.title')}</h1>
      <form onSubmit={create} className="card-luxe mb-8 p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('hotelsPanel.name')}</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-luxe w-full" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('hotelsPanel.slug')}</label>
            <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} className="input-luxe w-full" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('hotelsPanel.currency')}</label>
            <input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="input-luxe w-full" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('hotelsPanel.contactPhone')}</label>
            <input value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} className="input-luxe w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('hotelsPanel.address')}</label>
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input-luxe w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('hotelsPanel.adminUsername')}</label>
            <input value={form.adminUsername} onChange={e => setForm({ ...form, adminUsername: e.target.value })} className="input-luxe w-full" minLength={3} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('hotelsPanel.adminPassword')}</label>
            <input type="password" value={form.adminPassword} onChange={e => setForm({ ...form, adminPassword: e.target.value })} className="input-luxe w-full" minLength={6} />
          </div>
        </div>
        {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
        {createdAdmin && (
          <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
            <p className="font-medium">{t('hotelsPanel.adminCreated')}</p>
            <p>{t('hotelsPanel.username')}: {createdAdmin.username}</p>
            <p>{t('hotelsPanel.password')}: {createdAdmin.password}</p>
          </div>
        )}
        <button className="btn-primary mt-8">{t('hotelsPanel.create')}</button>
      </form>

      <div className="space-y-4">
        {hotels.map(h => (
          <div key={h._id} className="card-luxe flex items-center justify-between p-6">
            <div>
              <p className="font-serif text-xl text-hestia-navy">{h.name}</p>
              <p className="text-xs text-gray-400">{h.slug} • {h.currency}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${h.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{h.active ? t('hotelsPanel.active') : t('hotelsPanel.inactive')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
