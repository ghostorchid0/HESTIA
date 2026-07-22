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
  const [paymentMethod, setPaymentMethod] = useState('Cash on delivery')
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
      const res = await api.post('/orders', { roomUuid: uuid, items: cart, notes, paymentMethod })
      navigate(`/room/${uuid}/order/${res.data._id}`)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hestia-cream">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-hestia-linen border-t-hestia-gold" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-hestia-cream pb-40">
      <header className="sticky top-0 z-20 border-b border-hestia-linen bg-white/80 px-6 py-5 backdrop-blur-md">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-hestia-gold">{t('menuPage.subtitle')}</p>
          <h1 className="mt-1 text-3xl font-light text-hestia-navy">{t('menuPage.title')}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pt-10">
        {categories.map(cat => (
          <section key={cat} className="mb-10">
            <h2 className="mb-5 border-b border-hestia-linen pb-2 text-2xl font-light text-hestia-navy">{cat}</h2>
            <div className="space-y-4">
              {items.filter(i => i.category === cat).map(item => (
                <div key={item._id} className="card-luxe flex items-center gap-5 p-5 transition hover:shadow-luxe">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-20 w-20 rounded-2xl object-cover shadow-sm" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-hestia-linen text-2xl text-hestia-gold">✦</div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-hestia-navy">{item.name}</h3>
                      <span className="font-serif text-lg text-hestia-gold">
                        {item.price === 0 ? t('menuPage.free') : `$${item.price.toFixed(2)}`}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{item.description}</p>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="btn-outline"
                  >
                    {t('menuPage.add')}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 rounded-t-4xl bg-white p-6 shadow-luxe">
          <div className="mx-auto max-w-2xl">
            <h3 className="text-xl font-light text-hestia-navy">{t('menuPage.yourOrder')}</h3>
            <div className="mt-4 max-h-40 space-y-3 overflow-y-auto">
              {cart.map(item => (
                <div key={item.menuItemId} className="flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <span className="font-medium text-hestia-navy">{item.name}</span>
                    <input
                      value={item.notes}
                      onChange={(e) => updateNotes(item.menuItemId, e.target.value)}
                      placeholder={t('menuPage.notesPlaceholder')}
                      className="input-luxe mt-1 w-full"
                    />
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.menuItemId, -1)} className="h-8 w-8 rounded-full bg-hestia-cream text-hestia-navy transition hover:bg-hestia-linen">−</button>
                    <span className="w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.menuItemId, 1)} className="h-8 w-8 rounded-full bg-hestia-cream text-hestia-navy transition hover:bg-hestia-linen">+</button>
                    <button onClick={() => removeFromCart(item.menuItemId)} className="ml-2 text-sm text-red-500">×</button>
                  </div>
                </div>
              ))}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('menuPage.additionalRequest')}
              className="input-luxe mt-4 w-full"
            />
            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('menuPage.paymentMethod')}</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="input-luxe w-full"
              >
                <option value="Cash on delivery">{t('paymentMethods.cashOnDelivery')}</option>
                <option value="Mobile Money">{t('paymentMethods.mobileMoney')}</option>
                <option value="Room charge">{t('paymentMethods.roomCharge')}</option>
              </select>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <span className="font-serif text-2xl text-hestia-navy">{t('total')} <span className="text-hestia-gold">${total.toFixed(2)}</span></span>
              <button
                onClick={placeOrder}
                disabled={placing}
                className="btn-primary disabled:opacity-50"
              >
                {placing ? t('menuPage.placing') : t('menuPage.placeOrder')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
