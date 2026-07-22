import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'

const emptyItem = { name: '', description: '', price: '', category: '', available: true, imageUrl: '' }

export default function MenuPanel() {
  const { t } = useTranslation()
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
      <h1 className="mb-4 text-2xl font-bold">{t('menuPanel.title')}</h1>
      <form onSubmit={save} className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <input placeholder={t('menuPanel.name')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded border p-2" required />
          <input placeholder={t('menuPanel.category')} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="rounded border p-2" required />
          <input placeholder={t('menuPanel.price')} type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="rounded border p-2" required />
          <input placeholder={t('menuPanel.imageUrl')} value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="rounded border p-2" />
        </div>
        <textarea placeholder={t('menuPanel.description')} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-4 w-full rounded border p-2" />
        <div className="mt-4">
          <label className="block text-sm font-medium">{t('menuPanel.imageUrl')} (file)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="mt-1 block w-full text-sm"
          />
          {imagePreview && (
            <img src={imagePreview} alt="preview" className="mt-3 h-32 w-32 rounded object-cover" />
          )}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <input id="available" type="checkbox" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} />
          <label htmlFor="available" className="text-sm">{t('menuPanel.available')}</label>
        </div>
        <button className="mt-4 rounded-xl bg-amber-600 px-5 py-2 font-semibold text-white">{editingId ? t('menuPanel.updateItem') : t('menuPanel.addItem')}</button>
      </form>

      <div className="space-y-3">
        {items.map(item => (
          <div key={item._id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-4">
              {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded object-cover" />}
              <div>
                <h3 className="font-semibold">{item.name} <span className="text-sm font-normal text-gray-500">({item.category})</span></h3>
                <p className="text-sm text-gray-500">{item.description}</p>
                <p className="text-sm font-medium">${item.price.toFixed(2)} &middot; {item.available ? t('active') : t('inactive')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => edit(item)} className="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200">{t('update')}</button>
              <button onClick={() => remove(item._id)} className="rounded bg-red-50 px-3 py-1 text-sm text-red-600 hover:bg-red-100">{t('delete')}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
