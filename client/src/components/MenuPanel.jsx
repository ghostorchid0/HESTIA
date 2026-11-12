import { useEffect, useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'
import useSettings from '../hooks/useSettings'
import { formatCurrency } from '../utils/format'
import CategorySelect from './CategorySelect'
import ImageWithFallback from './ImageWithFallback'
import Pagination from './Pagination'
import Icon from './Icon'

const emptyItem = { name: '', description: '', price: '', category: '', department: 'kitchen', available: true, imageUrl: '' }

export default function MenuPanel() {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyItem)
  const [file, setFile] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get(`/admin/menu?page=${currentPage}&limit=${itemsPerPage}`)
      const itemsData = Array.isArray(res.data) ? res.data : []
      setItems(itemsData)
      const totalCount = res.headers?.get('x-total-count')
      if (totalCount) {
        setTotalPages(Math.ceil(totalCount / itemsPerPage))
      }
    } catch (err) {
      console.error('Failed to fetch menu items', err)
      setItems([])
    }
  }, [currentPage, itemsPerPage])

  useEffect(() => { fetchItems() }, [currentPage, itemsPerPage, fetchItems])

  const categories = useMemo(() => [...new Set(items.map(i => i.category).filter(Boolean))], [items])

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !item.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (categoryFilter && item.category !== categoryFilter) {
        return false
      }
      return true
    })
  }, [items, searchQuery, categoryFilter])

  const buildFormData = () => {
    const data = new FormData()
    data.append('name', form.name)
    data.append('description', form.description || '')
    data.append('price', form.price)
    data.append('category', form.category)
    data.append('department', form.department || 'kitchen')
    data.append('available', form.available ? 'true' : 'false')
    if (form.imageUrl && !file && !form.imageUrl.startsWith('data:image/')) data.append('imageUrl', form.imageUrl)
    if (file) data.append('image', file)
    return data
  }

  const save = async (e) => {
    e.preventDefault()
    const data = buildFormData()
    const headers = { Authorization: `Bearer ${localStorage.getItem('hestia_token')}` }
    try {
      if (editingId) {
        await fetch(`/api/admin/menu/${editingId}`, { method: 'PUT', headers, body: data })
      } else {
        await fetch('/api/admin/menu', { method: 'POST', headers, body: data })
      }
      setForm(emptyItem)
      setFile(null)
      setEditingId(null)
      setShowForm(false)
      fetchItems()
    } catch (err) {
      console.error('Failed to save item', err)
      alert('Erreur lors de l\'enregistrement')
    }
  }

  const edit = (item) => {
    setEditingId(item._id)
    setForm({ ...item, price: item.price.toString() })
    setFile(null)
    setShowForm(true)
  }

  const remove = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return
    try {
      await api.delete(`/admin/menu/${id}`)
      fetchItems()
    } catch (err) {
      console.error('Failed to delete item', err)
    }
  }

  const toggleAvailability = async (item) => {
    try {
      await api.patch(`/admin/menu/${item._id}/availability`, { available: !item.available })
      fetchItems()
    } catch (err) {
      console.error('Failed to toggle availability', err)
    }
  }

  const toggleItemSelection = (itemId) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const deleteSelectedItems = async () => {
    if (selectedItems.size === 0) return
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedItems.size} élément(s) ?`)) return
    try {
      await api.delete('/admin/menu', { data: { ids: Array.from(selectedItems) } })
      setSelectedItems(new Set())
      fetchItems()
    } catch (err) {
      console.error('Failed to delete items', err)
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    setSelectedItems(new Set())
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
    setSelectedItems(new Set())
  }

  const imagePreview = file ? URL.createObjectURL(file) : form.imageUrl || null

  const resetForm = () => {
    setForm(emptyItem)
    setFile(null)
    setEditingId(null)
    setShowForm(false)
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-light text-hestia-navy">{t('menuPanel.title')}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-hestia-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-hestia-navy-light"
        >
          <Icon name="add" size={18} />
          {t('menuPanel.addItem')}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Icon name="search" size={18} color="#6B7280" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un article..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-luxe w-full pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-luxe w-auto"
        >
          <option value="">Toutes les catégories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-hestia-gold/10 p-3">
          <span className="text-sm font-medium text-hestia-navy">
            {selectedItems.size} sélectionné(s)
          </span>
          <button
            onClick={deleteSelectedItems}
            className="rounded-lg bg-red-100 px-3 py-1 text-sm font-medium text-red-700 transition hover:bg-red-200"
          >
            Supprimer
          </button>
          <button
            onClick={() => setSelectedItems(new Set())}
            className="text-sm text-gray-500 hover:text-hestia-navy"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="card-luxe p-12 text-center">
          <Icon name="menu" size={48} color="#D1D5DB" className="mx-auto mb-4" />
          <p className="text-gray-500">Aucun article trouvé</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-hestia-gold hover:underline"
          >
            Ajouter le premier article
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map(item => (
            <div key={item._id} className={`card-luxe overflow-hidden transition hover:shadow-luxe ${!item.available ? 'opacity-60' : ''}`}>
              <div className="relative">
                <ImageWithFallback 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="h-40 w-full object-cover"
                />
                <div className="absolute left-3 top-3 flex gap-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item._id)}
                    onChange={() => toggleItemSelection(item._id)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  {!item.available && (
                    <span className="rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                      Indisponible
                    </span>
                  )}
                </div>
                <button
                  onClick={() => toggleAvailability(item)}
                  className={`absolute right-3 top-3 rounded-full px-2 py-1 text-xs font-medium transition ${
                    item.available 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-500 text-white hover:bg-gray-600'
                  }`}
                >
                  {item.available ? 'Actif' : 'Inactif'}
                </button>
              </div>
              
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-hestia-navy">{item.name}</h3>
                    <p className="text-xs text-gray-500">{item.category} · {t(`staffPanel.${item.department || 'kitchen'}`)}</p>
                  </div>
                  <span className="font-serif text-lg text-hestia-gold">
                    {formatCurrency(item.price, settings?.currency)}
                  </span>
                </div>
                
                {item.description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{item.description}</p>
                )}
                
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => edit(item)}
                    className="flex-1 rounded-lg border border-hestia-linen bg-white px-3 py-2 text-sm text-hestia-navy transition hover:bg-hestia-linen"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => remove(item._id)}
                    className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 transition hover:bg-red-100"
                  >
                    <Icon name="delete" size={16} />
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={resetForm}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-hestia-linen bg-white p-4">
              <h2 className="text-xl font-semibold text-hestia-navy">
                {editingId ? 'Modifier l\'article' : 'Nouvel article'}
              </h2>
              <button
                onClick={resetForm}
                className="rounded-full p-2 text-gray-500 transition hover:bg-hestia-cream"
              >
                <Icon name="close" size={24} />
              </button>
            </div>
            
            <form onSubmit={save} className="p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t('menuPanel.name')}
                  </label>
                  <input 
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value })} 
                    className="input-luxe w-full" 
                    required 
                    placeholder="Nom du plat"
                  />
                </div>
                
                <div>
                  <CategorySelect
                    label={t('menuPanel.category')}
                    value={form.category}
                    onChange={category => setForm({ ...form, category })}
                    options={categories}
                  />
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t('menuPanel.price')}
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={form.price} 
                    onChange={e => setForm({ ...form, price: e.target.value })} 
                    className="input-luxe w-full" 
                    required 
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t('menuPanel.department')}
                  </label>
                  <select 
                    value={form.department || 'kitchen'} 
                    onChange={e => setForm({ ...form, department: e.target.value })} 
                    className="input-luxe w-full"
                  >
                    <option value="kitchen">{t('staffPanel.kitchen')}</option>
                    <option value="reception">{t('staffPanel.reception')}</option>
                  </select>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t('menuPanel.imageUrl')}
                  </label>
                  <input 
                    value={form.imageUrl} 
                    onChange={e => setForm({ ...form, imageUrl: e.target.value })} 
                    className="input-luxe w-full" 
                    placeholder="https://..."
                  />
                </div>
              </div>
              
              <div className="mt-5">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {t('menuPanel.description')}
                </label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm({ ...form, description: e.target.value })} 
                  className="input-luxe w-full" 
                  rows="3"
                  placeholder="Description du plat..."
                />
              </div>
              
              <div className="mt-5">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Image du fichier
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setFile(e.target.files[0])} 
                  className="w-full text-sm" 
                />
                {imagePreview && (
                  <div className="mt-3">
                    <ImageWithFallback 
                      src={imagePreview} 
                      alt="preview" 
                      className="h-32 w-32 rounded-xl object-cover" 
                    />
                  </div>
                )}
              </div>
              
              <div className="mt-5 flex items-center gap-2">
                <input 
                  id="available" 
                  type="checkbox" 
                  checked={form.available} 
                  onChange={e => setForm({ ...form, available: e.target.checked })} 
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="available" className="text-sm text-gray-600">
                  {t('menuPanel.available')}
                </label>
              </div>
              
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
                  {editingId ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
