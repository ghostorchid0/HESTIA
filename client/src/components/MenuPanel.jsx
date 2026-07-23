import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'
import useSettings from '../hooks/useSettings'
import { formatCurrency } from '../utils/format'

const emptyItem = { name: '', description: '', price: '', category: '', available: true, imageUrl: '' }

export default function MenuPanel() {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyItem)
  const [file, setFile] = useState(null)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { fetchItems() }, [])

  const fetchItems = async () => {
    const res = await api.get('/admin/menu')
    setItems(res.data)
  }

  const buildFormData = () => {
    const data = new FormData()
    data.append('name', form.name)
    data.append('description', form.description || '')
    data.append('price', form.price)
    data.append('category', form.category)
    data.append('available', form.available ? 'true' : 'false')
    if (form.imageUrl && !file) data.append('imageUrl', form.imageUrl)
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
    await api.delete(`/admin/menu/${id}`)
    fetchItems()
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
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('menuPanel.category')}</label>
            <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-luxe w-full" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('menuPanel.price')}</label>
            <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input-luxe w-full" required />
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
          {imagePreview && <img src={imagePreview} alt="preview" className="h-20 w-20 rounded-2xl object-cover shadow-sm" />}
        </div>
        <div className="mt-5 flex items-center gap-2">
          <input id="available" type="checkbox" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} />
          <label htmlFor="available" className="text-sm text-gray-600">{t('menuPanel.available')}</label>
        </div>
        <button className="btn-primary mt-8">{editingId ? t('menuPanel.updateItem') : t('menuPanel.addItem')}</button>
      </form>

      <div className="grid gap-5 md:grid-cols-2">
        {items.map(item => (
          <div key={item._id} className="card-luxe flex flex-col p-6 transition hover:shadow-luxe">
            <div className="flex items-start gap-4">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="h-20 w-20 rounded-2xl object-cover shadow-sm" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-hestia-linen text-2xl text-hestia-gold">✦</div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-hestia-navy">{item.name}</h3>
                <p className="text-xs uppercase tracking-wider text-gray-400">{item.category}</p>
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
    </div>
  )
}
