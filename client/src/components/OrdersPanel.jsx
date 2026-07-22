import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'
import { socket } from '../socket'
import { playBeep } from '../utils/beep'

const allStatuses = ['Received', 'Preparing', 'On the way', 'Delivered', 'Cancelled']

export default function OrdersPanel() {
  const { t } = useTranslation()
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('hestia_sound')
    return stored === null ? true : stored === 'true'
  })

  const fetchOrders = async () => {
    const res = await api.get('/admin/orders?limit=200')
    setOrders(res.data)
  }

  const toggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    localStorage.setItem('hestia_sound', next)
  }

  const downloadExcel = async () => {
    const token = localStorage.getItem('hestia_token')
    const res = await fetch('/api/admin/orders/export', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'hestia-orders.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  useEffect(() => {
    fetchOrders()
    socket.on('new_order', (order) => {
      setOrders((prev) => [order, ...prev])
      if (soundEnabled) playBeep()
    })
    socket.on('order_status_updated', (order) => {
      setOrders((prev) => prev.map((o) => (o._id === order._id ? order : o)))
    })
    return () => {
      socket.off('new_order')
      socket.off('order_status_updated')
    }
  }, [soundEnabled])

  const updateStatus = async (id, status) => {
    await api.patch(`/admin/orders/${id}/status`, { status })
    fetchOrders()
  }

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('ordersPanel.title')}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${soundEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
            title={soundEnabled ? 'Sound on' : 'Sound off'}
          >
            {soundEnabled ? 'Son ON' : 'Son OFF'}
          </button>
          <button onClick={downloadExcel} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200">
            Excel
          </button>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">{t('ordersPanel.all')}</option>
            {allStatuses.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-4">
        {filtered.map((order) => (
          <div key={order._id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-lg font-bold">
                  {t('room')} {order.roomNumber}
                </span>
                <span className="ml-3 rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                  {t(`status.${order.status}`)}
                </span>
              </div>
              <span className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <ul className="mb-3 text-sm text-gray-700">
              {order.items.map((item, idx) => (
                <li key={idx}>
                  {item.quantity}x {item.name} {item.notes && <span className="text-gray-400">({item.notes})</span>}
                </li>
              ))}
            </ul>
            {order.notes && (
              <p className="mb-3 text-sm text-gray-500">
                {t('note')}: {order.notes}
              </p>
            )}
            {order.history && order.history.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-medium text-gray-500">{t('ordersPanel.statusHistory')}</p>
                <div className="flex flex-wrap gap-2">
                  {order.history.map((h, idx) => (
                    <span key={idx} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {t(`status.${h.status}`)}{' '}
                      <span className="text-gray-400">
                        ({t('ordersPanel.by')} {h.changedBy})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-semibold">
                {t('total')}: ${order.total.toFixed(2)}
              </span>
              <div className="flex flex-wrap gap-2">
                {allStatuses
                  .filter((s) => s !== order.status)
                  .map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(order._id, s)}
                      className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium hover:bg-gray-200"
                    >
                      {t(`status.${s}`)}
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
