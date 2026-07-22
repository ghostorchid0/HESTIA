import { useEffect, useState } from 'react'
import api from '../api'
import { socket } from '../socket'

const statuses = ['Received', 'Preparing', 'On the way', 'Delivered', 'Cancelled']

export default function OrdersPanel() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('')
  const [audio] = useState(() => typeof Audio !== 'undefined' ? new Audio('/notification.mp3') : null)

  const fetchOrders = async () => {
    const res = await api.get('/admin/orders?limit=200')
    setOrders(res.data)
  }

  useEffect(() => {
    fetchOrders()
    socket.on('new_order', (order) => {
      setOrders(prev => [order, ...prev])
      if (audio) audio.play().catch(() => {})
    })
    socket.on('order_status_updated', (order) => {
      setOrders(prev => prev.map(o => o._id === order._id ? order : o))
    })
    return () => {
      socket.off('new_order')
      socket.off('order_status_updated')
    }
  }, [audio])

  const updateStatus = async (id, status) => {
    await api.patch(`/admin/orders/${id}/status`, { status })
    fetchOrders()
  }

  const filtered = filter ? orders.filter(o => o.status === filter) : orders

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="space-y-4">
        {filtered.map(order => (
          <div key={order._id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-lg font-bold">Room {order.roomNumber}</span>
                <span className="ml-3 rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">{order.status}</span>
              </div>
              <span className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <ul className="mb-3 text-sm text-gray-700">
              {order.items.map((item, idx) => (
                <li key={idx}>{item.quantity}x {item.name} {item.notes && <span className="text-gray-400">({item.notes})</span>}</li>
              ))}
            </ul>
            {order.notes && <p className="mb-3 text-sm text-gray-500">Note: {order.notes}</p>}
            {order.history && order.history.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Status history</p>
                <div className="flex flex-wrap gap-2">
                  {order.history.map((h, idx) => (
                    <span key={idx} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {h.status} <span className="text-gray-400">({h.changedBy})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-semibold">Total: ${order.total.toFixed(2)}</span>
              <div className="flex flex-wrap gap-2">
                {statuses.filter(s => s !== order.status).map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(order._id, s)}
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium hover:bg-gray-200"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
