import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { socket } from '../socket'
import api from '../api'
import useSettings from '../hooks/useSettings'
import OrdersPanel from '../components/OrdersPanel'
import MenuPanel from '../components/MenuPanel'
import RoomsPanel from '../components/RoomsPanel'
import AnalyticsPanel from '../components/AnalyticsPanel'

const ReportsPanel = lazy(() => import('../components/ReportsPanel'))
const SalesReportPanel = lazy(() => import('../components/SalesReportPanel'))
const StaffPanel = lazy(() => import('../components/StaffPanel'))
const SettingsPanel = lazy(() => import('../components/SettingsPanel'))
const HotelsPanel = lazy(() => import('../components/HotelsPanel'))
const ReviewsPanel = lazy(() => import('../components/ReviewsPanel'))

function Layout({ children }) {
  const { t, i18n } = useTranslation()
  const { settings, refresh } = useSettings()
  const role = localStorage.getItem('hestia_role')
  const isAdmin = role === 'admin' || role === 'superadmin'
  const isSuperadmin = role === 'superadmin'
  const location = useLocation()
  const path = location.pathname
  const [hotels, setHotels] = useState([])
  const [activeHotel, setActiveHotel] = useState(localStorage.getItem('hestia_hotel') || '')

  useEffect(() => {
    if (isSuperadmin) {
      api.get('/admin/hotels').then(res => setHotels(res.data)).catch(() => {})
    }
  }, [isSuperadmin])

  useEffect(() => {
    if (!activeHotel) return
    localStorage.setItem('hestia_hotel', activeHotel)
    refresh({ hotelId: activeHotel })
  }, [activeHotel, refresh])

  const changeHotel = (id) => {
    setActiveHotel(id)
    window.location.reload()
  }

  const logout = () => {
    localStorage.removeItem('hestia_token')
    localStorage.removeItem('hestia_role')
    localStorage.removeItem('hestia_hotel')
    window.location.href = '/admin/login'
  }

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')
  }

  const NavItem = ({ to, label }) => (
    <Link
      to={to}
      className={`rounded-xl px-5 py-3 text-sm font-medium transition ${
        path.startsWith(to)
          ? 'bg-hestia-gold/10 text-hestia-gold'
          : 'text-gray-400 hover:bg-hestia-navy-light hover:text-white'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <div className="min-h-screen bg-hestia-cream">
      <header className="sticky top-0 z-30 border-b border-hestia-linen bg-hestia-navy px-6 py-4 shadow-soft">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-serif text-2xl text-white">{settings?.hotelName || 'Hestia'}</span>
            <span className="rounded border border-hestia-gold/30 px-2 py-0.5 text-xs uppercase tracking-wider text-hestia-gold">{role}</span>
          </div>
          <div className="flex items-center gap-3">
            {isSuperadmin && hotels.length > 0 && (
              <select value={activeHotel} onChange={e => changeHotel(e.target.value)} className="rounded-lg border border-white/10 bg-transparent px-3 py-1.5 text-sm text-white">
                <option value="">{t('admin.selectHotel')}</option>
                {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
              </select>
            )}
            <button onClick={toggleLang} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10">
              {i18n.language === 'fr' ? 'EN' : 'FR'}
            </button>
            <button onClick={logout} className="text-sm text-white/70 hover:text-white">{t('admin.logout')}</button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl p-6 md:flex md:gap-8">
        <nav className="mb-6 flex flex-wrap gap-2 md:w-56 md:flex-col">
          <NavItem to="/admin/dashboard" label={t('admin.orders')} />
          {isAdmin && <NavItem to="/admin/menu" label={t('admin.menu')} />}
          {isAdmin && <NavItem to="/admin/rooms" label={t('admin.rooms')} />}
          {isAdmin && <NavItem to="/admin/analytics" label={t('admin.analytics')} />}
          {isAdmin && <NavItem to="/admin/reports" label={t('admin.reports')} />}
          {isAdmin && <NavItem to="/admin/sales-report" label={t('admin.salesReport')} />}
          {isAdmin && <NavItem to="/admin/staff" label={t('admin.staff')} />}
          {isAdmin && <NavItem to="/admin/settings" label={t('admin.settings')} />}
          {isAdmin && <NavItem to="/admin/reviews" label={t('admin.reviews')} />}
          {isSuperadmin && <NavItem to="/admin/hotels" label={t('admin.hotels')} />}
        </nav>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const token = localStorage.getItem('hestia_token')

  useEffect(() => {
    if (!token) navigate('/admin/login')
  }, [token, navigate])

  useEffect(() => {
    socket.emit('join_kitchen')
    return () => {
      socket.emit('leave_kitchen')
    }
  }, [])

  return (
    <Layout>
      <Routes>
        <Route path="dashboard" element={<OrdersPanel />} />
        <Route path="menu" element={<MenuPanel />} />
        <Route path="rooms" element={<RoomsPanel />} />
        <Route path="analytics" element={<AnalyticsPanel />} />
        <Route path="reports" element={
          <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-hestia-linen border-t-hestia-gold" /></div>}>
            <ReportsPanel />
          </Suspense>
        } />
        <Route path="sales-report" element={
          <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-hestia-linen border-t-hestia-gold" /></div>}>
            <SalesReportPanel />
          </Suspense>
        } />
        <Route path="staff" element={
          <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-hestia-linen border-t-hestia-gold" /></div>}>
            <StaffPanel />
          </Suspense>
        } />
        <Route path="settings" element={
          <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-hestia-linen border-t-hestia-gold" /></div>}>
            <SettingsPanel />
          </Suspense>
        } />
        <Route path="hotels" element={
          <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-hestia-linen border-t-hestia-gold" /></div>}>
            <HotelsPanel />
          </Suspense>
        } />
        <Route path="reviews" element={
          <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-hestia-linen border-t-hestia-gold" /></div>}>
            <ReviewsPanel />
          </Suspense>
        } />
        <Route path="*" element={<OrdersPanel />} />
      </Routes>
    </Layout>
  )
}
