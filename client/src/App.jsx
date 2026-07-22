import { Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import RoomPage from './pages/RoomPage'
import MenuPage from './pages/MenuPage'
import OrderStatusPage from './pages/OrderStatusPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <div className="min-h-screen">
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
        <h1 className="text-3xl font-bold text-amber-600 mb-2">{t('appName')}</h1>
        <p className="text-gray-600 mb-6">{t('tagline')}</p>
        <p className="text-sm text-gray-500">Scan your room QR code to continue.</p>
      </div>
    </div>
  )
}

export default App
