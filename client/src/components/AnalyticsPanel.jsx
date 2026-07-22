import { useEffect, useState } from 'react'
import api from '../api'

export default function AnalyticsPanel() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/admin/analytics').then(res => setData(res.data))
  }, [])

  if (!data) return <p className="text-gray-500">Loading...</p>

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Analytics</h1>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-3xl font-bold text-amber-600">{data.totalOrders}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Delivered</p>
          <p className="text-3xl font-bold text-green-600">{data.deliveredOrders}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-3xl font-bold text-amber-600">${data.revenue.toFixed(2)}</p>
        </div>
      </div>
      <h2 className="mb-3 text-lg font-semibold">Recent Orders</h2>
      <div className="space-y-3">
        {data.recentOrders.map(order => (
          <div key={order._id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm text-sm">
            <span>Room {order.roomNumber}</span>
            <span className="rounded bg-gray-100 px-2 py-1">{order.status}</span>
            <span className="font-medium">${order.total.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
