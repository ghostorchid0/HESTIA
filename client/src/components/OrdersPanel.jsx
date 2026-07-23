import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'
import { socket } from '../socket'
import { playBeep } from '../utils/beep'
import { formatCurrency } from '../utils/format'
import useSettings from '../hooks/useSettings'

const allStatuses = ['Received', 'Preparing', 'On the way', 'Delivered', 'Cancelled']
const paymentMethodKeys = {
  'Cash on delivery': 'cashOnDelivery',
  'Mobile Money': 'mobileMoney',
  'Room charge': 'roomCharge',
}

export default function OrdersPanel() {
  const { t } = useTranslation()
  const { settings } = useSettings()
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

  const togglePayment = async (order) => {
    const next = order.paymentStatus === 'Paid' ? 'Pending' : 'Paid'
    await api.patch(`/admin/orders/${order._id}/payment`, { paymentStatus: next })
    fetchOrders()
  }

  const statusBadge = (status) => {
    const base = 'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider'
    const map = {
      Received: 'bg-hestia-navy/10 text-hestia-navy',
      Preparing: 'bg-amber-100 text-amber-700',
      'On the way': 'bg-hestia-gold/10 text-hestia-gold',
      Delivered: 'bg-green-100 text-green-700',
      Cancelled: 'bg-red-100 text-red-700',
    }
    return `${base} ${map[status] || 'bg-gray-100 text-gray-600'}`
  }

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-light text-hestia-navy">{t('ordersPanel.title')}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSound}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${soundEnabled ? 'bg-hestia-gold/10 text-hestia-gold' : 'bg-gray-100 text-gray-600'}`}
          >
            {soundEnabled ? 'Son ON' : 'Son OFF'}
          </button>
          <button onClick={downloadExcel} className="rounded-lg border border-hestia-linen bg-white px-4 py-2 text-sm font-medium text-hestia-navy transition hover:bg-hestia-linen">
            Excel
          </button>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-luxe"
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

      <div className="space-y-5">
        {filtered.map((order) => (
          <div key={order._id} className="card-luxe p-6 transition hover:shadow-luxe">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('room')}</p>
                <p className="font-serif text-2xl text-hestia-navy">{order.roomNumber}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={statusBadge(order.status)}>{t(`status.${order.status}`)}</span>
                <span className="text-xs text-gray-500">{t(`paymentMethods.${paymentMethodKeys[order.paymentMethod] || 'cashOnDelivery'}`)}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {t(`paymentStatus.${order.paymentStatus || 'Pending'}`)}
                </span>
                <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <ul className="space-y-2 border-t border-hestia-linen pt-4 text-sm text-gray-700">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>{item.quantity}x {item.name} {item.notes && <span className="text-gray-400">({item.notes})</span>}</span>
                </li>
              ))}
            </ul>
            {order.notes && <p className="mt-3 text-sm text-gray-500">{t('note')}: {order.notes}</p>}

            {order.history && order.history.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{t('ordersPanel.statusHistory')}</p>
                <div className="flex flex-wrap gap-2">
                  {order.history.map((h, idx) => (
                    <span key={idx} className="rounded-full bg-hestia-cream px-3 py-1 text-xs text-gray-600">
                      {t(`status.${h.status}`)} <span className="text-gray-400">({t('ordersPanel.by')} {h.changedBy})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-hestia-linen pt-4">
              <div>
                <span className="font-serif text-xl text-hestia-navy">{t('total')} <span className="text-hestia-gold">{formatCurrency(order.total, settings?.currency)}</span></span>
                <p className="text-xs text-gray-400">{t('ordersPanel.payment')}: {t(`paymentStatus.${order.paymentStatus || 'Pending'}`)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {allStatuses
                  .filter((s) => s !== order.status)
                  .map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(order._id, s)}
                      className="rounded-lg border border-hestia-linen bg-white px-3 py-1.5 text-xs font-medium text-hestia-navy transition hover:bg-hestia-linen"
                    >
                      {t(`status.${s}`)}
                    </button>
                  ))}
                <button
                  onClick={() => togglePayment(order)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${order.paymentStatus === 'Paid' ? 'border border-hestia-linen bg-white text-hestia-navy hover:bg-hestia-linen' : 'bg-hestia-gold/10 text-hestia-gold hover:bg-hestia-gold hover:text-white'}`}
                >
                  {order.paymentStatus === 'Paid' ? t('ordersPanel.markPending') : t('ordersPanel.markPaid')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
