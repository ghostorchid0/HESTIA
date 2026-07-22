import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api'

export default function RoomPage() {
  const { t } = useTranslation()
  const { uuid } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [room, setRoom] = useState(null)

  useEffect(() => {
    api.get(`/room/${uuid}`)
      .then(res => {
        setRoom(res.data.room)
        setStatus('valid')
      })
      .catch(() => setStatus('invalid'))
  }, [uuid])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">{t('roomPage.checking')}</p>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">{t('roomPage.invalidTitle')}</h1>
          <p className="text-gray-600">{t('roomPage.invalidDesc')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
        <h1 className="text-3xl font-bold text-amber-600 mb-2">{t('appName')}</h1>
        <p className="text-gray-600 mb-6">{t('room')} {room.number}</p>
        <button
          onClick={() => navigate(`/room/${uuid}/menu`)}
          className="w-full rounded-xl bg-amber-600 py-3 font-semibold text-white shadow hover:bg-amber-700"
        >
          {t('roomPage.openMenu')}
        </button>
      </div>
    </div>
  )
}
