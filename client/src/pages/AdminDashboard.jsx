import { useEffect } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { socket } from '../socket'
import { unlockAudio } from '../utils/beep'
import useSettings from '../hooks/useSettings'
import OrdersPanel from '../components/OrdersPanel'
import MenuPanel from '../components/MenuPanel'
import RoomsPanel from '../components/RoomsPanel'
import SettingsPanel from '../components/SettingsPanel'
import HotelsPanel from '../components/HotelsPanel'

function Layout({ children }) {
  const { t, i18n } = useTranslation()
  const { settings } = useSettings()
  const role = localStorage.getItem('hestia_role')
  const isAdmin = role === 'admin' || role === 'superadmin'
  const isSuperadmin = role === 'superadmin'
  const isStaff = isAdmin || role === 'kitchen' || role === 'reception'
  const location = useLocation()
  const path = location.pathname

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
      <header className="print:hidden sticky top-0 z-30 border-b border-hestia-linen bg-hestia-navy px-6 py-4 shadow-soft">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-serif text-2xl text-white">{settings?.hotelName || 'Hestia'}</span>
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
      <div className="mx-auto max-w-6xl p-6 print:max-w-none print:p-0 md:flex md:gap-8">
        <nav className="print:hidden mb-6 flex flex-wrap gap-2 md:w-56 md:flex-col">
          {isStaff && <NavItem to="/admin/dashboard" label={t('admin.orders')} />}
          {isAdmin && <NavItem to="/admin/menu" label={t('admin.menu')} />}
          {isAdmin && <NavItem to="/admin/rooms" label={t('admin.rooms')} />}
          {isAdmin && <NavItem to="/admin/settings" label={t('admin.settings')} />}
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
    if (!token) return
    const joinStaff = () => socket.emit('join_staff')
    socket.on('connect', joinStaff)
    if (socket.connected) joinStaff()
    else socket.connect()
    return () => {
      socket.off('connect', joinStaff)
      socket.emit('leave_staff')
    }
  }, [token])

  useEffect(() => {
    const unlock = () => unlockAudio()
    document.addEventListener('click', unlock, { once: true })
    document.addEventListener('touchstart', unlock, { once: true })
    document.addEventListener('keydown', unlock, { once: true })
    return () => {
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
      document.removeEventListener('keydown', unlock)
    }
  }, [])

  return (
    <Layout>
      <Routes>
        <Route path="dashboard" element={<OrdersPanel />} />
        <Route path="menu" element={<MenuPanel />} />
        <Route path="rooms" element={<RoomsPanel />} />
        <Route path="settings" element={<SettingsPanel />} />
        <Route path="hotels" element={<HotelsPanel />} />
        <Route path="*" element={<OrdersPanel />} />
      </Routes>
    </Layout>
  )
}
