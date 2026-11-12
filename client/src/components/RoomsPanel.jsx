import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'
import Icon from './Icon'

export default function RoomsPanel() {
  const { t } = useTranslation()
  const [rooms, setRooms] = useState([])
  const [number, setNumber] = useState('')
  const [host, setHost] = useState(window.location.origin)
  const [qrData, setQrData] = useState({})
  const [selectedRooms, setSelectedRooms] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchRooms()
  }, [])

  useEffect(() => {
    if (rooms.length === 0) return
    rooms.forEach(async (room) => {
      try {
        const res = await api.get(`/admin/rooms/${room._id}/qr?baseUrl=${encodeURIComponent(host)}`)
        setQrData(prev => ({ ...prev, [room._id]: res.data }))
      } catch (err) {
        console.error('Failed to load QR', err)
      }
    })
  }, [rooms, host])

  const fetchRooms = async () => {
    try {
      const res = await api.get('/admin/rooms')
      const roomsData = Array.isArray(res.data) ? res.data : []
      setRooms(roomsData)
    } catch (err) {
      console.error('Failed to fetch rooms', err)
      setRooms([])
    }
  }

  const addRoom = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/rooms', { number })
      setNumber('')
      setShowAddForm(false)
      fetchRooms()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add room')
    }
  }

  const toggle = async (id) => {
    try {
      await api.patch(`/admin/rooms/${id}/toggle`)
      fetchRooms()
    } catch (err) {
      console.error('Failed to toggle room', err)
    }
  }

  const deleteRoom = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette chambre ?')) return
    try {
      await api.delete(`/admin/rooms/${id}`)
      fetchRooms()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete room')
    }
  }

  const deleteSelectedRooms = async () => {
    if (selectedRooms.length === 0) return
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedRooms.length} chambre(s) ?`)) return
    try {
      await Promise.all(selectedRooms.map(id => api.delete(`/admin/rooms/${id}`)))
      setSelectedRooms([])
      fetchRooms()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete rooms')
    }
  }

  const toggleSelectRoom = (id) => {
    setSelectedRooms(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  const filteredRooms = rooms.filter(room => {
    if (searchQuery && !room.number.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (statusFilter === 'active' && !room.active) return false
    if (statusFilter === 'inactive' && room.active) return false
    return true
  })

  const escapeHtml = (str) =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const printQr = (room) => {
    const data = qrData[room._id]
    if (!data) return
    const title = escapeHtml(`${t('room')} ${room.number} QR`)
    const heading = escapeHtml(`${t('room')} ${room.number}`)
    const w = window.open('', '', 'width=400,height=500')
    w.document.write(`<html><head><title>${title}</title></head><body style="text-align:center;font-family:Georgia,serif"><h2 style="color:#0B1A2A">${heading}</h2><img src="${data.dataUrl}" /><p style="word-break:break-all;font-size:12px;color:#666">${escapeHtml(data.url)}</p></body></html>`)
    w.document.close()
    w.focus()
    w.print()
    w.close()
  }

  const copyUrl = (room) => {
    const data = qrData[room._id]
    if (data) navigator.clipboard.writeText(data.url)
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-light text-hestia-navy">{t('roomsPanel.title')}</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-hestia-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-hestia-navy-light"
        >
          <Icon name="add" size={18} />
          {t('roomsPanel.addRoom')}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Icon name="search" size={18} color="#6B7280" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une chambre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-luxe w-full pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-luxe w-auto"
        >
          <option value="all">Toutes</option>
          <option value="active">Actives</option>
          <option value="inactive">Inactives</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedRooms.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 p-3 border border-red-200">
          <span className="text-sm font-medium text-red-700">
            {selectedRooms.length} chambre(s) sélectionnée(s)
          </span>
          <button
            onClick={deleteSelectedRooms}
            className="rounded-lg bg-red-500 px-3 py-1 text-sm font-medium text-white transition hover:bg-red-600"
          >
            Supprimer
          </button>
          <button
            onClick={() => setSelectedRooms([])}
            className="text-sm text-gray-500 hover:text-hestia-navy"
          >
            Annuler
          </button>
        </div>
      )}

      {/* QR Base URL */}
      <div className="card-luxe mb-6 p-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {t('roomsPanel.qrBaseUrl')}
        </label>
        <input 
          value={host} 
          onChange={e => setHost(e.target.value)} 
          className="input-luxe mt-1 w-full" 
          placeholder="https://votre-domaine.com"
        />
        <p className="mt-2 text-xs text-gray-500">
          Utilisez cette URL comme base pour les QR codes des chambres
        </p>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <div className="card-luxe p-12 text-center">
          <Icon name="rooms" size={48} color="#D1D5DB" className="mx-auto mb-4" />
          <p className="text-gray-500">Aucune chambre trouvée</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 text-hestia-gold hover:underline"
          >
            Ajouter la première chambre
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map(room => {
            const data = qrData[room._id]
            return (
              <div key={room._id} className={`card-luxe overflow-hidden transition hover:shadow-luxe ${!room.active ? 'opacity-60' : ''}`}>
                {/* Room Header */}
                <div className="border-b border-hestia-linen bg-hestia-cream p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedRooms.includes(room._id)}
                        onChange={() => toggleSelectRoom(room._id)}
                        className="h-4 w-4 rounded border-gray-300 text-hestia-gold focus:ring-hestia-gold"
                      />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          {t('room')}
                        </p>
                        <p className="font-serif text-2xl text-hestia-navy">{room.number}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                      room.active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {room.active ? t('active') : t('inactive')}
                    </span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="p-6">
                  <div className="mb-4 flex flex-col items-center rounded-xl bg-hestia-cream p-4">
                    {data ? (
                      <>
                        <img 
                          src={data.dataUrl} 
                          alt={`QR ${room.number}`} 
                          className="h-40 w-40 rounded-lg"
                        />
                        <p className="mt-3 break-all text-center text-xs text-gray-500">
                          {data.url}
                        </p>
                      </>
                    ) : (
                      <div className="flex h-40 w-40 items-center justify-center">
                        <Icon name="loading" size={32} color="#9CA3AF" />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => toggle(room._id)}
                      className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        room.active
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      <Icon name={room.active ? 'deactivate' : 'activate'} size={16} />
                      {room.active ? t('deactivate') : t('activate')}
                    </button>
                    <button
                      onClick={() => printQr(room)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-hestia-gold/10 px-3 py-2 text-sm font-medium text-hestia-gold transition hover:bg-hestia-gold hover:text-white"
                    >
                      <Icon name="print" size={16} />
                      {t('print')}
                    </button>
                    <button
                      onClick={() => copyUrl(room)}
                      className="flex items-center justify-center gap-2 rounded-lg border border-hestia-linen bg-white px-3 py-2 text-sm font-medium text-hestia-navy transition hover:bg-hestia-linen"
                    >
                      <Icon name="copy" size={16} />
                      {t('copy')}
                    </button>
                    <button
                      onClick={() => deleteRoom(room._id)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                    >
                      <Icon name="delete" size={16} />
                      {t('delete')}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Room Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddForm(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-hestia-linen p-4">
              <h2 className="text-xl font-semibold text-hestia-navy">
                {t('roomsPanel.addRoom')}
              </h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="rounded-full p-2 text-gray-500 transition hover:bg-hestia-cream"
              >
                <Icon name="close" size={24} />
              </button>
            </div>
            
            <form onSubmit={addRoom} className="p-6">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {t('roomsPanel.roomNumber')}
                </label>
                <input
                  value={number}
                  onChange={e => setNumber(e.target.value)}
                  className="input-luxe w-full"
                  required
                  placeholder="Ex: 101, Suite 1, etc."
                  autoFocus
                />
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 rounded-xl border border-hestia-linen bg-white px-4 py-3 font-medium text-hestia-navy transition hover:bg-hestia-linen"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-hestia-navy px-4 py-3 font-medium text-white transition hover:bg-hestia-navy-light"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
