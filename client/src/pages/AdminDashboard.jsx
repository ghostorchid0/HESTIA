import { useEffect } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { socket } from '../socket'
import OrdersPanel from '../components/OrdersPanel'
import MenuPanel from '../components/MenuPanel'
import RoomsPanel from '../components/RoomsPanel'
import AnalyticsPanel from '../components/AnalyticsPanel'

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
      className={`rounded-lg px-4 py-2 text-sm font-medium ${path.startsWith(to) ? 'bg-amber-100 text-amber-800' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      {label}
    </Link>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 border-b bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-amber-600">{t('appName')}</span>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 uppercase">{role}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleLang} className="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200">
              {i18n.language === 'fr' ? 'EN' : 'FR'}
            </button>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-800">{t('admin.logout')}</button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl p-4 md:flex md:gap-6">
        <nav className="mb-4 flex flex-wrap gap-2 md:w-48 md:flex-col">
          <NavItem to="/admin/dashboard" label={t('admin.orders')} />
          {role === 'admin' && <NavItem to="/admin/menu" label={t('admin.menu')} />}
          {role === 'admin' && <NavItem to="/admin/rooms" label={t('admin.rooms')} />}
          {role === 'admin' && <NavItem to="/admin/analytics" label={t('admin.analytics')} />}
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
        <Route path="*" element={<OrdersPanel />} />
      </Routes>
    </Layout>
  )
}
