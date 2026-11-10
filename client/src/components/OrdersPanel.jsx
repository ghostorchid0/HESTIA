import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'
import { socket } from '../socket'
import { playBeep } from '../utils/beep'
import { formatCurrency } from '../utils/format'
import useSettings from '../hooks/useSettings'
import Pagination from './Pagination'
import LordIcon from './LordIcon'

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
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('hestia_sound')
    return stored === null ? true : stored === 'true'
  })
  const [knownOrderIds, setKnownOrderIds] = useState(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedOrders, setSelectedOrders] = useState(new Set())
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    room: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage
      })
      
      if (filters.status) params.append('status', filters.status)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.room) params.append('room', filters.room)
      
      const res = await api.get(`/admin/orders?${params.toString()}`)
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
  }, [currentPage, itemsPerPage, soundEnabled, knownOrderIds, filters])

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

  const applyFilters = () => {
    setCurrentPage(1)
    setSelectedOrders(new Set())
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      room: ''
    })
    setCurrentPage(1)
    setSelectedOrders(new Set())
  }

  const downloadExcel = async () => {
    const token = localStorage.getItem('hestia_token')
    const params = new URLSearchParams()
    
    if (filters.status) params.append('status', filters.status)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.room) params.append('room', filters.room)
    
    const res = await fetch(`/api/admin/orders/export?${params.toString()}`, {
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

  const downloadPDF = async () => {
    const token = localStorage.getItem('hestia_token')
    const params = new URLSearchParams()
    
    if (filters.status) params.append('status', filters.status)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.room) params.append('room', filters.room)
    
    const res = await fetch(`/api/admin/orders/export-pdf?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'hestia-orders.pdf'
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
      setOrders((prev) => {
        setKnownOrderIds(new Set([...prev.map(o => o._id), order._id]))
        return [order, ...prev]
      })
      if (soundEnabled) playBeep()
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

  const getTimeElapsed = (createdAt) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffMs = now - created
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMinutes / 60)

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes % 60}m`
    }
    return `${diffMinutes}m`
  }

  const isUrgent = (createdAt) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffMs = now - created
    const diffMinutes = Math.floor(diffMs / 60000)
    return diffMinutes > 1 // Changed from 15 to 1 minute
  }

  const groupByRoom = (orders) => {
    const grouped = {}
    orders.forEach(order => {
      const room = order.roomNumber || 'N/A'
      if (!grouped[room]) {
        grouped[room] = []
      }
      grouped[room].push(order)
    })
    return grouped
  }

  const groupedOrders = groupByRoom(orders)

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-light text-hestia-navy">{t('ordersPanel.title')}</h1>
        <div className="flex items-center gap-3">
          {selectedOrders.size > 0 && (
            <button
              onClick={deleteSelectedOrders}
              className="inline-flex items-center gap-1 rounded-lg bg-red-100 text-red-700 px-4 py-2 text-sm font-medium transition hover:bg-red-200 hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer ({selectedOrders.size})
            </button>
          )}
          <button
            onClick={toggleSound}
            className={`inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition ${soundEnabled ? 'bg-hestia-gold/10 text-hestia-gold hover:bg-hestia-gold hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <LordIcon name="sound" size={20} trigger="hover" colors={`primary:${soundEnabled ? '#B8860B' : '#4B5563'}`} />
            {soundEnabled ? 'Son ON' : 'Son OFF'}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-1 rounded-lg border border-hestia-linen bg-white px-4 py-2 text-sm font-medium text-hestia-navy transition hover:bg-hestia-linen hover:border-hestia-gold"
          >
            <LordIcon name="filter" size={20} trigger="hover" colors="primary:#0B1A2A" />
            Filtres
          </button>
          <button onClick={downloadExcel} className="inline-flex items-center gap-1 rounded-lg border border-hestia-linen bg-white px-4 py-2 text-sm font-medium text-hestia-navy transition hover:bg-hestia-linen hover:border-hestia-gold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel
          </button>
          <button onClick={downloadPDF} className="inline-flex items-center gap-1 rounded-lg border border-hestia-linen bg-white px-4 py-2 text-sm font-medium text-hestia-navy transition hover:bg-hestia-linen hover:border-hestia-gold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card-luxe p-6 mb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Statut</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="input-luxe w-full"
              >
                <option value="">Tous</option>
                {allStatuses.map((s) => (
                  <option key={s} value={s}>{t(`status.${s}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Date début</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="input-luxe w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Date fin</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="input-luxe w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Chambre</label>
              <input
                type="text"
                value={filters.room}
                onChange={(e) => setFilters({ ...filters, room: e.target.value })}
                placeholder="Numéro de chambre"
                className="input-luxe w-full"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={applyFilters} className="btn-primary inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Appliquer
            </button>
            <button onClick={clearFilters} className="btn-outline inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Réinitialiser
            </button>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={selectedOrders.size === orders.length && orders.length > 0}
            onChange={toggleSelectAll}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-600">Tout sélectionner</span>
        </div>
        {orders.length === 0 ? (
          <div className="card-luxe p-12 text-center">
            <p className="text-gray-500">Aucune commande trouvée</p>
          </div>
        ) : (
          Object.entries(groupedOrders).map(([room, roomOrders]) => (
            <div key={room} className="card-luxe p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LordIcon name="home" size={28} trigger="loop" colors="primary:#0B1A2A" />
                  <h2 className="text-xl font-serif text-hestia-navy">Chambre {room}</h2>
                  <span className="rounded-full bg-hestia-gold/20 px-3 py-1 text-sm font-medium text-hestia-gold">
                    {roomOrders.length} commande(s)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {roomOrders.some(o => isUrgent(o.createdAt)) && (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                      URGENT
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                {roomOrders.map((order) => {
                  const urgent = isUrgent(order.createdAt)
                  const timeElapsed = getTimeElapsed(order.createdAt)
                  
                  return (
                    <div key={order._id} className={`rounded-xl border p-4 ${urgent ? 'border-red-300 bg-red-50' : 'border-hestia-linen bg-white'}`}>
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedOrders.has(order._id)}
                            onChange={() => toggleOrderSelection(order._id)}
                            className="w-4 h-4"
                          />
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('ordersPanel.order')}</p>
                            <p className="font-serif text-lg text-hestia-navy">#{order._id.slice(-6)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={statusBadge(order.status)}>{t(`status.${order.status}`)}</span>
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${urgent ? 'text-red-600' : 'text-gray-500'}`}>
                            <LordIcon name="order" size={16} trigger="loop" colors={`primary:${urgent ? '#DC2626' : '#6B7280'}`} />
                            {timeElapsed}
                          </span>
                          <span className="text-xs text-gray-500">{t(`paymentMethods.${paymentMethodKeys[order.paymentMethod] || 'cashOnDelivery'}`)}</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {t(`paymentStatus.${order.paymentStatus || 'Pending'}`)}
                          </span>
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
                                className="inline-flex items-center gap-1 rounded-lg border border-hestia-linen bg-white px-3 py-1.5 text-xs font-medium text-hestia-navy transition hover:bg-hestia-linen hover:border-hestia-gold"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {t(`status.${s}`)}
                              </button>
                            ))}
                          <button
                            onClick={() => togglePayment(order)}
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${order.paymentStatus === 'Paid' ? 'border border-hestia-linen bg-white text-hestia-navy hover:bg-hestia-linen hover:border-hestia-gold' : 'bg-hestia-gold/10 text-hestia-gold hover:bg-hestia-gold hover:text-white'}`}
                          >
                            {order.paymentStatus === 'Paid' ? (
                              <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {t('ordersPanel.markPending')}
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {t('ordersPanel.markPaid')}
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => deleteOrder(order._id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-100 text-red-700 px-3 py-1.5 text-xs font-medium transition hover:bg-red-200 hover:scale-105"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
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
