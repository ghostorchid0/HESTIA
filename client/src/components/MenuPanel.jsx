import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'
import useSettings from '../hooks/useSettings'
import { formatCurrency } from '../utils/format'
import CategorySelect from './CategorySelect'
import ImageWithFallback from './ImageWithFallback'
import Pagination from './Pagination'

const emptyItem = { name: '', description: '', price: '', category: '', department: 'kitchen', available: true, imageUrl: '' }

export default function MenuPanel() {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyItem)
  const [file, setFile] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedItems, setSelectedItems] = useState(new Set())

  useEffect(() => { fetchItems() }, [currentPage, itemsPerPage])

  const fetchItems = async () => {
    const res = await api.get(`/admin/menu?page=${currentPage}&limit=${itemsPerPage}`)
    setItems(res.data)
    const totalCount = res.headers?.get('x-total-count')
    if (totalCount) {
      setTotalPages(Math.ceil(totalCount / itemsPerPage))
    }
  }

  const categories = useMemo(() => [...new Set(items.map(i => i.category).filter(Boolean))], [items])

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
    if (editingId) {
      await fetch(`/api/admin/menu/${editingId}`, { method: 'PUT', headers, body: data })
    } else {
      await fetch('/api/admin/menu', { method: 'POST', headers, body: data })
    }
    setForm(emptyItem)
    setFile(null)
    setEditingId(null)
    fetchItems()
  }

  const edit = (item) => {
    setEditingId(item._id)
    setForm({ ...item, price: item.price.toString() })
    setFile(null)
  }

  const remove = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return
    await api.delete(`/admin/menu/${id}`)
    fetchItems()
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

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(items.map(i => i._id)))
    }
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

  return (
    <div>
      <h1 className="mb-8 text-3xl font-light text-hestia-navy">{t('menuPanel.title')}</h1>

      <form onSubmit={save} className="card-luxe mb-8 p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('menuPanel.name')}</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-luxe w-full" required />
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
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('menuPanel.price')}</label>
            <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input-luxe w-full" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('menuPanel.department')}</label>
            <select value={form.department || 'kitchen'} onChange={e => setForm({ ...form, department: e.target.value })} className="input-luxe w-full">
              <option value="kitchen">{t('staffPanel.kitchen')}</option>
              <option value="reception">{t('staffPanel.reception')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('menuPanel.imageUrl')}</label>
            <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="input-luxe w-full" />
          </div>
        </div>
        <div className="mt-5">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('menuPanel.description')}</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-luxe w-full" />
        </div>
        <div className="mt-5 flex items-center gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Image file</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="w-full text-sm" />
          </div>
          {imagePreview && <ImageWithFallback src={imagePreview} alt="preview" className="h-20 w-20 rounded-2xl object-cover shadow-sm" />}
        </div>
        <div className="mt-5 flex items-center gap-2">
          <input id="available" type="checkbox" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} />
          <label htmlFor="available" className="text-sm text-gray-600">{t('menuPanel.available')}</label>
        </div>
        <button className="btn-primary mt-8">{editingId ? t('menuPanel.updateItem') : t('menuPanel.addItem')}</button>
      </form>

      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          checked={selectedItems.size === items.length && items.length > 0}
          onChange={toggleSelectAll}
          className="w-4 h-4"
        />
        <span className="text-sm text-gray-600">Tout sélectionner</span>
        {selectedItems.size > 0 && (
          <button
            onClick={deleteSelectedItems}
            className="rounded-lg bg-red-100 text-red-700 px-4 py-2 text-sm font-medium transition hover:bg-red-200"
          >
            Supprimer ({selectedItems.size})
          </button>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {items.map(item => (
          <div key={item._id} className="card-luxe flex flex-col p-6 transition hover:shadow-luxe">
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={selectedItems.has(item._id)}
                onChange={() => toggleItemSelection(item._id)}
                className="w-4 h-4 mt-2"
              />
              <ImageWithFallback src={item.imageUrl} alt={item.name} className="h-20 w-20 rounded-2xl object-cover shadow-sm" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-hestia-navy">{item.name}</h3>
                <p className="text-xs uppercase tracking-wider text-gray-400">{item.category} · {t(`staffPanel.${item.department || 'kitchen'}`)}</p>
                <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                <p className="mt-2 font-serif text-lg text-hestia-gold">{formatCurrency(item.price, settings?.currency)} <span className="text-sm text-gray-400">&middot; {item.available ? t('active') : t('inactive')}</span></p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => edit(item)} className="rounded-lg border border-hestia-linen bg-white px-4 py-2 text-sm text-hestia-navy transition hover:bg-hestia-linen">{t('update')}</button>
              <button onClick={() => remove(item._id)} className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 transition hover:bg-red-100">{t('delete')}</button>
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
