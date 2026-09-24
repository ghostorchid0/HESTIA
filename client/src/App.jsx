import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
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
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </div>
  )
}

export default App
