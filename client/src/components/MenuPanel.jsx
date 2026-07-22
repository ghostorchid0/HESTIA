import { useEffect, useState } from 'react'
import api from '../api'

const emptyItem = { name: '', description: '', price: '', category: '', available: true, imageUrl: '' }

export default function MenuPanel() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyItem)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { fetchItems() }, [])

  const fetchItems = async () => {
    const res = await api.get('/admin/menu')
    setItems(res.data)
  }

  const save = async (e) => {
    e.preventDefault()
    const payload = { ...form, price: parseFloat(form.price) }
    if (editingId) {
      await api.put(`/admin/menu/${editingId}`, payload)
    } else {
      await api.post('/admin/menu', payload)
    }
    setForm(emptyItem)
    setEditingId(null)
    fetchItems()
  }

  const edit = (item) => {
    setEditingId(item._id)
    setForm({ ...item, price: item.price.toString() })
  }

  const remove = async (id) => {
    await api.delete(`/admin/menu/${id}`)
    fetchItems()
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Menu & Inventory</h1>
      <form onSubmit={save} className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded border p-2" required />
          <input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="rounded border p-2" required />
          <input placeholder="Price" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="rounded border p-2" required />
          <input placeholder="Image URL" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="rounded border p-2" />
        </div>
        <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-4 w-full rounded border p-2" />
        <div className="mt-4 flex items-center gap-2">
          <input id="available" type="checkbox" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} />
          <label htmlFor="available" className="text-sm">Available</label>
        </div>
        <button className="mt-4 rounded-xl bg-amber-600 px-5 py-2 font-semibold text-white">{editingId ? 'Update' : 'Add'} Item</button>
      </form>

      <div className="space-y-3">
        {items.map(item => (
          <div key={item._id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
            <div>
              <h3 className="font-semibold">{item.name} <span className="text-sm font-normal text-gray-500">({item.category})</span></h3>
              <p className="text-sm text-gray-500">{item.description}</p>
              <p className="text-sm font-medium">${item.price.toFixed(2)} &middot; {item.available ? 'Available' : 'Unavailable'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => edit(item)} className="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200">Edit</button>
              <button onClick={() => remove(item._id)} className="rounded bg-red-50 px-3 py-1 text-sm text-red-600 hover:bg-red-100">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
