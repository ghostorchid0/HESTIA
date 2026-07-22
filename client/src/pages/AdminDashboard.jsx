import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { socket } from '../socket'
import OrdersPanel from '../components/OrdersPanel'
import MenuPanel from '../components/MenuPanel'
import RoomsPanel from '../components/RoomsPanel'
import AnalyticsPanel from '../components/AnalyticsPanel'

const ReportsPanel = lazy(() => import('../components/ReportsPanel'))
const SalesReportPanel = lazy(() => import('../components/SalesReportPanel'))
const StaffPanel = lazy(() => import('../components/StaffPanel'))

function Layout({ children }) {
  const { t, i18n } = useTranslation()
  const role = localStorage.getItem('hestia_role')
  const location = useLocation()
  const path = location.pathname

  const logout = () => {
    localStorage.removeItem('hestia_token')
    localStorage.removeItem('hestia_role')
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
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif text-2xl text-white">Hestia</span>
            <span className="rounded border border-hestia-gold/30 px-2 py-0.5 text-xs uppercase tracking-wider text-hestia-gold">{role}</span>
          </div>
          <div className="flex items-center gap-3">
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
          {role === 'admin' && <NavItem to="/admin/menu" label={t('admin.menu')} />}
          {role === 'admin' && <NavItem to="/admin/rooms" label={t('admin.rooms')} />}
          {role === 'admin' && <NavItem to="/admin/analytics" label={t('admin.analytics')} />}
          {role === 'admin' && <NavItem to="/admin/reports" label={t('admin.reports')} />}
          {role === 'admin' && <NavItem to="/admin/sales-report" label={t('admin.salesReport')} />}
          {role === 'admin' && <NavItem to="/admin/staff" label={t('admin.staff')} />}
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
        <Route path="*" element={<OrdersPanel />} />
      </Routes>
    </Layout>
  )
}
