import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api'

export default function MenuPage() {
  const { t } = useTranslation()
  const { uuid } = useParams()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)

  useEffect(() => {
    api.get('/menu')
      .then(res => {
        setItems(res.data)
        const cats = [...new Set(res.data.map(i => i.category))]
        setCategories(cats)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [uuid])

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item._id)
      if (existing) {
        return prev.map(i => i.menuItemId === item._id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1, notes: '' }]
    })
  }

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(i => i.menuItemId === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
  }

  const updateNotes = (id, value) => {
    setCart(prev => prev.map(i => i.menuItemId === id ? { ...i, notes: value } : i))
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.menuItemId !== id))

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const placeOrder = async () => {
    if (cart.length === 0) return
    setPlacing(true)
    try {
      const res = await api.post('/orders', { roomUuid: uuid, items: cart, notes })
      navigate(`/room/${uuid}/order/${res.data._id}`)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">{t('loading')}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md pb-32">
      <div className="sticky top-0 z-10 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-amber-600">{t('menuPage.title')}</h1>
        <p className="text-sm text-gray-500">{t('menuPage.subtitle')}</p>
      </div>

      <div className="p-4 space-y-6">
        {categories.map(cat => (
          <section key={cat}>
            <h2 className="mb-3 text-lg font-semibold text-gray-700">{cat}</h2>
            <div className="space-y-3">
              {items.filter(i => i.category === cat).map(item => (
                <div key={item._id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                    <p className="mt-1 font-medium text-amber-700">{item.price === 0 ? t('menuPage.free') : `$${item.price.toFixed(2)}`}</p>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="ml-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                  >
                    {t('menuPage.add')}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 rounded-t-2xl bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <h3 className="mb-2 font-semibold">{t('menuPage.yourOrder')}</h3>
          <div className="max-h-40 overflow-y-auto space-y-2 mb-3">
            {cart.map(item => (
              <div key={item.menuItemId} className="flex items-center justify-between text-sm">
                <div className="flex-1">
                  <span className="font-medium">{item.name}</span>
                  <input
                    value={item.notes}
                    onChange={(e) => updateNotes(item.menuItemId, e.target.value)}
                    placeholder={t('menuPage.notesPlaceholder')}
                    className="mt-1 block w-full rounded border border-gray-200 px-2 py-1 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button onClick={() => updateQuantity(item.menuItemId, -1)} className="rounded bg-gray-100 px-2 py-1">-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.menuItemId, 1)} className="rounded bg-gray-100 px-2 py-1">+</button>
                  <button onClick={() => removeFromCart(item.menuItemId)} className="ml-1 text-red-500">x</button>
                </div>
              </div>
            ))}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('menuPage.additionalRequest')}
            className="mb-3 w-full rounded-lg border border-gray-200 p-2 text-sm"
          />
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">{t('total')}: ${total.toFixed(2)}</span>
            <button
              onClick={placeOrder}
              disabled={placing}
              className="rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white shadow hover:bg-amber-700 disabled:opacity-60"
            >
              {placing ? t('menuPage.placing') : t('menuPage.placeOrder')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
