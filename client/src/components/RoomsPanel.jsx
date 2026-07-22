import { useEffect, useState } from 'react'
import api from '../api'

export default function RoomsPanel() {
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

  const printQr = (room) => {
    const data = qrData[room._id]
    if (!data) return
    const w = window.open('', '', 'width=400,height=500')
    w.document.write(`<html><head><title>Room ${room.number} QR</title></head><body style="text-align:center;font-family:sans-serif"><h2>Room ${room.number}</h2><img src="${data.dataUrl}" /><p style="word-break:break-all;font-size:12px">${data.url}</p></body></html>`)
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
      <h1 className="mb-4 text-2xl font-bold">Rooms & QR Codes</h1>
      <form onSubmit={addRoom} className="mb-6 flex gap-2">
        <input
          placeholder="Room number"
          value={number}
          onChange={e => setNumber(e.target.value)}
          className="flex-1 rounded border p-2"
          required
        />
        <button className="rounded-xl bg-amber-600 px-5 py-2 font-semibold text-white">Add Room</button>
      </form>

      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <label className="text-sm font-medium">QR base URL</label>
        <input value={host} onChange={e => setHost(e.target.value)} className="mt-1 w-full rounded border p-2" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map(room => {
          const data = qrData[room._id]
          return (
            <div key={room._id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-lg font-bold">Room {room.number}</span>
                <span className={`rounded px-2 py-0.5 text-xs ${room.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{room.active ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="mb-3 flex flex-col items-center rounded bg-gray-100 p-4">
                {data ? (
                  <>
                    <img src={data.dataUrl} alt="QR code" className="mb-2 h-32 w-32" />
                    <p className="break-all text-center text-xs text-gray-700">{data.url}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Loading QR...</p>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggle(room._id)} className="flex-1 rounded bg-gray-100 py-1.5 text-sm hover:bg-gray-200">
                  {room.active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => printQr(room)} className="flex-1 rounded bg-amber-50 py-1.5 text-sm text-amber-700 hover:bg-amber-100">
                  Print
                </button>
                <button onClick={() => copyUrl(room)} className="flex-1 rounded bg-gray-100 py-1.5 text-sm hover:bg-gray-200">
                  Copy
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
