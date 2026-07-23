import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'

export default function RoomsPanel() {
  const { t } = useTranslation()
  const [rooms, setRooms] = useState([])
  const [number, setNumber] = useState('')
  const [host, setHost] = useState(window.location.origin)
  const [qrData, setQrData] = useState({})

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
    const res = await api.get('/admin/rooms')
    setRooms(res.data)
  }

  const addRoom = async (e) => {
    e.preventDefault()
    await api.post('/admin/rooms', { number })
    setNumber('')
    fetchRooms()
  }

  const toggle = async (id) => {
    await api.patch(`/admin/rooms/${id}/toggle`)
    fetchRooms()
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

      <div className="card-luxe mb-6 p-6">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('roomsPanel.qrBaseUrl')}</label>
        <input value={host} onChange={e => setHost(e.target.value)} className="input-luxe mt-1 w-full" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map(room => {
          const data = qrData[room._id]
          return (
            <div key={room._id} className="card-luxe p-6 transition hover:shadow-luxe">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('room')}</p>
                  <p className="font-serif text-2xl text-hestia-navy">{room.number}</p>
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
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => toggle(room._id)} className="rounded-lg border border-hestia-linen bg-white py-2 text-xs font-medium text-hestia-navy transition hover:bg-hestia-linen">
                  {room.active ? t('deactivate') : t('activate')}
                </button>
                <button onClick={() => printQr(room)} className="rounded-lg bg-hestia-gold/10 py-2 text-xs font-medium text-hestia-gold transition hover:bg-hestia-gold hover:text-white">
                  {t('print')}
                </button>
                <button onClick={() => copyUrl(room)} className="rounded-lg border border-hestia-linen bg-white py-2 text-xs font-medium text-hestia-navy transition hover:bg-hestia-linen">
                  {t('copy')}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
