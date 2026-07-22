import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import api from '../api'

export default function DemoPage() {
  const { t } = useTranslation()
  const [demo, setDemo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/demo')
      .then(res => setDemo(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hestia-cream">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-hestia-linen border-t-hestia-gold" />
      </div>
    )
  }

  if (!demo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hestia-cream p-6">
        <div className="card-luxe w-full max-w-md p-10 text-center">
          <h1 className="text-2xl text-hestia-navy">{t('demoPage.notFound')}</h1>
          <Link to="/" className="btn-outline mt-6 inline-block">{t('back')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-hestia-cream p-6 pt-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-hestia-gold">{t('demoPage.tagline')}</p>
        <h1 className="mt-4 text-4xl font-light text-hestia-navy">{demo.hotel.name}</h1>
        <p className="mx-auto mt-4 max-w-xl text-gray-600">{t('demoPage.instructions')}</p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
        {demo.rooms.map(room => (
          <div key={room.uuid} className="card-luxe p-8 text-center">
            <p className="font-serif text-3xl text-hestia-navy">{t('room')} {room.number}</p>
            <p className="mt-2 text-sm text-gray-400">{t('demoPage.scanOrClick')}</p>
            <Link to={`/room/${room.uuid}`} className="btn-primary mt-6 inline-block">{t('demoPage.openRoom')}</Link>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Link to="/admin/login" className="btn-outline">{t('demoPage.tryStaff')}</Link>
      </div>
    </div>
  )
}
