import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'
import Pagination from './Pagination'

export default function HotelsPanel() {
  const { t } = useTranslation()
  const [hotels, setHotels] = useState([])
  const [form, setForm] = useState({ name: '', slug: '', currency: 'XOF', contactPhone: '', address: '', adminUsername: '', adminPassword: '', logo: null })
  const [message, setMessage] = useState('')
  const [createdAdmin, setCreatedAdmin] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedHotels, setSelectedHotels] = useState(new Set())

  const load = () => api.get(`/admin/hotels?page=${currentPage}&limit=${itemsPerPage}`).then(res => {
    setHotels(res.data)
    const totalCount = res.headers?.get('x-total-count')
    if (totalCount) {
      setTotalPages(Math.ceil(totalCount / itemsPerPage))
    }
  })

  useEffect(() => { load() }, [currentPage, itemsPerPage])

  const create = async (e) => {
    e.preventDefault()
    setMessage('')
    setCreatedAdmin(null)
    try {
      const formData = new FormData()
      Object.keys(form).forEach(key => {
        if (key === 'logo' && form.logo) {
          formData.append('logo', form.logo)
        } else if (form[key]) {
          formData.append(key, form[key])
        }
      })

      const adminPasswordPlain = form.adminPassword
      const res = await api.post('/admin/hotels', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setForm({ name: '', slug: '', currency: 'XOF', contactPhone: '', address: '', adminUsername: '', adminPassword: '', logo: null })
      setHotels(prev => [res.data.hotel, ...prev])
      if (res.data.admin) setCreatedAdmin({ ...res.data.admin, password: adminPasswordPlain })
      else setMessage(t('hotelsPanel.saved'))
      load()
    } catch (err) {
      setMessage(err.response?.data?.message || t('hotelsPanel.error'))
    }
  }

  const toggleHotelSelection = (hotelId) => {
    const newSelected = new Set(selectedHotels)
    if (newSelected.has(hotelId)) {
      newSelected.delete(hotelId)
    } else {
      newSelected.add(hotelId)
    }
    setSelectedHotels(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedHotels.size === hotels.length) {
      setSelectedHotels(new Set())
    } else {
      setSelectedHotels(new Set(hotels.map(h => h._id)))
    }
  }

  const deleteHotel = async (hotelId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet hôtel ?')) return
    try {
      await api.delete(`/admin/hotels/${hotelId}`)
      load()
    } catch (err) {
      console.error('Failed to delete hotel', err)
    }
  }

  const deleteSelectedHotels = async () => {
    if (selectedHotels.size === 0) return
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedHotels.size} hôtel(s) ?`)) return
    try {
      await api.delete('/admin/hotels', { data: { ids: Array.from(selectedHotels) } })
      setSelectedHotels(new Set())
      load()
    } catch (err) {
      console.error('Failed to delete hotels', err)
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    setSelectedHotels(new Set())
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
    setSelectedHotels(new Set())
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-light text-hestia-navy">{t('hotelsPanel.title')}</h1>
      <form onSubmit={create} className="card-luxe mb-8 p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Logo de l'hôtel</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={e => setForm({ ...form, logo: e.target.files[0] })}
              className="input-luxe w-full"
            />
          </div>
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

      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          checked={selectedHotels.size === hotels.length && hotels.length > 0}
          onChange={toggleSelectAll}
          className="w-4 h-4"
        />
        <span className="text-sm text-gray-600">Tout sélectionner</span>
        {selectedHotels.size > 0 && (
          <button
            onClick={deleteSelectedHotels}
            className="rounded-lg bg-red-100 text-red-700 px-4 py-2 text-sm font-medium transition hover:bg-red-200"
          >
            Supprimer ({selectedHotels.size})
          </button>
        )}
      </div>

      <div className="space-y-4">
        {hotels.map(h => (
          <div key={h._id} className="card-luxe flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedHotels.has(h._id)}
                onChange={() => toggleHotelSelection(h._id)}
                className="w-4 h-4"
              />
              {h.logo && (
                <img src={h.logo} alt={h.name} className="h-12 w-12 rounded-full object-cover" />
              )}
              <div>
                <p className="font-serif text-xl text-hestia-navy">{h.name}</p>
                <p className="text-xs text-gray-400">{h.slug} • {h.currency}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${h.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{h.active ? t('hotelsPanel.active') : t('hotelsPanel.inactive')}</span>
              <button
                onClick={() => deleteHotel(h._id)}
                className="rounded-lg bg-red-100 text-red-700 px-3 py-1.5 text-xs font-medium transition hover:bg-red-200"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  )
}
