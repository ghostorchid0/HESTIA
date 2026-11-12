import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'
import Pagination from './Pagination'
import Icon from './Icon'
import { useToast } from '../contexts/ToastContext'

export default function HotelsPanel() {
  const { t } = useTranslation()
  const toast = useToast()
  const [hotels, setHotels] = useState([])
  const [form, setForm] = useState({ name: '', slug: '', currency: 'XOF', contactPhone: '', address: '', adminUsername: '', adminPassword: '' })
  const [createdAdmin, setCreatedAdmin] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedHotels, setSelectedHotels] = useState(new Set())
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(() => api.get(`/admin/hotels?page=${currentPage}&limit=${itemsPerPage}`).then(res => {
    const hotelsData = Array.isArray(res.data) ? res.data : []
    setHotels(hotelsData)
    const totalCount = res.headers?.get('x-total-count')
    if (totalCount) {
      setTotalPages(Math.ceil(totalCount / itemsPerPage))
    }
  }).catch(err => {
    console.error('Failed to fetch hotels', err)
    setHotels([])
  }), [currentPage, itemsPerPage])

  useEffect(() => { load() }, [currentPage, itemsPerPage, load])

  const create = async (e) => {
    e.preventDefault()
    setCreatedAdmin(null)
    try {
      const formData = new FormData()
      Object.keys(form).forEach(key => {
        if (form[key]) {
          formData.append(key, form[key])
        }
      })

      const adminPasswordPlain = form.adminPassword
      const res = await api.post('/admin/hotels', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setForm({ name: '', slug: '', currency: 'XOF', contactPhone: '', address: '', adminUsername: '', adminPassword: '' })
      setHotels(prev => [res.data.hotel, ...prev])
      if (res.data.admin) setCreatedAdmin({ ...res.data.admin, password: adminPasswordPlain })
      else toast.success(t('hotelsPanel.saved'))
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || t('hotelsPanel.error'))
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

  const filteredHotels = hotels.filter(hotel => {
    if (searchQuery && !hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !hotel.slug.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (statusFilter === 'active' && !hotel.active) return false
    if (statusFilter === 'inactive' && hotel.active) return false
    return true
  })

  const deleteHotel = async (hotelId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet hôtel ?')) return
    try {
      await api.delete(`/admin/hotels/${hotelId}`)
      toast.success('Hôtel supprimé avec succès')
      load()
    } catch (err) {
      toast.error('Erreur lors de la suppression')
      console.error('Failed to delete hotel', err)
    }
  }

  const deleteSelectedHotels = async () => {
    if (selectedHotels.size === 0) return
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedHotels.size} hôtel(s) ?`)) return
    try {
      await api.delete('/admin/hotels', { data: { ids: Array.from(selectedHotels) } })
      setSelectedHotels(new Set())
      toast.success(`${selectedHotels.size} hôtel(s) supprimé(s) avec succès`)
      load()
    } catch (err) {
      toast.error('Erreur lors de la suppression')
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

  const resetForm = () => {
    setForm({ name: '', slug: '', currency: 'XOF', contactPhone: '', address: '', adminUsername: '', adminPassword: '' })
    setCreatedAdmin(null)
    setShowForm(false)
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-light text-hestia-navy">{t('hotelsPanel.title')}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-hestia-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-hestia-navy-light"
        >
          <Icon name="add" size={18} />
          {t('hotelsPanel.create')}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Icon name="search" size={18} color="#6B7280" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un hôtel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-luxe w-full pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-luxe w-auto"
        >
          <option value="all">Tous</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedHotels.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 p-3 border border-red-200">
          <span className="text-sm font-medium text-red-700">
            {selectedHotels.size} hôtel(s) sélectionné(s)
          </span>
          <button
            onClick={deleteSelectedHotels}
            className="rounded-lg bg-red-500 px-3 py-1 text-sm font-medium text-white transition hover:bg-red-600"
          >
            Supprimer
          </button>
          <button
            onClick={() => setSelectedHotels(new Set())}
            className="text-sm text-gray-500 hover:text-hestia-navy"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Hotels Grid */}
      {filteredHotels.length === 0 ? (
        <div className="card-luxe p-12 text-center">
          <Icon name="hotels" size={48} color="#D1D5DB" className="mx-auto mb-4" />
          <p className="text-gray-500">Aucun hôtel trouvé</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-hestia-gold hover:underline"
          >
            Ajouter le premier hôtel
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredHotels.map(hotel => (
            <div key={hotel._id} className={`card-luxe overflow-hidden transition hover:shadow-luxe ${!hotel.active ? 'opacity-60' : ''}`}>
              {/* Hotel Header */}
              <div className="border-b border-hestia-linen bg-hestia-cream p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedHotels.has(hotel._id)}
                      onChange={() => toggleHotelSelection(hotel._id)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <div>
                      <h3 className="font-serif text-xl text-hestia-navy">{hotel.name}</h3>
                      <p className="text-xs text-gray-500">{hotel.slug}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                    hotel.active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {hotel.active ? t('hotelsPanel.active') : t('hotelsPanel.inactive')}
                  </span>
                </div>
              </div>

              {/* Hotel Details */}
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Devise</span>
                    <span className="font-medium text-hestia-navy">{hotel.currency}</span>
                  </div>
                  {hotel.contactPhone && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Téléphone</span>
                      <span className="font-medium text-hestia-navy">{hotel.contactPhone}</span>
                    </div>
                  )}
                  {hotel.address && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Adresse</span>
                      <span className="font-medium text-hestia-navy text-right max-w-[60%] truncate">
                        {hotel.address}
                      </span>
                    </div>
                  )}
                  {hotel.subscription && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Abonnement</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        hotel.subscription.status === 'active' ? 'bg-green-100 text-green-700' :
                        hotel.subscription.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {hotel.subscription.plan} - {hotel.subscription.status}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => deleteHotel(hotel._id)}
                    className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                  >
                    <Icon name="delete" size={16} className="inline mr-1" />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      {/* Create Hotel Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={resetForm}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-hestia-linen bg-white p-4">
              <h2 className="text-xl font-semibold text-hestia-navy">
                {t('hotelsPanel.create')}
              </h2>
              <button
                onClick={resetForm}
                className="rounded-full p-2 text-gray-500 transition hover:bg-hestia-cream"
              >
                <Icon name="close" size={24} />
              </button>
            </div>
            
            <form onSubmit={create} className="p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t('hotelsPanel.name')}
                  </label>
                  <input 
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value })} 
                    className="input-luxe w-full" 
                    required 
                    placeholder="Nom de l'hôtel"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t('hotelsPanel.slug')}
                  </label>
                  <input 
                    value={form.slug} 
                    onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} 
                    className="input-luxe w-full" 
                    required 
                    placeholder="identifiant-url"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t('hotelsPanel.currency')}
                  </label>
                  <input 
                    value={form.currency} 
                    onChange={e => setForm({ ...form, currency: e.target.value })} 
                    className="input-luxe w-full" 
                    required 
                    placeholder="XOF, USD, EUR..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t('hotelsPanel.contactPhone')}
                  </label>
                  <input 
                    value={form.contactPhone} 
                    onChange={e => setForm({ ...form, contactPhone: e.target.value })} 
                    className="input-luxe w-full" 
                    placeholder="+229 XX XX XX XX"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t('hotelsPanel.address')}
                  </label>
                  <input 
                    value={form.address} 
                    onChange={e => setForm({ ...form, address: e.target.value })} 
                    className="input-luxe w-full" 
                    placeholder="Adresse complète"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t('hotelsPanel.adminUsername')}
                  </label>
                  <input 
                    value={form.adminUsername} 
                    onChange={e => setForm({ ...form, adminUsername: e.target.value })} 
                    className="input-luxe w-full" 
                    minLength={3}
                    placeholder="admin"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t('hotelsPanel.adminPassword')}
                  </label>
                  <input 
                    type="password" 
                    value={form.adminPassword} 
                    onChange={e => setForm({ ...form, adminPassword: e.target.value })} 
                    className="input-luxe w-full" 
                    minLength={6} 
                    autoComplete="new-password"
                    placeholder="Mot de passe sécurisé"
                  />
                </div>
              </div>
              
              {createdAdmin && (
                <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
                  <p className="font-medium">{t('hotelsPanel.adminCreated')}</p>
                  <p>{t('hotelsPanel.username')}: {createdAdmin.username}</p>
                  <p>{t('hotelsPanel.password')}: {createdAdmin.password}</p>
                </div>
              )}
              
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-xl border border-hestia-linen bg-white px-4 py-3 font-medium text-hestia-navy transition hover:bg-hestia-linen"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-hestia-navy px-4 py-3 font-medium text-white transition hover:bg-hestia-navy-light"
                >
                  {t('hotelsPanel.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
