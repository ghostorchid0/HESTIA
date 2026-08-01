import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api'
import useSettings from '../hooks/useSettings'
import ImageWithFallback from '../components/ImageWithFallback'
import BrandAccent from '../components/BrandAccent'

export default function RoomPage() {
  const { t } = useTranslation()
  const { settings, updateSettings } = useSettings()
  const { uuid } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [room, setRoom] = useState(null)

  useEffect(() => {
    api.get(`/room/${uuid}`)
      .then(res => {
        setRoom(res.data.room)
        if (res.data.hotel) {
          updateSettings({
            hotelId: res.data.hotel._id,
            hotelName: res.data.hotel.name,
            currency: res.data.hotel.currency,
            contactPhone: res.data.hotel.contactPhone,
            address: res.data.hotel.address,
          })
        }
        setStatus('valid')
      })
      .catch(() => setStatus('invalid'))
  }, [uuid, updateSettings])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hestia-cream">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-hestia-linen border-t-hestia-gold" />
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hestia-cream p-6">
        <div className="card-luxe w-full max-w-md p-10 text-center">
          <h1 className="text-3xl text-hestia-navy">{t('roomPage.invalidTitle')}</h1>
          <p className="mt-3 text-gray-600">{t('roomPage.invalidDesc')}</p>
        </div>
      </div>
    )
  }

  return (
    <BrandAccent>
      <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-hestia-linen/60 via-transparent to-transparent" />
        <div className="card-luxe relative z-10 w-full max-w-lg p-8 text-center sm:p-12">
          {settings?.logoUrl && (
            <ImageWithFallback src={settings.logoUrl} alt={settings.hotelName} className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-hestia-cream object-contain p-2" />
          )}
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">{t('tagline')}</p>
          <h1 className="mt-4 text-4xl font-light text-hestia-navy sm:text-5xl">{settings?.hotelName || t('appName')}</h1>
          {settings?.welcomeMessage && (
            <p className="mt-3 text-sm italic text-gray-500">{settings.welcomeMessage}</p>
          )}
          <div className="mx-auto mt-6 h-px w-16 bg-[var(--brand)]" />
          <p className="mt-6 text-base text-gray-600 sm:text-lg">
            {t('room')} <span className="font-serif text-2xl text-hestia-navy">{room.number}</span>
          </p>
          <button
            onClick={() => navigate(`/room/${uuid}/menu`)}
            className="mt-8 w-full rounded-2xl bg-[var(--brand)] px-8 py-3.5 font-sans text-sm font-semibold uppercase tracking-widest text-white shadow-soft transition-all hover:shadow-luxe sm:mt-10"
          >
            {t('roomPage.openMenu')}
          </button>
        </div>
      </div>
    </BrandAccent>
  )
}
