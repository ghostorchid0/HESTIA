import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'
import { socket } from '../socket'
import { playBeep } from '../utils/beep'
import { formatCurrency } from '../utils/format'
import useSettings from '../hooks/useSettings'
import Pagination from './Pagination'

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
  const [knownOrderIds, setKnownOrderIds] = useState(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedOrders, setSelectedOrders] = useState(new Set())
  const [newOrderIds, setNewOrderIds] = useState(new Set())

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get(`/admin/orders?page=${currentPage}&limit=${itemsPerPage}`)
      const newOrders = Array.isArray(res.data) ? res.data : []
      // Detect new orders by comparing IDs
      const hasNewOrder = newOrders.some(o => !knownOrderIds.has(o._id))
      if (hasNewOrder && soundEnabled && knownOrderIds.size > 0) {
        playBeep()
      }
      // Update known order IDs
      setKnownOrderIds(new Set(newOrders.map(o => o._id)))
      setOrders(newOrders)
      // Update total pages from response headers if available
      const totalCount = res.headers?.get('x-total-count')
      if (totalCount) {
        setTotalPages(Math.ceil(totalCount / itemsPerPage))
      }
    } catch (err) {
      console.error('Failed to fetch orders', err)
      setOrders([])
    }
  }, [currentPage, itemsPerPage, soundEnabled, knownOrderIds])

  const toggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    localStorage.setItem('hestia_sound', next)
  }

  const toggleOrderSelection = (orderId) => {
    const newSelected = new Set(selectedOrders)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrders(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(orders.map(o => o._id)))
    }
  }

  const deleteOrder = async (orderId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) return
    try {
      await api.delete(`/admin/orders/${orderId}`)
      fetchOrders()
    } catch (err) {
      console.error('Failed to delete order', err)
    }
  }

  const deleteSelectedOrders = async () => {
    if (selectedOrders.size === 0) return
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedOrders.size} commande(s) ?`)) return
    try {
      await api.delete('/admin/orders', { data: { ids: Array.from(selectedOrders) } })
      setSelectedOrders(new Set())
      fetchOrders()
    } catch (err) {
      console.error('Failed to delete orders', err)
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    setSelectedOrders(new Set())
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
    setSelectedOrders(new Set())
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
    // No-op for HTML5 audio - doesn't need unlocking
  }, [])

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 5000) // Poll every 5s as backup to socket
    return () => clearInterval(interval)
  }, [fetchOrders])

  useEffect(() => {
    const onNew = (order) => {
      console.log('New order received:', order._id)
      setOrders((prev) => {
        setKnownOrderIds(new Set([...prev.map(o => o._id), order._id]))
        setNewOrderIds(prev => new Set([...prev, order._id]))
        return [order, ...prev]
      })
      if (soundEnabled) playBeep()
      // Remove from new orders after 5 seconds
      setTimeout(() => {
        setNewOrderIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(order._id)
          return newSet
        })
      }, 5000)
    }
    const onUpdate = (order) => {
      setOrders((prev) => prev.map((o) => (o._id === order._id ? order : o)))
    }
    socket.on('new_order', onNew)
    socket.on('order_status_updated', onUpdate)
    return () => {
      socket.off('new_order', onNew)
      socket.off('order_status_updated', onUpdate)
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
          {selectedOrders.size > 0 && (
            <button
              onClick={deleteSelectedOrders}
              className="rounded-lg bg-red-100 text-red-700 px-4 py-2 text-sm font-medium transition hover:bg-red-200"
            >
              Supprimer ({selectedOrders.size})
            </button>
          )}
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
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={selectedOrders.size === filtered.length && filtered.length > 0}
            onChange={toggleSelectAll}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-600">Tout sélectionner</span>
        </div>
        {filtered.map((order) => {
          const isNew = newOrderIds.has(order._id)
          return (
            <div key={order._id} className={`card-luxe p-6 transition hover:shadow-luxe ${isNew ? 'animate-pulse shadow-2xl shadow-hestia-gold/50 border-2 border-hestia-gold bg-hestia-gold/10' : ''}`}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedOrders.has(order._id)}
                    onChange={() => toggleOrderSelection(order._id)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('room')}</p>
                    <p className="font-serif text-2xl text-hestia-navy">{order.roomNumber}</p>
                  </div>
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
                <button
                  onClick={() => deleteOrder(order._id)}
                  className="rounded-lg bg-red-100 text-red-700 px-3 py-1.5 text-xs font-medium transition hover:bg-red-200"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
          )
        })}
      </div>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  )
}
