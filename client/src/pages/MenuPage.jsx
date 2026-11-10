import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api'
import useSettings from '../hooks/useSettings'
import { formatCurrency } from '../utils/format'
import ImageWithFallback from '../components/ImageWithFallback'
import Icon from '../components/Icon'
import BrandAccent from '../components/BrandAccent'

export default function MenuPage() {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const { uuid } = useParams()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash on delivery')
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [activeCategory, setActiveCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({ vegetarian: false, spicy: false, glutenFree: false })
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('hestia_dark_mode') === 'true')
  const [showSuccess, setShowSuccess] = useState(false)
  const categoryRefs = useRef({})

  useEffect(() => {
    api.get('/menu', { params: { roomUuid: uuid } })
      .then(res => {
        setItems(res.data)
        const cats = [...new Set(res.data.map(i => i.category))]
        setCategories(cats)
        setActiveCategory(cats[0] || '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [uuid])

  useEffect(() => {
    localStorage.setItem('hestia_dark_mode', darkMode)
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item._id)
      if (existing) {
        return prev.map(i => i.menuItemId === item._id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1, notes: '', imageUrl: item.imageUrl }]
    })
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(i => i.menuItemId === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
  }

  const updateNotes = (id, value) => {
    setCart(prev => prev.map(i => i.menuItemId === id ? { ...i, notes: value } : i))
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.menuItemId !== id))

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

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

  const scrollToCategory = (category) => {
    setActiveCategory(category)
    const element = categoryRefs.current[category]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const filteredItems = items.filter(item => {
    // Search filter
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    // Category filter
    if (activeCategory && item.category !== activeCategory) {
      return false
    }
    
    // Dietary filters
    if (filters.vegetarian && !item.tags?.includes('vegetarian')) {
      return false
    }
    if (filters.spicy && !item.tags?.includes('spicy')) {
      return false
    }
    if (filters.glutenFree && !item.tags?.includes('gluten-free')) {
      return false
    }
    
    return true
  })

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {})

  if (loading) {
    return (
      <BrandAccent>
        <div className={`flex min-h-screen items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-hestia-cream'}`}>
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-hestia-linen border-t-hestia-gold" />
        </div>
      </BrandAccent>
    )
  }

  return (
    <BrandAccent>
    <div className={`min-h-screen pb-24 sm:pb-8 transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-hestia-cream text-gray-900'}`}>
      {/* Hero Section */}
      <section className={`relative overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-hestia-navy'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-hestia-navy via-hestia-navy-light to-hestia-navy" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
          {settings?.logoUrl && (
            <ImageWithFallback 
              src={settings.logoUrl} 
              alt={settings.hotelName} 
              className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-white/10 object-contain p-2 backdrop-blur-sm"
            />
          )}
          <div className="mb-4 flex items-center justify-center gap-2">
            <Icon name="home" size={24} color="#C9A227" />
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-hestia-gold">
              {settings?.hotelName || t('appName')}
            </span>
          </div>
          <h1 className="text-4xl font-light text-white sm:text-5xl md:text-6xl">
            {t('menuPage.title')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/80 sm:text-lg">
            {t('menuPage.subtitle') || 'Découvrez notre carte et commandez directement depuis votre chambre'}
          </p>
          
          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <Icon name={darkMode ? 'sun' : 'moon'} size={20} />
          </button>
        </div>
      </section>

      {/* Sticky Navigation */}
      <div className={`sticky top-0 z-20 border-b backdrop-blur-md ${darkMode ? 'border-gray-700 bg-gray-900/80' : 'border-hestia-linen bg-white/80'}`}>
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Icon name="search" size={18} color={darkMode ? '#9CA3AF' : '#6B7280'} className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('menuPage.search') || 'Rechercher un plat...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-xl py-2 pl-10 pr-4 text-sm transition ${darkMode ? 'bg-gray-800 text-white placeholder-gray-500' : 'bg-hestia-cream text-gray-900 placeholder-gray-400'}`}
              />
            </div>
            
            {/* Cart button */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative rounded-xl bg-hestia-navy p-2 text-white transition hover:bg-hestia-navy-light"
            >
              <Icon name="cart" size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-hestia-gold text-xs font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
          
          {/* Category pills */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => scrollToCategory(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeCategory === cat
                    ? 'bg-hestia-gold text-white'
                    : darkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-hestia-cream text-gray-600 hover:bg-hestia-linen'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          {/* Filters */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setFilters({ ...filters, vegetarian: !filters.vegetarian })}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                filters.vegetarian
                  ? 'bg-green-500 text-white'
                  : darkMode
                    ? 'bg-gray-800 text-gray-300'
                    : 'bg-hestia-cream text-gray-600'
              }`}
            >
              {t('menuPage.vegetarian') || 'Végétarien'}
            </button>
            <button
              onClick={() => setFilters({ ...filters, spicy: !filters.spicy })}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                filters.spicy
                  ? 'bg-red-500 text-white'
                  : darkMode
                    ? 'bg-gray-800 text-gray-300'
                    : 'bg-hestia-cream text-gray-600'
              }`}
            >
              {t('menuPage.spicy') || 'Épicé'}
            </button>
            <button
              onClick={() => setFilters({ ...filters, glutenFree: !filters.glutenFree })}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                filters.glutenFree
                  ? 'bg-blue-500 text-white'
                  : darkMode
                    ? 'bg-gray-800 text-gray-300'
                    : 'bg-hestia-cream text-gray-600'
              }`}
            >
              {t('menuPage.glutenFree') || 'Sans gluten'}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <section
            key={category}
            ref={(el) => categoryRefs.current[category] = el}
            className="mb-12 scroll-mt-32"
          >
            <h2 className={`mb-6 border-b pb-2 text-2xl font-light ${darkMode ? 'border-gray-700 text-white' : 'border-hestia-linen text-hestia-navy'}`}>
              {category}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {categoryItems.map((item, index) => (
                <div
                  key={item._id}
                  className={`group overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-xl ${
                    darkMode
                      ? 'bg-gray-800 text-white hover:bg-gray-750'
                      : 'bg-white text-gray-900 hover:bg-hestia-cream'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative overflow-hidden">
                    <ImageWithFallback
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {item.tags?.includes('popular') && (
                      <span className="absolute left-3 top-3 rounded-full bg-hestia-gold px-3 py-1 text-xs font-semibold text-white">
                        {t('menuPage.popular') || 'Populaire'}
                      </span>
                    )}
                    {item.tags?.includes('new') && (
                      <span className="absolute left-3 top-3 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
                        {t('menuPage.new') || 'Nouveau'}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-hestia-navy'}`}>
                          {item.name}
                        </h3>
                        <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {item.description}
                        </p>
                        {item.tags && item.tags.length > 0 && (
                          <div className="mt-2 flex gap-1">
                            {item.tags.slice(0, 2).map(tag => (
                              <span
                                key={tag}
                                className={`rounded-full px-2 py-0.5 text-xs ${
                                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-hestia-cream text-gray-600'
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-serif text-xl text-hestia-gold">
                          {item.price === 0 ? t('menuPage.free') : formatCurrency(item.price, settings?.currency)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className={`mt-4 w-full rounded-xl py-2 font-medium transition ${
                        darkMode
                          ? 'bg-hestia-gold text-white hover:bg-hestia-gold-dark'
                          : 'bg-hestia-navy text-white hover:bg-hestia-navy-light'
                      }`}
                    >
                      {t('menuPage.add') || 'Ajouter'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
        
        {Object.keys(groupedItems).length === 0 && (
          <div className={`py-12 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('menuPage.noItems') || 'Aucun article trouvé'}
          </div>
        )}
      </main>

      {/* Cart Bottom Sheet */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <div className={`absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl shadow-2xl ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className={`sticky top-0 border-b p-4 ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-hestia-linen bg-white'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-hestia-navy'}`}>
                  {t('menuPage.yourOrder')}
                </h2>
                <button
                  onClick={() => setCartOpen(false)}
                  className={`rounded-full p-2 transition ${darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-hestia-cream'}`}
                >
                  <Icon name="close" size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-4 pb-8">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  {t('menuPage.emptyCart') || 'Votre panier est vide'}
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.menuItemId} className={`rounded-xl p-3 ${darkMode ? 'bg-gray-800' : 'bg-hestia-cream'}`}>
                        <div className="flex items-start gap-3">
                          {item.imageUrl && (
                            <ImageWithFallback
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-16 w-16 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-hestia-navy'}`}>
                                  {item.name}
                                </h3>
                                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {formatCurrency(item.price, settings?.currency)}
                                </span>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.menuItemId)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Icon name="trash" size={18} />
                              </button>
                            </div>
                            
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.menuItemId, -1)}
                                className={`flex h-8 w-8 items-center justify-center rounded-full ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-hestia-navy'} transition`}
                              >
                                −
                              </button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.menuItemId, 1)}
                                className={`flex h-8 w-8 items-center justify-center rounded-full ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-hestia-navy'} transition`}
                              >
                                +
                              </button>
                            </div>
                            
                            <input
                              value={item.notes}
                              onChange={(e) => updateNotes(item.menuItemId, e.target.value)}
                              placeholder={t('menuPage.notesPlaceholder')}
                              className={`mt-2 w-full rounded-lg px-3 py-1 text-sm ${darkMode ? 'bg-gray-700 text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'}`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className={`mt-6 border-t pt-4 ${darkMode ? 'border-gray-700' : 'border-hestia-linen'}`}>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t('menuPage.additionalRequest')}
                      className={`mb-4 w-full rounded-xl px-4 py-2 text-sm ${darkMode ? 'bg-gray-800 text-white placeholder-gray-500' : 'bg-hestia-cream text-gray-900 placeholder-gray-400'}`}
                      rows="2"
                    />
                    
                    <div className="mb-4">
                      <label className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('menuPage.paymentMethod')}
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className={`w-full rounded-xl px-4 py-2 text-sm ${darkMode ? 'bg-gray-800 text-white' : 'bg-hestia-cream text-gray-900'}`}
                      >
                        <option value="Cash on delivery">{t('paymentMethods.cashOnDelivery')}</option>
                        <option value="Mobile Money">{t('paymentMethods.mobileMoney')}</option>
                        <option value="Room charge">{t('paymentMethods.roomCharge')}</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('total')}</span>
                        <div className="font-serif text-2xl text-hestia-gold">
                          {formatCurrency(total, settings?.currency)}
                        </div>
                      </div>
                      <button
                        onClick={placeOrder}
                        disabled={placing}
                        className="btn-primary disabled:opacity-50"
                      >
                        {placing ? t('menuPage.placing') : t('menuPage.placeOrder')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform">
          <div className="flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-white shadow-lg">
            <Icon name="check" size={16} />
            <span className="text-sm font-medium">{t('menuPage.addedToCart') || 'Ajouté au panier'}</span>
          </div>
        </div>
      )}

      {/* Floating Cart Button (Mobile) */}
      {cart.length > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-hestia-navy text-white shadow-luxe transition hover:bg-hestia-navy-light sm:hidden"
        >
          <Icon name="cart" size={24} />
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-hestia-gold text-xs font-bold text-white">
            {cartCount}
          </span>
        </button>
      )}

      {/* Footer */}
      <footer className={`mt-16 border-t py-8 ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-hestia-linen bg-white'}`}>
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon name="home" size={20} color="#C9A227" />
            <span className="font-serif text-lg text-hestia-navy dark:text-white">
              {settings?.hotelName || 'Hestia'}
            </span>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('menuPage.footer') || 'Service Room Service - Commandez depuis votre chambre'}
          </p>
          <p className={`mt-2 text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
            Powered by Hestia
          </p>
        </div>
      </footer>
    </div>
    </BrandAccent>
  )
}
