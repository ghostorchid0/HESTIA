import { Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import RoomPage from './pages/RoomPage'
import MenuPage from './pages/MenuPage'
import OrderStatusPage from './pages/OrderStatusPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <div className="min-h-screen bg-hestia-cream">
      <Routes>
        <Route path="/room/:uuid" element={<RoomPage />} />
        <Route path="/room/:uuid/menu" element={<MenuPage />} />
        <Route path="/room/:uuid/order/:orderId" element={<OrderStatusPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/" element={<RoomEntry />} />
      </Routes>
    </div>
  )
}

function RoomEntry() {
  const { t } = useTranslation()
  return (
    <div className="relative flex min-h-screen items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-hestia-linen/60 via-transparent to-transparent" />
      <div className="card-luxe relative z-10 w-full max-w-md p-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-hestia-gold">{t('tagline')}</p>
        <h1 className="mt-4 text-5xl font-light text-hestia-navy">{t('appName')}</h1>
        <div className="mx-auto mt-6 h-px w-16 bg-hestia-gold" />
        <p className="mt-6 text-sm leading-relaxed text-gray-600">
          Scan your room QR code to enjoy an refined in-room dining experience.
        </p>
      </div>
    </div>
  )
}

export default App
