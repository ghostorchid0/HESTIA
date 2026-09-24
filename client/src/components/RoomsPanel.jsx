import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'

export default function RoomsPanel() {
  const { t } = useTranslation()
  const [rooms, setRooms] = useState([])
  const [number, setNumber] = useState('')
  const [host, setHost] = useState(window.location.origin)
  const [qrData, setQrData] = useState({})
  const [selectedRooms, setSelectedRooms] = useState([])

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
      fetchRooms()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add room')
    }
  }

  const toggle = async (id) => {
    await api.patch(`/admin/rooms/${id}/toggle`)
    fetchRooms()
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

  const toggleSelectAll = () => {
    if (selectedRooms.length === rooms.length) {
      setSelectedRooms([])
    } else {
      setSelectedRooms(rooms.map(r => r._id))
    }
  }

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
      <h1 className="mb-8 text-3xl font-light text-hestia-navy">{t('roomsPanel.title')}</h1>

      <form onSubmit={addRoom} className="card-luxe mb-6 flex gap-4 p-6">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('roomsPanel.roomNumber')}</label>
          <input
            value={number}
            onChange={e => setNumber(e.target.value)}
            className="input-luxe w-full"
            required
          />
        </div>
        <button className="btn-primary self-end">{t('roomsPanel.addRoom')}</button>
      </form>

      {selectedRooms.length > 0 && (
        <div className="card-luxe mb-6 flex items-center justify-between p-4 bg-red-50 border border-red-200">
          <span className="text-sm font-medium text-red-700">{selectedRooms.length} chambre(s) sélectionnée(s)</span>
          <button onClick={deleteSelectedRooms} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600">
            Supprimer
          </button>
        </div>
      )}

      <div className="card-luxe mb-6 p-6">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('roomsPanel.qrBaseUrl')}</label>
        <input value={host} onChange={e => setHost(e.target.value)} className="input-luxe mt-1 w-full" />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          checked={selectedRooms.length === rooms.length && rooms.length > 0}
          onChange={toggleSelectAll}
          className="h-4 w-4 rounded border-gray-300 text-hestia-gold focus:ring-hestia-gold"
        />
        <span className="text-sm text-gray-600">Tout sélectionner</span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map(room => {
          const data = qrData[room._id]
          return (
            <div key={room._id} className="card-luxe p-6 transition hover:shadow-luxe">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedRooms.includes(room._id)}
                    onChange={() => toggleSelectRoom(room._id)}
                    className="h-4 w-4 rounded border-gray-300 text-hestia-gold focus:ring-hestia-gold"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('room')}</p>
                    <p className="font-serif text-2xl text-hestia-navy">{room.number}</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${room.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{room.active ? t('active') : t('inactive')}</span>
              </div>
              <div className="mb-5 flex flex-col items-center rounded-2xl bg-hestia-cream p-6">
                {data ? (
                  <>
                    <img src={data.dataUrl} alt="QR code" className="mb-3 h-36 w-36" />
                    <p className="break-all text-center text-xs text-gray-500">{data.url}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">{t('roomsPanel.loadingQr')}</p>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => toggle(room._id)} className="rounded-lg border border-hestia-linen bg-white py-2 text-xs font-medium text-hestia-navy transition hover:bg-hestia-linen">
                  {room.active ? t('deactivate') : t('activate')}
                </button>
                <button onClick={() => printQr(room)} className="rounded-lg bg-hestia-gold/10 py-2 text-xs font-medium text-hestia-gold transition hover:bg-hestia-gold hover:text-white">
                  {t('print')}
                </button>
                <button onClick={() => copyUrl(room)} className="rounded-lg border border-hestia-linen bg-white py-2 text-xs font-medium text-hestia-navy transition hover:bg-hestia-linen">
                  {t('copy')}
                </button>
                <button onClick={() => deleteRoom(room._id)} className="rounded-lg border border-red-200 bg-red-50 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100">
                  {t('delete')}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
