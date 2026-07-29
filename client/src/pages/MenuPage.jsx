import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api'
import useSettings from '../hooks/useSettings'
import { formatCurrency } from '../utils/format'

export default function MenuPage() {
  const { t } = useTranslation()
  const { settings } = useSettings()
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
    api.get('/menu', { params: { roomUuid: uuid } })
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
    <div className="min-h-screen bg-hestia-cream pb-72 sm:pb-80">
      <header className="sticky top-0 z-20 border-b border-hestia-linen bg-white/80 px-4 py-4 backdrop-blur-md sm:px-6 sm:py-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-hestia-gold">{settings?.hotelName || t('appName')}</p>
          <h1 className="mt-1 text-2xl font-light text-hestia-navy sm:text-3xl">{t('menuPage.title')}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-8 sm:px-6 sm:pt-10">
        {categories.map(cat => (
          <section key={cat} className="mb-10">
            <h2 className="mb-5 border-b border-hestia-linen pb-2 text-xl font-light text-hestia-navy sm:text-2xl">{cat}</h2>
            <div className="space-y-4">
              {items.filter(i => i.category === cat).map(item => (
                <div key={item._id} className="card-luxe flex flex-col gap-4 p-4 transition hover:shadow-luxe sm:flex-row sm:items-center sm:gap-5 sm:p-5">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="mx-auto h-20 w-20 rounded-2xl object-cover shadow-sm sm:mx-0" />
                  ) : (
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-hestia-linen text-2xl text-hestia-gold sm:mx-0">✦</div>
                  )}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col items-center gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <h3 className="text-lg font-semibold text-hestia-navy">{item.name}</h3>
                      <span className="font-serif text-lg text-hestia-gold">
                        {item.price === 0 ? t('menuPage.free') : formatCurrency(item.price, settings?.currency)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{item.description}</p>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="btn-outline w-full sm:w-auto"
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
        <div className="fixed inset-x-0 bottom-0 z-30 max-h-[70vh] overflow-y-auto rounded-t-4xl bg-white p-4 shadow-luxe sm:p-6">
          <div className="mx-auto max-w-2xl">
            <h3 className="text-lg font-light text-hestia-navy sm:text-xl">{t('menuPage.yourOrder')}</h3>
            <div className="mt-4 space-y-3">
              {cart.map(item => (
                <div key={item.menuItemId} className="flex flex-col gap-2 rounded-2xl bg-hestia-cream p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <span className="font-medium text-hestia-navy">{item.name}</span>
                    <input
                      value={item.notes}
                      onChange={(e) => updateNotes(item.menuItemId, e.target.value)}
                      placeholder={t('menuPage.notesPlaceholder')}
                      className="input-luxe mt-1 w-full"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:ml-4 sm:justify-start">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.menuItemId, -1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-hestia-navy transition hover:bg-hestia-linen">−</button>
                      <span className="w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.menuItemId, 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-hestia-navy transition hover:bg-hestia-linen">+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.menuItemId)} className="text-red-500">×</button>
                  </div>
                </div>
              ))}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('menuPage.additionalRequest')}
              className="input-luxe mt-4 w-full"
              rows="2"
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
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-serif text-xl text-hestia-navy sm:text-2xl">{t('total')} <span className="text-hestia-gold">{formatCurrency(total, settings?.currency)}</span></span>
              <button
                onClick={placeOrder}
                disabled={placing}
                className="btn-primary w-full sm:w-auto disabled:opacity-50"
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
